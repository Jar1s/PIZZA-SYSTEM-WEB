'use client';

import { useState, useEffect } from 'react';
import { useCart, useCartTotal } from '@/hooks/useCart';
import { createOrder, createPaymentSession } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { formatModifiers } from '@/lib/format-modifiers';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';
import { validateReturnUrl } from '@/lib/validate-return-url';

interface Address {
  id: string;
  street: string;
  description?: string;
  city: string;
  postalCode: string;
  country: string;
  isPrimary: boolean;
}

export default function CheckoutPage() {
  const { items, clearCart } = useCart();
  const total = useCartTotal();
  const router = useRouter();
  const { user, loading: authLoading, setUser } = useCustomerAuth();
  const [loading, setLoading] = useState(false);
  const [tenant, setTenant] = useState('pornopizza');
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  
  useEffect(() => {
    // FIRST: Check if user should be on a different page (e.g., account) - do this BEFORE anything else
    // This MUST happen synchronously at the very start, before any other logic
    if (typeof window !== 'undefined') {
      const oauthReturnUrl = sessionStorage.getItem('oauth_returnUrl');
      if (oauthReturnUrl) {
        // Validate returnUrl to prevent open redirect attacks
        const validatedReturnUrl = validateReturnUrl(oauthReturnUrl);
        if (validatedReturnUrl && !validatedReturnUrl.includes('/checkout')) {
          // User was supposed to go to a different page (e.g., account), redirect them there immediately
          console.log('Checkout - OAuth returnUrl indicates user should be on different page, redirecting IMMEDIATELY to:', validatedReturnUrl);
          // Clear flags immediately
          sessionStorage.removeItem('oauth_redirect');
          sessionStorage.removeItem('oauth_returnUrl');
          // Redirect immediately - don't wait for anything
          window.location.replace(validatedReturnUrl);
          return;
        } else if (!validatedReturnUrl) {
          // Invalid returnUrl, clear it
          console.log('Checkout - Invalid oauth_returnUrl, clearing it');
          sessionStorage.removeItem('oauth_returnUrl');
        } else {
          // Valid returnUrl but it's for checkout - that's fine, clear it and continue
          console.log('Checkout - oauth_returnUrl is for checkout, clearing it and continuing');
          sessionStorage.removeItem('oauth_returnUrl');
        }
      }
    }
    
    // Get tenant from query or default
    const params = new URLSearchParams(window.location.search);
    setTenant(params.get('tenant') || 'pornopizza');
    
    // Check if user just came from OAuth redirect - check this AFTER checking returnUrl
    const fromOAuth = typeof window !== 'undefined' && sessionStorage.getItem('oauth_redirect') === 'true';
    
    // Check localStorage directly for user token (context might not be loaded yet)
    const token = typeof window !== 'undefined' ? localStorage.getItem('customer_auth_token') : null;
    const storedUser = typeof window !== 'undefined' ? localStorage.getItem('customer_auth_user') : null;
    const hasUserInStorage = !!(token && storedUser);
    
    console.log('Checkout useEffect - fromOAuth:', fromOAuth, 'items.length:', items.length, 'authLoading:', authLoading, 'user:', !!user, 'hasUserInStorage:', hasUserInStorage);
    
    // Wait for auth to load before checking
    if (authLoading) {
      console.log('Checkout - waiting for auth to load');
      return;
    }
    
    // Redirect to login if not authenticated (but NOT if coming from OAuth - tokens might still be loading)
    // Check both context user AND localStorage to be sure - user might be in localStorage but context not loaded yet
    if (!user && !hasUserInStorage && !fromOAuth) {
      console.log('Checkout - not authenticated and not from OAuth, redirecting to login');
      // Redirect to login without returnUrl - after login, user will be redirected back to checkout
      // Use window.location for full page reload to ensure correct route
      window.location.href = `/auth/login?tenant=${tenant}`;
      return;
    }
    
    // If user exists in localStorage but not in context yet, wait a moment for context to load
    // This handles the case where user clicks checkout quickly after login
    if (!user && hasUserInStorage && !fromOAuth) {
      console.log('Checkout - user exists in localStorage but context not loaded yet, waiting for context...');
      const waitForContext = setTimeout(() => {
        // Re-check - if context still doesn't have user, but localStorage does, that's OK
        // Context should load it soon, or we can continue anyway since we have token
        const finalToken = localStorage.getItem('customer_auth_token');
        const finalStoredUser = localStorage.getItem('customer_auth_user');
        
        if (!finalToken || !finalStoredUser) {
          console.log('Checkout - tokens removed during wait, redirecting to login');
          window.location.href = `/auth/login?tenant=${tenant}`;
        } else {
          console.log('Checkout - tokens still exist, context should load user soon');
          // Don't redirect - context will load user and useEffect will re-run
        }
      }, 500); // Short wait - just enough for context to update
      return () => clearTimeout(waitForContext);
    }
    
    // If from OAuth but no user yet, wait a bit for tokens to be loaded
    if (!user && !hasUserInStorage && fromOAuth) {
      console.log('Checkout - from OAuth but no user yet, waiting for tokens to load');
      const waitForUser = setTimeout(() => {
        const token = localStorage.getItem('customer_auth_token');
        const storedUser = localStorage.getItem('customer_auth_user');
        if (!token || !storedUser) {
          console.log('Checkout - OAuth tokens not found after wait, redirecting to login');
          sessionStorage.removeItem('oauth_redirect');
          window.location.href = `/auth/login?tenant=${tenant}`;
        }
      }, 2000);
      return () => clearTimeout(waitForUser);
    }
    
    // Wait a bit for cart to load from localStorage (zustand persist)
    // Check cart from localStorage directly if items array is empty
    if (items.length === 0) {
      
      // Give cart time to hydrate from localStorage (especially after OAuth redirect)
      // Don't redirect immediately - wait for zustand to hydrate
      const checkCart = setTimeout(() => {
        const cartStorage = localStorage.getItem('cart-storage');
        if (cartStorage) {
          try {
            const cartData = JSON.parse(cartStorage);
            if (cartData.state && cartData.state.items && cartData.state.items.length > 0) {
              // Cart has items in localStorage, just wait for zustand to hydrate
              console.log('Checkout - cart has items in localStorage, waiting for zustand to hydrate');
              // Clear OAuth flag since cart is found
              if (fromOAuth) {
                sessionStorage.removeItem('oauth_redirect');
              }
              // Don't redirect - zustand will update items array soon
              return;
            }
          } catch (e) {
            console.error('Checkout - invalid cart data:', e);
          }
        }
        
        // If user came from OAuth, don't redirect to homepage - just wait for cart to hydrate
        // After OAuth, cart might take time to hydrate, but we should stay on checkout
        if (fromOAuth) {
          console.log('Checkout - user came from OAuth, waiting for cart to hydrate (no redirect)');
          
          // Wait for cart to hydrate, but don't redirect to homepage
          // Just keep checking and clear the flag when cart loads
          const oauthCheck = setInterval(() => {
            const finalCartStorage = localStorage.getItem('cart-storage');
            const finalItems = items.length; // Check zustand state too
            
            if (finalItems > 0) {
              // Items loaded in zustand, clear flag and stop checking
              console.log('Checkout - items loaded in zustand after OAuth');
              sessionStorage.removeItem('oauth_redirect');
              clearInterval(oauthCheck);
              return;
            }
            
            if (finalCartStorage) {
              try {
                const finalCartData = JSON.parse(finalCartStorage);
                if (finalCartData.state && finalCartData.state.items && finalCartData.state.items.length > 0) {
                  // Cart has items in localStorage, clear flag and stop checking
                  console.log('Checkout - cart found in localStorage after OAuth');
                  sessionStorage.removeItem('oauth_redirect');
                  clearInterval(oauthCheck);
                  return;
                }
              } catch (e) {
                // Invalid cart data
              }
            }
          }, 500); // Check every 500ms
          
          // Clear flag after 15 seconds even if cart doesn't load (safety timeout)
          setTimeout(() => {
            clearInterval(oauthCheck);
            sessionStorage.removeItem('oauth_redirect');
            console.log('Checkout - OAuth flag cleared after timeout');
          }, 15000);
          
          return () => clearInterval(oauthCheck);
        } else {
          // Not from OAuth - normal flow, wait shorter time
          console.log('Checkout - cart appears empty (not from OAuth), waiting before redirect');
          
          // Double-check OAuth flag wasn't set in the meantime
          const stillFromOAuth = typeof window !== 'undefined' && sessionStorage.getItem('oauth_redirect') === 'true';
          if (stillFromOAuth) {
            console.log('Checkout - OAuth flag detected during wait, switching to OAuth flow');
            // Switch to OAuth flow - don't redirect
            return;
          }
          
          // Wait even longer (total 5 seconds) before redirecting
          const finalCheck = setTimeout(() => {
            // Final check - if cart is still empty, redirect to home
            const finalCartStorage = localStorage.getItem('cart-storage');
            const finalItems = items.length; // Check zustand state too
            
            // Check OAuth flag one more time
            const finalOAuthCheck = typeof window !== 'undefined' && sessionStorage.getItem('oauth_redirect') === 'true';
            if (finalOAuthCheck) {
              console.log('Checkout - OAuth flag still set, not redirecting');
              return;
            }
            
            if (finalItems > 0) {
              // Items loaded in zustand, don't redirect
              console.log('Checkout - items loaded in zustand, staying on checkout');
              return;
            }
            
            if (finalCartStorage) {
              try {
                const finalCartData = JSON.parse(finalCartStorage);
                if (finalCartData.state && finalCartData.state.items && finalCartData.state.items.length > 0) {
                  // Cart has items, just wait for zustand
                  console.log('Checkout - cart found in localStorage, waiting for zustand');
                  return;
                }
              } catch (e) {
                // Invalid cart data
              }
            }
            
            // Cart is really empty after all checks, redirect to home
            console.log('Checkout - cart is empty after all checks, redirecting to home');
            router.push('/');
          }, 3000); // Additional 3 seconds (total 5 seconds)
          
          return () => clearTimeout(finalCheck);
        }
      }, 2000); // Initial 2 seconds
      
      return () => clearTimeout(checkCart);
    } else {
      // Cart has items, clear OAuth flag if set
      sessionStorage.removeItem('oauth_redirect');
    }
  }, [items, router, tenant, user, authLoading]);
  
  // Fetch addresses and update user profile when user is loaded
  useEffect(() => {
    if (user) {
      fetchAddresses();
      fetchUserProfile(); // Fetch latest user profile to get phone number
    }
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const token = localStorage.getItem('customer_auth_token');
      
      if (!token || !user) {
        return;
      }
      
      const res = await fetch(`${API_URL}/api/customer/account/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (res.ok) {
        const data = await res.json();
        // Update user in context and localStorage with latest profile data
        if (setUser) {
          const updatedUser = {
            ...user,
            name: data.name || user.name,
            email: data.email || user.email,
            phone: data.phone || user.phone,
            phoneVerified: data.phoneVerified !== undefined ? data.phoneVerified : user.phoneVerified,
          };
          setUser(updatedUser);
          localStorage.setItem('customer_auth_user', JSON.stringify(updatedUser));
        }
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    }
  };

  const fetchAddresses = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const token = localStorage.getItem('customer_auth_token');
      
      if (!token) {
        setLoadingAddresses(false);
        return;
      }
      
      const res = await fetch(`${API_URL}/api/customer/account/addresses`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (res.ok) {
        const data = await res.json();
        const fetchedAddresses = data.addresses || [];
        setAddresses(fetchedAddresses);
        
        // Only set default address if no address is currently selected
        // or if the currently selected address no longer exists
        setSelectedAddressId((currentId) => {
          // If an address is already selected and it still exists, keep it
          if (currentId && fetchedAddresses.find((addr: Address) => addr.id === currentId)) {
            return currentId;
          }
          
          // Otherwise, select primary address or first address
          const primaryAddress = fetchedAddresses.find((addr: Address) => addr.isPrimary);
          if (primaryAddress) {
            return primaryAddress.id;
          } else if (fetchedAddresses.length > 0) {
            return fetchedAddresses[0].id;
          }
          return null;
        });
      }
    } catch (error) {
      console.error('Failed to fetch addresses:', error);
    } finally {
      setLoadingAddresses(false);
    }
  };
  
  const handlePay = async () => {
    if (!user) {
      alert('Please log in to continue');
      return;
    }

    // Check if user has at least one address
    if (addresses.length === 0) {
      alert('Musíte mať vyplnenú adresu pred vytvorením objednávky. Presmerovávam na stránku pre pridanie adresy.');
      router.push(`/account?tenant=${tenant}&section=address`);
      return;
    }

    // Check if address is selected
    if (!selectedAddressId) {
      alert('Prosím, vyberte adresu pre doručenie.');
      return;
    }

    const selectedAddress = addresses.find(addr => addr.id === selectedAddressId);
    if (!selectedAddress) {
      alert('Vybraná adresa nebola nájdená. Prosím, vyberte inú adresu.');
      return;
    }

    setLoading(true);
    
    try {
      // Create order with user data from authentication
      // Ensure email is provided - it's required for order history
      if (!user.email) {
        alert('Email is required to create an order. Please update your profile.');
        setLoading(false);
        return;
      }

      const order = await createOrder(tenant, {
        customer: {
          name: user.name || 'Customer',
          email: user.email.trim().toLowerCase(), // Normalize email for consistent matching
          phone: user.phone || '', // Use phone from user profile if available
        },
        address: {
          street: selectedAddress.street,
          city: selectedAddress.city,
          postalCode: selectedAddress.postalCode,
          country: selectedAddress.country || 'SK',
        },
        items: items.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          modifiers: item.modifiers,
        })),
      });
      
      // Clear cart after successful order creation
      clearCart();
      
      // Create payment session
      try {
        const payment = await createPaymentSession(order.id);
        
        if (payment.redirectUrl) {
          // Redirect to payment gateway (Adyen, GoPay, or WePay)
          window.location.href = payment.redirectUrl;
          return;
        }
      } catch (paymentError) {
        console.error('Payment session creation failed:', paymentError);
        // Continue to success page even if payment fails (for testing)
        // In production, you might want to show an error or retry
      }
      
      // If no redirect URL, go to success page
      router.push(`/order/success?orderId=${order.id}`);
    } catch (error) {
      console.error('Checkout error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to process order';
      
      // Check if it's a product validation error
      if (errorMessage.includes('not found') || errorMessage.includes('inactive')) {
        alert('Some items in your cart are no longer available. Please refresh the page and add items again.');
        // Clear cart and redirect
        clearCart();
        router.push('/');
      } else {
        alert(`Failed to process order: ${errorMessage}. Please try again.`);
      }
    } finally {
      setLoading(false);
    }
  };
  
  // CRITICAL: Check if user should be redirected to a different page (e.g., account)
  // This MUST be the FIRST check, before ANY rendering, including loading states
  // This prevents "Načítavam košík..." from showing when user should be on account page
  if (typeof window !== 'undefined') {
    const oauthReturnUrl = sessionStorage.getItem('oauth_returnUrl');
    console.log('Checkout render - oauth_returnUrl:', oauthReturnUrl);
    if (oauthReturnUrl) {
      const validatedReturnUrl = validateReturnUrl(oauthReturnUrl);
      console.log('Checkout render - validatedReturnUrl:', validatedReturnUrl);
      if (validatedReturnUrl && !validatedReturnUrl.includes('/checkout')) {
        // User should be on account page, don't render anything - useEffect will redirect
        // But also trigger redirect immediately in case useEffect hasn't run yet
        console.log('Checkout render - redirecting IMMEDIATELY to account:', validatedReturnUrl);
        window.location.replace(validatedReturnUrl);
        return null;
      }
    }
  }

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-orange-600"></div>
          <p className="mt-4 text-lg text-gray-700">Načítavam...</p>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated (handled in useEffect)
  if (!user) {
    return null;
  }
  
  // Check if user came from OAuth - if so, show checkout even if cart is empty (cart might still be hydrating)
  // BUT: Only if oauth_returnUrl doesn't exist or is for checkout
  const fromOAuth = typeof window !== 'undefined' && sessionStorage.getItem('oauth_redirect') === 'true';
  const hasOAuthReturnUrl = typeof window !== 'undefined' && sessionStorage.getItem('oauth_returnUrl') !== null;
  const oauthReturnUrlForCheckout = typeof window !== 'undefined' ? (() => {
    const url = sessionStorage.getItem('oauth_returnUrl');
    return url && validateReturnUrl(url) && url.includes('/checkout');
  })() : false;
  
  // If cart is empty and user didn't come from OAuth, don't render (will redirect in useEffect)
  if (items.length === 0 && !fromOAuth) {
    return null;
  }
  
  // If cart is empty but user came from OAuth, show loading state (cart is hydrating)
  // BUT: Only if oauth_returnUrl doesn't exist or is for checkout (not for account)
  if (items.length === 0 && fromOAuth && (!hasOAuthReturnUrl || oauthReturnUrlForCheckout)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-orange-600"></div>
          <p className="mt-4 text-lg text-gray-700">Načítavam košík...</p>
        </div>
      </div>
    );
  }
  
  // If cart is empty and oauth_returnUrl exists but is NOT for checkout, don't show loading
  // (User should be redirected to account, which is handled above)
  if (items.length === 0 && hasOAuthReturnUrl && !oauthReturnUrlForCheckout) {
    return null; // useEffect will handle redirect
  }

  // Show message if no addresses
  if (!loadingAddresses && addresses.length === 0 && user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="container mx-auto px-4 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-md p-8 text-center"
          >
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-primary)' }}>
              Adresa je povinná
            </h2>
            <p className="text-gray-700 mb-6">
              Pred vytvorením objednávky musíte mať vyplnenú adresu pre doručenie.
            </p>
            <button
              onClick={() => router.push(`/account?tenant=${tenant}&section=address`)}
              className="w-full py-3 rounded-lg text-white font-semibold text-lg"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              Pridať adresu
            </button>
            <button
              type="button"
              onClick={() => router.push('/')}
              className="w-full py-3 mt-4 rounded-lg border-2 font-semibold text-lg"
              style={{ 
                borderColor: 'var(--color-primary)',
                color: 'var(--color-primary)'
              }}
            >
              Späť na menu
            </button>
          </motion.div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-md p-8"
        >
          <h1 className="text-3xl font-bold mb-8" style={{ color: 'var(--color-primary)' }}>
            Checkout
          </h1>
          
          {/* Order Summary */}
          <div className="mb-8 pb-8 border-b">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
            {items.map(item => {
              const modifiers = formatModifiers(item.modifiers);
              return (
                <div key={item.id} className="mb-4 pb-4 border-b last:border-b-0">
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex-1">
                      <div className="font-semibold">{item.product.name} x {item.quantity}</div>
                      {modifiers.length > 0 && (
                        <div className="text-sm text-gray-600 mt-1 space-y-0.5">
                          {modifiers.map((mod, idx) => (
                            <div key={idx} className="text-xs">• {mod}</div>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="font-semibold ml-4">€{((item.product.priceCents * item.quantity) / 100).toFixed(2)}</span>
                  </div>
                </div>
              );
            })}
            <div className="flex justify-between text-xl font-bold mt-4 pt-4 border-t">
              <span>Total:</span>
              <span>€{(total / 100).toFixed(2)}</span>
            </div>
          </div>
          
          {/* Customer Info (read-only, from authentication) */}
          <div className="mb-8 pb-8 border-b">
            <h2 className="text-xl font-semibold mb-4">Customer Information</h2>
            <div className="space-y-2 text-gray-700">
              <div><strong>Name:</strong> {user.name || 'N/A'}</div>
              <div><strong>Email:</strong> {user.email || 'N/A'}</div>
              {user.phone && (
                <div>
                  <strong>Phone:</strong> {user.phone}
                  {user.phoneVerified && (
                    <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      ✓ Verified
                    </span>
                  )}
                </div>
              )}
              {!user.phone && (
                <div className="text-sm text-gray-500 italic">
                  Phone number not provided
                </div>
              )}
            </div>
          </div>
          
          {/* Address Selection */}
          {!loadingAddresses && addresses.length > 0 && (
            <div className="mb-8 pb-8 border-b">
              <h2 className="text-xl font-semibold mb-4">Adresa pre doručenie</h2>
              <div className="space-y-3">
                {addresses.map((address) => (
                  <label
                    key={address.id}
                    onClick={() => {
                      setSelectedAddressId(address.id);
                    }}
                    className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      selectedAddressId === address.id
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="address"
                      value={address.id}
                      checked={selectedAddressId === address.id}
                      onChange={() => {
                        setSelectedAddressId(address.id);
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      className="mt-1 mr-3 cursor-pointer"
                    />
                    <div className="flex-1">
                      <div className="font-semibold">
                        {address.street}
                        {address.isPrimary && (
                          <span className="ml-2 text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                            Primárna
                          </span>
                        )}
                      </div>
                      {address.description && (
                        <div className="text-sm text-gray-600 mt-1">{address.description}</div>
                      )}
                      <div className="text-sm text-gray-600 mt-1">
                        {address.postalCode} {address.city}, {address.country}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
              <button
                type="button"
                onClick={() => router.push(`/account?tenant=${tenant}&section=address`)}
                className="mt-4 text-sm font-medium hover:underline"
                style={{ color: 'var(--color-primary)' }}
              >
                + Pridať novú adresu
              </button>
            </div>
          )}
          
          {/* Payment Button */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handlePay}
            disabled={loading || loadingAddresses || addresses.length === 0}
            className="w-full py-3 rounded-lg text-white font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            {loading ? 'Processing...' : 'Pay Now'}
          </motion.button>
          
          <button
            type="button"
            onClick={() => router.push('/')}
            className="w-full py-3 mt-4 rounded-lg border-2 font-semibold text-lg"
            style={{ 
              borderColor: 'var(--color-primary)',
              color: 'var(--color-primary)'
            }}
          >
            Back to Menu
          </button>
        </motion.div>
      </div>
    </div>
  );
}


