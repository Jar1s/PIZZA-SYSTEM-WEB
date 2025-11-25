'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useCart, useCartTotal } from '@/hooks/useCart';
import { createOrder, createPaymentSession, calculateDeliveryFee, validateMinOrder } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { formatModifiers } from '@/lib/format-modifiers';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';
import { useTenant } from '@/contexts/TenantContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { validateReturnUrl } from '@/lib/validate-return-url';
import { getTenant } from '@/lib/api';
import { geocodeAddress, validateBratislavaAddressSimple } from '@/lib/geocoding';
import { isDarkTheme, getBackgroundClass, getButtonGradientClass, getButtonStyle, withTenantThemeDefaults } from '@/lib/tenant-utils';
import { isCurrentlyOpen } from '@/lib/opening-hours';

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
  const { tenant: tenantData } = useTenant();
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [tenantSlug, setTenantSlug] = useState('pornopizza');
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  
  // Get normalized tenant theme (ensures PornoPizza never uses legacy orange)
  const normalizedTenant = withTenantThemeDefaults(tenantData);
  const primaryColor = normalizedTenant?.theme?.primaryColor || 'var(--color-primary)';
  
  // Get layout config from tenant theme
  const isDark = isDarkTheme(tenantData);
  const backgroundClass = getBackgroundClass(tenantData);
  
  // Check maintenance mode (manual or automatic based on opening hours)
  const maintenanceMode = useMemo(() => {
    if (!normalizedTenant) return false;
    const manualMaintenanceMode = normalizedTenant.theme?.maintenanceMode === true;
    const openingHours = (normalizedTenant.theme as any)?.openingHours;
    const autoMaintenanceMode = openingHours ? !isCurrentlyOpen(openingHours) : false;
    return manualMaintenanceMode || autoMaintenanceMode;
  }, [normalizedTenant]);

  // Guest checkout state
  const [guestData, setGuestData] = useState({
    name: '',
    email: '',
    phone: '',
    phonePrefix: '+421', // Default Slovak prefix
    street: '',
    houseNumber: '',
    city: '',
    postalCode: '',
    country: 'SK',
    instructions: '',
  });
  
  const [paymentType, setPaymentType] = useState<'online' | 'cash_on_delivery'>('online');
  const [saveAccount, setSaveAccount] = useState(false);
  const [cashOnDeliveryMethod, setCashOnDeliveryMethod] = useState<'cash' | 'card' | null>(null);
  const [paymentConfig, setPaymentConfig] = useState({
    cashOnDeliveryEnabled: false,
    cardOnDeliveryEnabled: false,
  });
  const [addressValidationError, setAddressValidationError] = useState<string | null>(null);
  const [isValidatingAddress, setIsValidatingAddress] = useState(false);
  const [geocodingTimeout, setGeocodingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [deliveryFeeCents, setDeliveryFeeCents] = useState<number>(0);
  const [minOrderCents, setMinOrderCents] = useState<number | null>(null);
  const [zoneName, setZoneName] = useState<string | null>(null);
  const [deliveryFeeLoading, setDeliveryFeeLoading] = useState(false);
  const [deliveryFeeError, setDeliveryFeeError] = useState<string | null>(null);
  const [deliveryFeeFeatureEnabled, setDeliveryFeeFeatureEnabled] = useState(true);

  // Calculate delivery fee when address changes
  useEffect(() => {
    const calculateFee = async () => {
      let address: { postalCode?: string; city?: string; cityPart?: string } | null = null;

      if (user && selectedAddressId) {
        const selectedAddress = addresses.find(addr => addr.id === selectedAddressId);
        if (selectedAddress) {
          console.log('[Checkout] Recalculating delivery fee for selected address:', {
            addressId: selectedAddressId,
            street: selectedAddress.street,
            city: selectedAddress.city,
            postalCode: selectedAddress.postalCode,
            userId: user?.id,
            userEmail: user?.email,
          });
          address = {
            postalCode: selectedAddress.postalCode,
            city: selectedAddress.city,
          };
        }
      } else if (!user && guestData.postalCode && guestData.city) {
        address = {
          postalCode: guestData.postalCode,
          city: guestData.city,
          // Try to extract city part from city name (e.g., "Bratislava - Jarovce" -> "Jarovce")
          cityPart: guestData.city.includes(' - ') 
            ? guestData.city.split(' - ')[1] 
            : guestData.city,
        };
      }

      if (!address || !address.postalCode || !address.city) {
        setDeliveryFeeCents(0);
        setMinOrderCents(null);
        setZoneName(null);
        setDeliveryFeeError(null);
        return;
      }

      if (!deliveryFeeFeatureEnabled) {
        setDeliveryFeeError(null);
        return;
      }

      setDeliveryFeeLoading(true);
      setDeliveryFeeError(null);

      try {
        const result = await calculateDeliveryFee(tenantSlug, address);
        
        if (result.available) {
          setDeliveryFeeCents(result.deliveryFeeCents || 0);
          setMinOrderCents(result.minOrderCents || null);
          setZoneName(result.zoneName || null);
          setDeliveryFeeError(null);
          if (!deliveryFeeFeatureEnabled) {
            setDeliveryFeeFeatureEnabled(true);
          }
        } else {
          setDeliveryFeeCents(0);
          setMinOrderCents(null);
          setZoneName(null);
          setDeliveryFeeError(result.message || 'Doprava nie je dostupná pre túto adresu');
        }
      } catch (error: any) {
        console.error('Failed to calculate delivery fee:', error);
        // Show error instead of hiding it - allow retry
        setDeliveryFeeError('Nepodarilo sa načítať cenu dopravy. Skúste znova.');
        setDeliveryFeeCents(0);
        setMinOrderCents(null);
        setZoneName(null);
        // Don't disable deliveryFeeFeatureEnabled - allow retry on next address change
      } finally {
        setDeliveryFeeLoading(false);
      }
    };

    calculateFee();
  }, [user, selectedAddressId, addresses, guestData.postalCode, guestData.city, tenantSlug, deliveryFeeFeatureEnabled]);

  useEffect(() => {
    const layout = tenantData?.theme?.layout || {};
    if (layout.useCustomBackground && layout.customBackgroundClass === 'porno-bg') {
      document.body.classList.add('bg-porno-vibe');
      return () => {
        document.body.classList.remove('bg-porno-vibe');
      };
    }
  }, [tenantData]);
  
  // Cleanup geocoding timeout on unmount
  useEffect(() => {
    return () => {
      if (geocodingTimeout) {
        clearTimeout(geocodingTimeout);
      }
    };
  }, [geocodingTimeout]);
  
  // Initialize tenant slug and handle OAuth redirects (only once on mount)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Handle OAuth returnUrl redirect
    const oauthReturnUrl = sessionStorage.getItem('oauth_returnUrl');
    if (oauthReturnUrl) {
      const validatedReturnUrl = validateReturnUrl(oauthReturnUrl);
      if (validatedReturnUrl && !validatedReturnUrl.includes('/checkout')) {
        sessionStorage.removeItem('oauth_redirect');
        sessionStorage.removeItem('oauth_returnUrl');
        window.location.replace(validatedReturnUrl);
        return;
      } else if (!validatedReturnUrl) {
        sessionStorage.removeItem('oauth_returnUrl');
      } else {
        sessionStorage.removeItem('oauth_returnUrl');
      }
    }
    
    // Initialize tenant slug from URL
    const params = new URLSearchParams(window.location.search);
    setTenantSlug(params.get('tenant') || 'pornopizza');
  }, []); // Empty deps - only run once on mount

  // Handle cart validation (only when items change)
  useEffect(() => {
    if (items.length > 0) {
      // Cart has items, clear OAuth flag
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('oauth_redirect');
      }
      return;
    }
    
    // Cart is empty - wait a bit for zustand to hydrate
    const timeout = setTimeout(() => {
      if (typeof window === 'undefined') return;
      
      const cartStorage = localStorage.getItem('cart-storage');
      const fromOAuth = sessionStorage.getItem('oauth_redirect') === 'true';
      
      // Check if cart exists in localStorage
      if (cartStorage) {
        try {
          const cartData = JSON.parse(cartStorage);
          if (cartData.state?.items?.length > 0) {
            // Cart has items, just wait for zustand to hydrate
            if (fromOAuth) {
              sessionStorage.removeItem('oauth_redirect');
            }
            return; // Don't redirect, wait for zustand
          }
        } catch (e) {
          // Invalid cart data
        }
      }
      
      // If from OAuth, wait longer for cart to hydrate
      if (fromOAuth) {
        let checkCount = 0;
        const maxChecks = 30; // 15 seconds max (30 * 500ms)
        
        const interval = setInterval(() => {
          checkCount++;
          const finalItems = items.length;
          const finalCartStorage = localStorage.getItem('cart-storage');
          
          if (finalItems > 0) {
            sessionStorage.removeItem('oauth_redirect');
            clearInterval(interval);
            return;
          }
          
          if (finalCartStorage) {
            try {
              const cartData = JSON.parse(finalCartStorage);
              if (cartData.state?.items?.length > 0) {
                sessionStorage.removeItem('oauth_redirect');
                clearInterval(interval);
                return;
              }
            } catch (e) {
              // Invalid cart data
            }
          }
          
          if (checkCount >= maxChecks) {
            sessionStorage.removeItem('oauth_redirect');
            clearInterval(interval);
          }
        }, 500);
        
        return () => clearInterval(interval);
      } else {
        // Not from OAuth - redirect if cart is really empty
        const finalCheck = setTimeout(() => {
          const finalItems = items.length;
          const finalCartStorage = localStorage.getItem('cart-storage');
          const stillFromOAuth = sessionStorage.getItem('oauth_redirect') === 'true';
          
          if (stillFromOAuth || finalItems > 0) return;
          
          if (finalCartStorage) {
            try {
              const cartData = JSON.parse(finalCartStorage);
              if (cartData.state?.items?.length > 0) return;
            } catch (e) {
              // Invalid cart data
            }
          }
          
          // Cart is really empty, redirect to home
          router.push('/');
        }, 3000);
        
        return () => clearTimeout(finalCheck);
      }
    }, 2000);
    
    return () => clearTimeout(timeout);
  }, [items.length, router]); // Only depend on items.length, not full items array

  // Handle user/auth state (only when user or authLoading changes)
  useEffect(() => {
    if (authLoading) return; // Wait for auth to load
    
    if (typeof window === 'undefined') return;
    
    const fromOAuth = sessionStorage.getItem('oauth_redirect') === 'true';
    const token = localStorage.getItem('customer_auth_token');
    const storedUser = localStorage.getItem('customer_auth_user');
    const hasUserInStorage = !!(token && storedUser);
    
    // If user exists in localStorage but not in context yet, wait briefly
    if (!user && hasUserInStorage && !fromOAuth) {
      const timeout = setTimeout(() => {
        const finalToken = localStorage.getItem('customer_auth_token');
        const finalStoredUser = localStorage.getItem('customer_auth_user');
        
        if (!finalToken || !finalStoredUser) {
          window.location.href = `/auth/login?tenant=${tenantSlug}`;
        }
      }, 500);
      
      return () => clearTimeout(timeout);
    }
    
    // If from OAuth but no user yet, wait for tokens
    if (!user && !hasUserInStorage && fromOAuth) {
      const timeout = setTimeout(() => {
        const token = localStorage.getItem('customer_auth_token');
        const storedUser = localStorage.getItem('customer_auth_user');
        if (!token || !storedUser) {
          sessionStorage.removeItem('oauth_redirect');
          window.location.href = `/auth/login?tenant=${tenantSlug}`;
        }
      }, 2000);
      
      return () => clearTimeout(timeout);
    }
  }, [user, authLoading, tenantSlug]);
  
  // Fetch central payment config (from pornopizza tenant - master config for all websites)
  const fetchPaymentConfig = useCallback(async () => {
    try {
      // Always use pornopizza tenant as master for payment config
      const masterTenantData = await getTenant('pornopizza');
      const paymentConfigData = (masterTenantData.paymentConfig as any) || {};
      setPaymentConfig({
        cashOnDeliveryEnabled: paymentConfigData.cashOnDeliveryEnabled === true,
        cardOnDeliveryEnabled: paymentConfigData.cardOnDeliveryEnabled === true,
      });
    } catch (error) {
      console.error('Failed to fetch payment config:', error);
    }
  }, []);

  useEffect(() => {
    fetchPaymentConfig();
  }, [fetchPaymentConfig]);

  const fetchUserProfile = useCallback(async () => {
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

      if (res.status === 401) {
        // Token expired or invalid - clear auth
        console.log('[Checkout] 401 Unauthorized when fetching profile - token expired');
        localStorage.removeItem('customer_auth_token');
        localStorage.removeItem('customer_auth_refresh_token');
        localStorage.removeItem('customer_auth_user');
        // Dispatch event to notify auth context
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('customerAuthUpdate'));
        }
        return;
      }

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
  }, [user, setUser]);

  const fetchAddresses = useCallback(async () => {
    try {
      console.log('[Checkout] fetchAddresses called');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const token = localStorage.getItem('customer_auth_token');
      
      if (!token) {
        console.log('[Checkout] No token, skipping address fetch');
        setLoadingAddresses(false);
        return;
      }
      
      const res = await fetch(`${API_URL}/api/customer/account/addresses`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (res.status === 401) {
        // Token expired or invalid - clear auth and allow guest checkout
        console.log('[Checkout] 401 Unauthorized - token expired, clearing auth');
        localStorage.removeItem('customer_auth_token');
        localStorage.removeItem('customer_auth_refresh_token');
        localStorage.removeItem('customer_auth_user');
        // Dispatch event to notify auth context
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('customerAuthUpdate'));
        }
        setAddresses([]);
        setLoadingAddresses(false);
        return;
      }

      if (res.ok) {
        const data = await res.json();
        const fetchedAddresses = data.addresses || [];
        console.log('[Checkout] Addresses fetched:', {
          count: fetchedAddresses.length,
          addresses: fetchedAddresses.map((a: Address) => ({ id: a.id, street: a.street, isPrimary: a.isPrimary })),
        });
        setAddresses(fetchedAddresses);
        
        // Only set default address if no address is currently selected
        // or if the currently selected address no longer exists
        setSelectedAddressId((currentId) => {
          // If an address is already selected and it still exists, keep it
          if (currentId && fetchedAddresses.find((addr: Address) => addr.id === currentId)) {
            console.log('[Checkout] Keeping selected address:', currentId);
            return currentId;
          }
          
          // Otherwise, select primary address or first address
          const primaryAddress = fetchedAddresses.find((addr: Address) => addr.isPrimary);
          if (primaryAddress) {
            console.log('[Checkout] Selecting primary address:', primaryAddress.id);
            return primaryAddress.id;
          } else if (fetchedAddresses.length > 0) {
            console.log('[Checkout] Selecting first address:', fetchedAddresses[0].id);
            return fetchedAddresses[0].id;
          }
          return null;
        });
      } else {
        console.error('[Checkout] Failed to fetch addresses:', res.status, res.statusText);
      }
    } catch (error) {
      console.error('[Checkout] Failed to fetch addresses:', error);
    } finally {
      setLoadingAddresses(false);
    }
  }, []);

  // Fetch addresses and update user profile when user is loaded
  useEffect(() => {
    if (!user) {
      // User not logged in, clear addresses
      setAddresses([]);
      setLoadingAddresses(false);
      return;
    }
    
    let cancelled = false;
    
    const loadData = async () => {
      setLoadingAddresses(true);
      try {
        await Promise.all([
          fetchAddresses(),
          fetchUserProfile()
        ]);
      } catch (error) {
        console.error('[Checkout] Error loading user data:', error);
      } finally {
        if (!cancelled) {
          setLoadingAddresses(false);
        }
      }
    };
    
    loadData();
    
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);
  
  // Real-time address validation with geocoding (debounced)
  const validateAddressWithGeocoding = (street: string, city: string, postalCode: string) => {
    // Clear previous timeout
    if (geocodingTimeout) {
      clearTimeout(geocodingTimeout);
    }
    
    // First do simple validation immediately
    const simpleValidation = validateBratislavaAddressSimple(city, postalCode);
    if (!simpleValidation.isValid) {
      setAddressValidationError(simpleValidation.message || null);
      setIsValidatingAddress(false);
      return;
    }
    
    // Clear error if simple validation passes
    setAddressValidationError(null);
    
    // If we don't have street, skip geocoding
    if (!street || street.trim().length === 0) {
      return;
    }
    
    // Debounce geocoding API call (wait 1 second after user stops typing)
    setIsValidatingAddress(true);
    const timeout = setTimeout(async () => {
      try {
        const geocodingResult = await geocodeAddress(
          street,
          city,
          postalCode,
          guestData.country || 'SK'
        );
        
        if (!geocodingResult.isInBratislava) {
          setAddressValidationError(
            geocodingResult.message || 'Adresa nie je v Bratislave. Momentálne doručujeme len do Bratislavy.'
          );
        } else {
          setAddressValidationError(null);
        }
      } catch (error) {
        console.error('Geocoding error:', error);
        // Don't show error if geocoding fails - user can still proceed
        setAddressValidationError(null);
      } finally {
        setIsValidatingAddress(false);
      }
    }, 1000); // Wait 1 second after user stops typing
    
    setGeocodingTimeout(timeout);
  };

  // Validate if address is in Bratislava (with geocoding)
  const validateBratislavaAddress = async (
    street: string,
    city: string,
    postalCode: string,
    country: string = 'SK',
    useGeocoding: boolean = true
  ): Promise<{ isValid: boolean; message?: string }> => {
    // First do simple validation
    const simpleValidation = validateBratislavaAddressSimple(city, postalCode);
    
    // If simple validation fails, return immediately
    if (!simpleValidation.isValid) {
      return simpleValidation;
    }
    
    // If we have street address and geocoding is enabled, use geocoding API
    if (useGeocoding && street && street.trim().length > 0) {
      try {
        setIsValidatingAddress(true);
        const geocodingResult = await geocodeAddress(
          street,
          city,
          postalCode,
          country
        );
        
        if (!geocodingResult.isInBratislava) {
          return {
            isValid: false,
            message: geocodingResult.message || 'Adresa nie je v Bratislave. Momentálne doručujeme len do Bratislavy.',
          };
        }
        
        // Address is valid and in Bratislava
        return { isValid: true };
      } catch (error) {
        console.error('Geocoding error:', error);
        // Fall back to simple validation if geocoding fails
        return simpleValidation;
      } finally {
        setIsValidatingAddress(false);
      }
    }
    
    // Use simple validation result
    return simpleValidation;
  };

  // Validate name (must contain first and last name)
  const validateName = (name: string): { isValid: boolean; message?: string } => {
    const trimmed = name.trim();
    if (!trimmed) {
      return { isValid: false, message: 'Meno je povinné.' };
    }
    
    // Check if name contains at least 2 words (first name and last name)
    const words = trimmed.split(/\s+/).filter(word => word.length > 0);
    if (words.length < 2) {
      return { isValid: false, message: 'Prosím, zadajte meno aj priezvisko.' };
    }
    
    // Check minimum length for each word
    if (words.some(word => word.length < 2)) {
      return { isValid: false, message: 'Meno a priezvisko musia mať aspoň 2 znaky.' };
    }
    
    return { isValid: true };
  };

  // Validate email format
  const validateEmail = (email: string): { isValid: boolean; message?: string } => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      return { isValid: false, message: 'Email je povinný.' };
    }
    
    // More comprehensive email validation
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!emailRegex.test(trimmed)) {
      return { isValid: false, message: 'Prosím, zadajte platnú emailovú adresu.' };
    }
    
    // Check for common typos
    if (trimmed.includes('..') || trimmed.startsWith('.') || trimmed.endsWith('.')) {
      return { isValid: false, message: 'Email obsahuje neplatné znaky.' };
    }
    
    return { isValid: true };
  };

  // Validate phone number
  const validatePhone = (phone: string, prefix: string): { isValid: boolean; message?: string } => {
    const trimmed = phone.trim();
    if (!trimmed) {
      return { isValid: false, message: 'Telefónne číslo je povinné.' };
    }
    
    // Remove spaces, dashes, and parentheses
    const cleaned = trimmed.replace(/[\s\-\(\)]/g, '');
    
    // Check if it contains only digits
    if (!/^\d+$/.test(cleaned)) {
      return { isValid: false, message: 'Telefónne číslo môže obsahovať len číslice.' };
    }
    
    // Validate based on prefix
    if (prefix === '+421') {
      // Slovak phone numbers: 9 digits (without prefix)
      if (cleaned.length !== 9) {
        return { isValid: false, message: 'Slovenské telefónne číslo musí mať 9 číslic (napr. 912345678).' };
      }
      // Must start with 9
      if (!cleaned.startsWith('9')) {
        return { isValid: false, message: 'Slovenské mobilné číslo musí začínať na 9.' };
      }
    } else if (prefix === '+420') {
      // Czech phone numbers: 9 digits
      if (cleaned.length !== 9) {
        return { isValid: false, message: 'České telefónne číslo musí mať 9 číslic.' };
      }
    } else {
      // For other countries, just check minimum length
      if (cleaned.length < 7) {
        return { isValid: false, message: 'Telefónne číslo je príliš krátke.' };
      }
      if (cleaned.length > 15) {
        return { isValid: false, message: 'Telefónne číslo je príliš dlhé.' };
      }
    }
    
    return { isValid: true };
  };

  const handlePay = async () => {
    // Validate guest data if user is not logged in
    if (!user) {
      if (!guestData.name || !guestData.email || !guestData.phone || !guestData.street || !guestData.city || !guestData.postalCode) {
        alert('Prosím, vyplňte všetky povinné polia.');
        return;
      }
      
      // Validate name
      const nameValidation = validateName(guestData.name);
      if (!nameValidation.isValid) {
        alert(nameValidation.message);
        return;
      }
      
      // Validate email
      const emailValidation = validateEmail(guestData.email);
      if (!emailValidation.isValid) {
        alert(emailValidation.message);
        return;
      }
      
      // Validate phone
      const phoneValidation = validatePhone(guestData.phone, guestData.phonePrefix);
      if (!phoneValidation.isValid) {
        alert(phoneValidation.message);
        return;
      }
      
      // Validate Bratislava address with geocoding
      const addressValidation = await validateBratislavaAddress(
        guestData.street,
        guestData.city,
        guestData.postalCode,
        guestData.country || 'SK',
        true // Use geocoding
      );
      if (!addressValidation.isValid) {
        alert(addressValidation.message);
        return;
      }
      if (addressValidation.message) {
        // Warning but allow to continue
        const confirmed = confirm(`${addressValidation.message}\n\nChcete pokračovať?`);
        if (!confirmed) return;
      }
      
      // If cash on delivery, payment method must be selected
      if (paymentType === 'cash_on_delivery') {
        if (!cashOnDeliveryMethod) {
          alert('Prosím, vyberte spôsob platby pri dodaní.');
          return;
        }
      }
    } else {
      // User is logged in - check address
      // Wait for addresses to finish loading before checking
      if (loadingAddresses) {
        alert('Načítavajú sa adresy, prosím počkajte...');
        return;
      }
      
      if (addresses.length === 0) {
        alert('Musíte mať vyplnenú adresu pred vytvorením objednávky. Presmerovávam na stránku pre pridanie adresy.');
        router.push(`/account?tenant=${tenantSlug}&section=address`);
        return;
      }

      if (!selectedAddressId) {
        alert('Prosím, vyberte adresu pre doručenie.');
        return;
      }

      const selectedAddress = addresses.find(addr => addr.id === selectedAddressId);
      if (!selectedAddress) {
        alert('Vybraná adresa nebola nájdená. Prosím, vyberte inú adresu.');
        return;
      }

      // Validate minimum order for delivery zone
      if (minOrderCents !== null && total < minOrderCents) {
        alert(`Minimálna objednávka pre ${zoneName || 'túto zónu'} je ${(minOrderCents / 100).toFixed(2)}€. Vaša objednávka je ${(total / 100).toFixed(2)}€.`);
        return;
      }
      
      // Validate Bratislava address for logged-in users with geocoding
      const addressValidation = await validateBratislavaAddress(
        selectedAddress.street,
        selectedAddress.city,
        selectedAddress.postalCode,
        selectedAddress.country || 'SK',
        true // Use geocoding
      );
      if (!addressValidation.isValid) {
        alert(addressValidation.message);
        return;
      }
      if (addressValidation.message) {
        // Warning but allow to continue
        const confirmed = confirm(`${addressValidation.message}\n\nChcete pokračovať?`);
        if (!confirmed) return;
      }
    }

    setLoading(true);
    
    try {
      // Prepare order data
      const orderData: any = {
        customer: user ? {
          name: user.name || 'Customer',
          email: user.email.trim().toLowerCase(),
          phone: user.phone || '',
        } : {
          name: guestData.name,
          email: guestData.email.trim().toLowerCase(),
          phone: `${guestData.phonePrefix}${guestData.phone}`,
        },
        address: user ? {
          street: addresses.find(addr => addr.id === selectedAddressId)!.street,
          city: addresses.find(addr => addr.id === selectedAddressId)!.city,
          postalCode: addresses.find(addr => addr.id === selectedAddressId)!.postalCode,
          country: addresses.find(addr => addr.id === selectedAddressId)!.country || 'SK',
        } : {
          street: guestData.street,
          houseNumber: guestData.houseNumber,
          city: guestData.city,
          postalCode: guestData.postalCode,
          country: guestData.country,
          instructions: guestData.instructions,
        },
        items: items.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          modifiers: item.modifiers,
        })),
        userId: user?.id,
        deliveryFeeCents: deliveryFeeCents, // Add delivery fee from zone calculation
      };

      // Add guest checkout fields
      if (!user) {
        if (paymentType === 'cash_on_delivery') {
          // Cash on delivery - mandatory registration
          orderData.paymentMethod = cashOnDeliveryMethod;
          orderData.saveAccount = true; // Always true for cash on delivery
        } else if (paymentType === 'online') {
          // Online payment - optional registration
          orderData.saveAccount = saveAccount;
        }
      }

      const result = await createOrder(tenantSlug, orderData);
      
      // Handle auto-login if auth token is returned
      let order: any;
      if ('order' in result) {
        order = result.order;
        if (result.authToken && result.user) {
          // Auto-login happened - save tokens
          localStorage.setItem('customer_auth_token', result.authToken);
          if (result.refreshToken) {
            localStorage.setItem('customer_refresh_token', result.refreshToken);
          }
          localStorage.setItem('customer_auth_user', JSON.stringify(result.user));
          if (setUser) {
            setUser(result.user);
          }
        }
      } else {
        order = result;
      }
      
      // Clear cart after successful order creation
      clearCart();
      
      // Create payment session (only for online payment)
      if (paymentType === 'online') {
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
        }
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
  
  // Check maintenance mode - redirect to home if maintenance is active
  useEffect(() => {
    if (maintenanceMode) {
      console.log('Checkout: Maintenance mode active, redirecting to home');
      router.push(`/?tenant=${tenantSlug}`);
    }
  }, [maintenanceMode, router, tenantSlug]);
  
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
  
  // If maintenance mode is active, don't render checkout
  if (maintenanceMode) {
    return (
      <div className={`min-h-screen ${backgroundClass} ${isDark ? 'text-white' : ''} flex items-center justify-center`}>
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold mb-4">
            {language === 'sk' ? 'Momentálne neprijímame nové objednávky!' : 'We are currently not accepting new orders!'}
          </h2>
          <p className={`mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            {language === 'sk' 
              ? 'Objednávky sú momentálne pozastavené. Skúste to neskôr.' 
              : 'Orders are currently suspended. Please try again later.'}
          </p>
          <button
            onClick={() => router.push(`/?tenant=${tenantSlug}`)}
            className={`px-6 py-3 rounded-full font-semibold ${getButtonGradientClass(normalizedTenant)}`}
            style={getButtonStyle(normalizedTenant, isDark)}
          >
            {language === 'sk' ? 'Späť na hlavnú stránku' : 'Back to Home'}
          </button>
        </div>
      </div>
    );
  }

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className={`min-h-screen ${backgroundClass} ${isDark ? 'text-white' : ''} flex items-center justify-center`}>
        <div className={`text-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
          <div className={`inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4`}
          style={{ borderColor: isDark ? '#ff5e00' : 'var(--color-primary)' }}></div>
          <p className="mt-4 text-lg">Načítavam...</p>
        </div>
      </div>
    );
  }

  // Guest checkout is now allowed - no redirect needed
  
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
      <div className={`min-h-screen ${backgroundClass} ${isDark ? 'text-white' : ''} flex items-center justify-center`}>
        <div className={`text-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
          <div className={`inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4`}
          style={{ borderColor: isDark ? '#ff5e00' : 'var(--color-primary)' }}></div>
          <p className="mt-4 text-lg">Načítavam košík...</p>
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
      <div className={`min-h-screen ${backgroundClass} ${isDark ? 'text-white' : ''} flex items-center justify-center`}>
        <div className="container mx-auto px-4 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${isDark ? 'checkout-card-dark text-center' : 'bg-white rounded-lg shadow-md p-8 text-center'}`}
          >
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-primary)' }}>
              Adresa je povinná
            </h2>
            <p className={`${isDark ? 'text-gray-200' : 'text-gray-700'} mb-6`}>
              Pred vytvorením objednávky musíte mať vyplnenú adresu pre doručenie.
            </p>
            <button
              onClick={() => router.push(`/account?tenant=${tenantSlug}&section=address`)}
              className={`w-full py-3 rounded-2xl font-semibold text-lg ${getButtonGradientClass(tenantData)}`}
              style={getButtonStyle(tenantData, isDark)}
            >
              Pridať adresu
            </button>
            <button
              type="button"
              onClick={() => router.push('/')}
              className={`w-full py-3 mt-4 rounded-2xl border-2 font-semibold text-lg ${
                isDark ? 'border-white/30 text-white hover:bg-white/10' : ''
              }`}
              style={!isDark ? { borderColor: 'var(--color-primary)', color: 'var(--color-primary)' } : undefined}
            >
              Späť na menu
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${backgroundClass} ${isDark ? 'text-white py-10' : 'py-8'}`}>
      <div className="container mx-auto px-4 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${isDark ? 'checkout-card-dark p-8' : 'bg-white rounded-lg shadow-md p-8'}`}
        >
          <h1 className="text-3xl font-bold mb-8" style={{ color: 'var(--color-primary)' }}>
            {t.checkoutTitle}
          </h1>
          
          {/* Order Summary */}
          <div className="mb-8 pb-8 border-b">
            <h2 className="text-xl font-semibold mb-4">{t.orderSummary}</h2>
            {items.map(item => {
              const modifiers = formatModifiers(item.modifiers, false, language);
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
            {deliveryFeeCents > 0 && (
              <div className="flex justify-between text-sm mt-2">
                <span>{t.deliveryFee}</span>
                <span>€{(deliveryFeeCents / 100).toFixed(2)} {zoneName && `(${zoneName})`}</span>
              </div>
            )}
            {minOrderCents !== null && (
              <div className={`text-xs mt-1 ${total < minOrderCents ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                {total < minOrderCents 
                  ? `⚠️ ${t.minOrderWarning} ${zoneName || t.thisZone}: €${(minOrderCents / 100).toFixed(2)}`
                  : `✓ ${t.minOrderFulfilled}`
                }
              </div>
            )}
            {deliveryFeeError && (
              <div className="text-sm text-red-600 mt-2">
                {deliveryFeeError}
              </div>
            )}
            <div className="flex justify-between text-xl font-bold mt-4 pt-4 border-t">
              <span>{t.total}:</span>
              <span>€{((total + deliveryFeeCents) / 100).toFixed(2)}</span>
            </div>
          </div>
          
          {/* Optional Login */}
          {!user && (
            <div className="mb-8 pb-8 border-b">
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-900 font-semibold mb-1">{t.alreadyHaveAccount}</p>
                    <p className="text-sm text-gray-600">{t.loginForFasterCheckout}</p>
                  </div>
                  <button
                    onClick={() => router.push(`/auth/login?tenant=${tenantSlug}&returnUrl=${encodeURIComponent(`/checkout?tenant=${tenantSlug}`)}`)}
                    className="px-4 py-2 rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity"
                    style={{ 
                      backgroundColor: 'var(--color-primary)',
                      color: 'white'
                    }}
                  >
                    {t.login}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Customer Info - Guest Form or Read-only */}
          {user ? (
            <div className="mb-8 pb-8 border-b">
              <h2 className="text-xl font-semibold mb-4">{t.customerInformation}</h2>
              <div className="space-y-2 text-gray-700">
                <div><strong>{t.nameLabel}:</strong> {user.name || 'N/A'}</div>
                <div><strong>{t.emailLabel}:</strong> {user.email || 'N/A'}</div>
                {user.phone && (
                  <div>
                    <strong>{t.phoneLabel}:</strong> {user.phone}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="mb-8 pb-8 border-b">
              <h2 className="text-xl font-semibold mb-4">{t.contactDetails}</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t.nameLabel} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={guestData.name}
                    onChange={(e) => {
                      setGuestData({...guestData, name: e.target.value});
                      // Real-time validation
                      if (e.target.value.trim()) {
                        const validation = validateName(e.target.value);
                        setNameError(validation.isValid ? null : validation.message || null);
                      } else {
                        setNameError(null);
                      }
                    }}
                    onBlur={(e) => {
                      // Validate on blur as well
                      if (e.target.value.trim()) {
                        const validation = validateName(e.target.value);
                        setNameError(validation.isValid ? null : validation.message || null);
                      }
                    }}
                    required
                    className={`w-full px-4 py-2 border rounded-lg ${
                      nameError ? 'border-red-500' : ''
                    }`}
                    placeholder={t.namePlaceholderCheckout || t.namePlaceholder}
                  />
                  {nameError && (
                    <p className="mt-1 text-sm text-red-600">{nameError}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t.emailLabel} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={guestData.email}
                    onChange={(e) => {
                      setGuestData({...guestData, email: e.target.value});
                      // Real-time validation
                      if (e.target.value.trim()) {
                        const validation = validateEmail(e.target.value);
                        setEmailError(validation.isValid ? null : validation.message || null);
                      } else {
                        setEmailError(null);
                      }
                    }}
                    onBlur={(e) => {
                      // Validate on blur as well
                      if (e.target.value.trim()) {
                        const validation = validateEmail(e.target.value);
                        setEmailError(validation.isValid ? null : validation.message || null);
                      }
                    }}
                    required
                    className={`w-full px-4 py-2 border rounded-lg ${
                      emailError ? 'border-red-500' : ''
                    }`}
                    placeholder={t.emailPlaceholderCheckout || t.emailPlaceholder}
                  />
                  {emailError && (
                    <p className="mt-1 text-sm text-red-600">{emailError}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t.phoneLabel} <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={guestData.phonePrefix}
                      onChange={(e) => {
                        setGuestData({...guestData, phonePrefix: e.target.value});
                        // Re-validate phone when prefix changes
                        if (guestData.phone.trim()) {
                          const validation = validatePhone(guestData.phone, e.target.value);
                          setPhoneError(validation.isValid ? null : validation.message || null);
                        }
                      }}
                      className="px-3 py-2 border rounded-lg bg-white min-w-[120px]"
                    >
                      <option value="+421">+421 (SK)</option>
                      <option value="+420">+420 (CZ)</option>
                      <option value="+48">+48 (PL)</option>
                      <option value="+36">+36 (HU)</option>
                      <option value="+43">+43 (AT)</option>
                      <option value="+49">+49 (DE)</option>
                      <option value="+1">+1 (US/CA)</option>
                      <option value="+44">+44 (GB)</option>
                      <option value="+33">+33 (FR)</option>
                      <option value="+39">+39 (IT)</option>
                      <option value="+34">+34 (ES)</option>
                      <option value="+351">+351 (PT)</option>
                      <option value="+31">+31 (NL)</option>
                      <option value="+32">+32 (BE)</option>
                      <option value="+41">+41 (CH)</option>
                      <option value="+46">+46 (SE)</option>
                      <option value="+47">+47 (NO)</option>
                      <option value="+45">+45 (DK)</option>
                      <option value="+358">+358 (FI)</option>
                      <option value="+353">+353 (IE)</option>
                      <option value="+30">+30 (GR)</option>
                      <option value="+40">+40 (RO)</option>
                      <option value="+359">+359 (BG)</option>
                      <option value="+385">+385 (HR)</option>
                      <option value="+386">+386 (SI)</option>
                      <option value="+372">+372 (EE)</option>
                      <option value="+371">+371 (LV)</option>
                      <option value="+370">+370 (LT)</option>
                      <option value="+352">+352 (LU)</option>
                      <option value="+356">+356 (MT)</option>
                      <option value="+357">+357 (CY)</option>
                    </select>
                    <input
                      type="tel"
                      value={guestData.phone}
                      onChange={(e) => {
                        setGuestData({...guestData, phone: e.target.value});
                        // Real-time validation
                        if (e.target.value.trim()) {
                          const validation = validatePhone(e.target.value, guestData.phonePrefix);
                          setPhoneError(validation.isValid ? null : validation.message || null);
                        } else {
                          setPhoneError(null);
                        }
                      }}
                      onBlur={(e) => {
                        // Validate on blur as well
                        if (e.target.value.trim()) {
                          const validation = validatePhone(e.target.value, guestData.phonePrefix);
                          setPhoneError(validation.isValid ? null : validation.message || null);
                        }
                      }}
                      placeholder={t.phonePlaceholder || '912345678'}
                      required
                      className={`flex-1 px-4 py-2 border rounded-lg ${
                        phoneError ? 'border-red-500' : ''
                      }`}
                    />
                  </div>
                  {phoneError && (
                    <p className="mt-1 text-sm text-red-600">{phoneError}</p>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Address Selection - Guest Form or Address List */}
          {user ? (
            !loadingAddresses && addresses.length > 0 && (
            <div className="mb-8 pb-8 border-b">
              <h2 className="text-xl font-semibold mb-4">{t.deliveryAddress}</h2>
              <div className="space-y-3">
                {addresses.map((address) => (
                  <label
                    key={address.id}
                    onClick={() => {
                      console.log('[Checkout] Address clicked:', {
                        addressId: address.id,
                        street: address.street,
                        city: address.city,
                        postalCode: address.postalCode,
                        previousAddressId: selectedAddressId,
                        userId: user?.id,
                        userEmail: user?.email,
                      });
                      setSelectedAddressId(address.id);
                    }}
                    className={`flex items-start rounded-2xl p-4 cursor-pointer transition-all border ${
                      selectedAddressId === address.id
                        ? isDark
                          ? 'bg-white/10 border-white/30 shadow-[0_20px_60px_rgba(0,0,0,0.6)]'
                          : 'shadow'
                        : isDark
                          ? 'bg-white/5 border-white/10 hover:border-white/25'
                          : 'border-gray-200 hover:border-gray-300'
                    }`}
                    style={selectedAddressId === address.id && !isDark ? {
                      borderColor: 'var(--color-primary)',
                      backgroundColor: `${primaryColor}15`
                    } : undefined}
                  >
                    <input
                      type="radio"
                      name="address"
                      value={address.id}
                      checked={selectedAddressId === address.id}
                      onChange={() => {
                        console.log('[Checkout] Address changed via radio:', {
                          addressId: address.id,
                          street: address.street,
                          city: address.city,
                          postalCode: address.postalCode,
                          previousAddressId: selectedAddressId,
                          userId: user?.id,
                          userEmail: user?.email,
                        });
                        setSelectedAddressId(address.id);
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      className="mt-1 mr-3 cursor-pointer accent-[var(--color-primary)]"
                    />
                    <div className={`flex-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      <div className="font-semibold">
                        {address.street}
                        {address.isPrimary && (
                          <span className={`ml-2 text-xs px-2 py-1 rounded ${
                            isDark ? 'bg-white/15 text-white' : ''
                          }`}
                          style={!isDark ? {
                            backgroundColor: `${primaryColor}20`,
                            color: primaryColor
                          } : undefined}>
                            {t.primary}
                          </span>
                        )}
                      </div>
                      {address.description && (
                        <div className={`text-sm mt-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{address.description}</div>
                      )}
                      <div className={`text-sm mt-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        {address.postalCode} {address.city}, {address.country}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
              <button
                type="button"
                onClick={() => router.push(`/account?tenant=${tenantSlug}&section=address`)}
                className={`mt-4 text-sm font-medium hover:underline ${
                  isDark ? 'text-white' : ''
                }`}
                style={!isDark ? { color: 'var(--color-primary)' } : undefined}
              >
                {t.addNewAddress}
              </button>
            </div>
          )
          ) : (
            <div className="mb-8 pb-8 border-b">
              <h2 className="text-xl font-semibold mb-4">{t.deliveryAddress}</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t.street} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={guestData.street}
                    onChange={(e) => {
                      setGuestData({...guestData, street: e.target.value});
                      // Trigger geocoding validation when street is entered and we have city/postal code
                      if (e.target.value.trim() && guestData.city && guestData.postalCode) {
                        validateAddressWithGeocoding(e.target.value, guestData.city, guestData.postalCode);
                      } else {
                        // Clear error if street is empty
                        setAddressValidationError(null);
                      }
                    }}
                    required
                    className={`w-full px-4 py-2 border rounded-lg ${
                      addressValidationError ? 'border-red-500' : ''
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t.houseNumber}
                  </label>
                  <input
                    type="text"
                    value={guestData.houseNumber}
                    onChange={(e) => setGuestData({...guestData, houseNumber: e.target.value})}
                    placeholder={t.houseNumberPlaceholder}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t.cityLabel} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={guestData.city}
                    onChange={(e) => {
                      setGuestData({...guestData, city: e.target.value});
                      // Trigger validation with geocoding if we have all required fields
                      if (e.target.value && guestData.postalCode && guestData.street) {
                        validateAddressWithGeocoding(guestData.street, e.target.value, guestData.postalCode);
                      } else if (e.target.value && guestData.postalCode) {
                        // Simple validation if street is missing
                        const validation = validateBratislavaAddressSimple(e.target.value, guestData.postalCode);
                        setAddressValidationError(validation.isValid ? null : validation.message || null);
                      } else {
                        setAddressValidationError(null);
                      }
                    }}
                    required
                    className={`w-full px-4 py-2 border rounded-lg ${
                      addressValidationError ? 'border-red-500' : ''
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t.postalCodeLabel} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={guestData.postalCode}
                    onChange={(e) => {
                      setGuestData({...guestData, postalCode: e.target.value});
                      // Trigger validation with geocoding if we have all required fields
                      if (e.target.value && guestData.city && guestData.street) {
                        validateAddressWithGeocoding(guestData.street, guestData.city, e.target.value);
                      } else if (e.target.value && guestData.city) {
                        // Simple validation if street is missing
                        const validation = validateBratislavaAddressSimple(guestData.city, e.target.value);
                        setAddressValidationError(validation.isValid ? null : validation.message || null);
                      } else {
                        setAddressValidationError(null);
                      }
                    }}
                    required
                    className={`w-full px-4 py-2 border rounded-lg ${
                      addressValidationError ? 'border-red-500' : ''
                    }`}
                  />
                  {addressValidationError && (
                    <p className="mt-1 text-sm text-red-600">{addressValidationError}</p>
                  )}
                  {isValidatingAddress && (
                    <p className="mt-1 text-sm text-gray-500">{t.validatingAddress}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t.deliveryInstructions}
                  </label>
                  <textarea
                    value={guestData.instructions}
                    onChange={(e) => setGuestData({...guestData, instructions: e.target.value})}
                    placeholder={t.deliveryInstructionsPlaceholder}
                    rows={3}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Payment Method Selection */}
          <div className="mb-8 pb-8 border-b">
            <h2 className="text-xl font-semibold mb-4">{t.paymentMethod}</h2>
            <div className="space-y-3">
              <label className="flex items-start p-4 border-2 rounded-lg cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="paymentType"
                  value="online"
                  checked={paymentType === 'online'}
                  onChange={() => setPaymentType('online')}
                  className="mt-1 mr-3 cursor-pointer"
                />
                <div className="flex-1">
                  <div className="font-semibold">{t.onlinePayment}</div>
                  <div className="text-sm text-gray-600">{t.paymentGateway}</div>
                </div>
              </label>
              <label className="flex items-start p-4 border-2 rounded-lg cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="paymentType"
                  value="cash_on_delivery"
                  checked={paymentType === 'cash_on_delivery'}
                  onChange={() => setPaymentType('cash_on_delivery')}
                  className="mt-1 mr-3 cursor-pointer"
                />
                <div className="flex-1">
                  <div className="font-semibold flex items-center gap-2">
                    {t.cashOnDelivery}
                    {!user && (
                      <span
                        className="text-xs px-2.5 py-1 rounded-md font-bold text-white"
                        style={{
                          backgroundColor: 'var(--color-primary)',
                        }}>
                        {t.requiresAccount}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">
                    {t.payOnDelivery}
                    {!user && (
                      <span className="block mt-1 font-medium"
                      style={{ color: 'var(--color-primary)' }}>
                        {t.accountCreatedAutomatically}
                      </span>
                    )}
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Save Account Checkbox (for online payment) */}
          {paymentType === 'online' && !user && (
            <div className="mb-8 pb-8 border-b">
              <label className="flex items-start cursor-pointer">
                <input
                  type="checkbox"
                  checked={saveAccount}
                  onChange={(e) => setSaveAccount(e.target.checked)}
                  className="mt-1 mr-3 cursor-pointer"
                />
                <div className="flex-1">
                  <div className="font-medium">{t.saveDataAndCreateAccount}</div>
                  <div className="text-sm text-gray-600">{t.createAccountForFutureOrders}</div>
                </div>
              </label>
            </div>
          )}

          {/* Cash on Delivery - Payment Method Selection */}
          {paymentType === 'cash_on_delivery' && (
            <div className="mb-8 pb-8 border-b">
              {!user && (
                <div
                  className={`mb-6 rounded-2xl border p-5 ${
                    isDark
                      ? 'border-white/10 bg-white/5 text-white shadow-[0_30px_70px_rgba(0,0,0,0.6)] backdrop-blur-lg'
                      : ''
                  }`}
                  style={!isDark ? {
                    backgroundColor: `${primaryColor}15`,
                    borderColor: `${primaryColor}40`,
                    color: `${primaryColor}DD`
                  } : undefined}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        isDark ? 'bg-white/10 border border-white/20' : ''
                      }`}
                      style={!isDark ? {
                        backgroundColor: `${primaryColor}20`,
                        color: primaryColor
                      } : undefined}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-bold mb-2">
                        {t.accountRequiredForDeliveryPayment}
                      </h4>
                      <p className={`text-sm mb-4 ${isDark ? 'text-gray-300' : ''}`}
                      style={!isDark ? { color: `${primaryColor}DD` } : undefined}>
                        {t.accountCreatedAfterOrder}
                      </p>
                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            router.push(`/auth/login?tenant=${tenantSlug}&returnUrl=${encodeURIComponent(`/checkout?tenant=${tenantSlug}`)}`)
                          }
                          className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors ${
                            isDark
                              ? 'bg-gradient-to-r from-[#ff5e00] via-[#ff0066] to-[#ff2d55] text-white shadow-lg'
                              : 'text-white hover:opacity-90'
                          }`}
                          style={!isDark ? {
                            backgroundColor: 'var(--color-primary)'
                          } : undefined}
                        >
                          {t.orSignIn}
                        </button>
                        <span className={`text-xs ${isDark ? 'text-gray-400' : ''}`}
                        style={!isDark ? { color: 'var(--color-primary)' } : undefined}>
                          {t.ifYouHaveAccount}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <h3 className="text-lg font-semibold mb-3">{t.paymentMethodOnDelivery}</h3>
              <div className="space-y-3">
                {paymentConfig.cashOnDeliveryEnabled && (
                  <label className="flex items-start p-4 border-2 rounded-lg cursor-pointer transition-colors">
                    <input
                      type="radio"
                      name="cashOnDeliveryMethod"
                      value="cash"
                      checked={cashOnDeliveryMethod === 'cash'}
                      onChange={() => setCashOnDeliveryMethod('cash')}
                      className="mt-1 mr-3 cursor-pointer"
                    />
                    <div className="flex-1">
                      <div className="font-semibold">{t.cashPayment}</div>
                    </div>
                  </label>
                )}
                {paymentConfig.cardOnDeliveryEnabled && (
                  <label className="flex items-start p-4 border-2 rounded-lg cursor-pointer transition-colors">
                    <input
                      type="radio"
                      name="cashOnDeliveryMethod"
                      value="card"
                      checked={cashOnDeliveryMethod === 'card'}
                      onChange={() => setCashOnDeliveryMethod('card')}
                      className="mt-1 mr-3 cursor-pointer"
                    />
                    <div className="flex-1">
                      <div className="font-semibold">{t.cardPaymentTerminal}</div>
                    </div>
                  </label>
                )}
                {!paymentConfig.cashOnDeliveryEnabled && !paymentConfig.cardOnDeliveryEnabled && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                    {t.noDeliveryPaymentMethods}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Payment Button */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handlePay}
            disabled={
              loading || 
              (user && loadingAddresses) || 
              (user && addresses.length === 0) ||
              (!user && (!guestData.name || !guestData.email || !guestData.phone || !guestData.street || !guestData.city || !guestData.postalCode)) ||
              (paymentType === 'cash_on_delivery' && !cashOnDeliveryMethod)
            }
            className={`w-full py-3 rounded-2xl font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed ${getButtonGradientClass(tenantData)}`}
            style={getButtonStyle(tenantData, isDark)}
          >
            {loading ? t.processing : paymentType === 'cash_on_delivery' ? t.confirmOrder : t.pay}
          </motion.button>
          
          <button
            type="button"
            onClick={() => router.push('/')}
            className={`w-full py-3 mt-4 rounded-2xl border-2 font-semibold text-lg ${
              isDark ? 'border-white/30 text-white hover:bg-white/10' : ''
            }`}
            style={!isDark ? { borderColor: 'var(--color-primary)', color: 'var(--color-primary)' } : undefined}
          >
            {t.backToMenu}
          </button>
        </motion.div>
      </div>
    </div>
  );
}
