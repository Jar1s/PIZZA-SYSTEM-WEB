'use client';

import { useEffect, useState, Suspense, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Product } from '@pizza-ecosystem/shared';
import { getProducts, updateProduct, deleteProduct } from '@/lib/api';
import { ProtectedRoute } from '@/components/admin/ProtectedRoute';
import { useAdminContext } from '@/app/admin/admin-context';
import { getTenantSlug } from '@/lib/tenant-utils';
import { getProductDisplayImage } from '@/lib/product-images';
import { getProductTranslation } from '@/lib/product-translations';
import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';

// Lazy load modals for code splitting
const EditProductModal = dynamic(() => import('@/components/admin/EditProductModal').then(mod => ({ default: mod.EditProductModal })), {
  ssr: false,
});

const AddProductModal = dynamic(() => import('@/components/admin/AddProductModal').then(mod => ({ default: mod.AddProductModal })), {
  ssr: false,
});

interface ProductWithTenant extends Product {
  tenantSlug?: string;
}

export default function ProductsPage() {
  const { selectedTenant: contextTenant } = useAdminContext();
  const currentTenant = getTenantSlug();
  const defaultTenant = contextTenant === 'all' ? currentTenant : contextTenant;
  const { language } = useLanguage();
  
  const [products, setProducts] = useState<ProductWithTenant[]>([]);
  const [loading, setLoading] = useState(true);
  // Use contextTenant directly as filter - no local state needed
  const filter: 'all' | 'pornopizza' | 'pizzavnudzi' = contextTenant === 'all' ? 'all' : contextTenant as 'pornopizza' | 'pizzavnudzi';
  const [showInactive, setShowInactive] = useState(false); // Filter for inactive products
  const [editingProduct, setEditingProduct] = useState<ProductWithTenant | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const selectedTenant = defaultTenant as 'pornopizza' | 'pizzavnudzi';
  
  // Helper function to get product display image
  const getProductImage = useCallback((product: ProductWithTenant) => {
    const translation = getProductTranslation(product.name, language);
    return getProductDisplayImage(product, translation.name);
  }, [language]);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      // Use contextTenant directly instead of filter
      const tenants = contextTenant === 'all' 
        ? ['pornopizza', 'pizzavnudzi']
        : [contextTenant];
      const allProducts: ProductWithTenant[] = [];
      
      for (const tenant of tenants) {
        try {
          // Fetch all products (including inactive) for admin
          const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
          const url = `${API_URL}/api/${tenant}/products?isActive=all`;
          
          console.log(`Fetching products from: ${url}`);
          
          const res = await fetch(url);
          
          if (!res.ok) {
            console.error(`Failed to fetch products for ${tenant}: ${res.status} ${res.statusText}`);
            const errorText = await res.text();
            console.error('Error response:', errorText);
            continue;
          }
          
          const tenantProducts = await res.json();
          console.log(`Fetched ${tenantProducts.length} products for ${tenant}`);
          
          // Debug: Log prices for specific products
          const productsToDebug = ['Basil Pesto Premium', 'Honey Chilli', 'Pollo Crema', 'Prosciutto Crudo Premium', 'Quattro Formaggi', 'Quattro Formaggi Bianco', 'Tonno', 'Vegetariana Premium', 'Hot Missionary'];
          tenantProducts.forEach((p: Product) => {
            if (productsToDebug.includes(p.name)) {
              console.log(`[Admin] ${p.name}: ${p.priceCents} cents = €${(p.priceCents / 100).toFixed(2)}`);
            }
          });
          
          allProducts.push(...tenantProducts.map((p: Product) => ({
            ...p,
            tenantSlug: tenant,
          })));
        } catch (error) {
          console.error(`Failed to fetch products for ${tenant}:`, error);
        }
      }
      
      // Sort by category and name
      allProducts.sort((a, b) => {
        if (a.category !== b.category) {
          return a.category.localeCompare(b.category);
        }
        return a.name.localeCompare(b.name);
      });
      
      setProducts(allProducts);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  }, [contextTenant]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const filteredProducts = products.filter(p => {
    // Filter by brand
    if (filter !== 'all' && p.tenantSlug !== filter) {
      return false;
    }
    
    // Filter by active status
    if (!showInactive && !p.isActive) {
      return false;
    }
    
    return true;
  });

  const handleEdit = (product: ProductWithTenant) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleDelete = async (product: ProductWithTenant) => {
    if (!confirm(`Are you sure you want to delete "${product.name}"?`)) {
      return;
    }

    if (!product.tenantSlug) {
      alert('Cannot delete: tenant information missing');
      return;
    }

    try {
      await deleteProduct(product.tenantSlug, product.id);
      fetchProducts(); // Refresh list
    } catch (error: any) {
      alert(`Failed to delete product: ${error.message}`);
    }
  };

  const handleUpdate = () => {
    fetchProducts(); // Refresh list after update
  };

  const getBrandName = (tenantSlug?: string) => {
    if (!tenantSlug) return 'Unknown';
    if (tenantSlug === 'pornopizza') return 'PornoPizza';
    if (tenantSlug === 'pizzavnudzi') return 'Pizza v Núdzi';
    return tenantSlug.replace('pizza', 'Pizza ');
  };

  return (
    // <ProtectedRoute requiredRole="ADMIN"> // Disabled for development
    <div>
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-4 lg:mb-6 gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Products Management</h1>
          <p className="text-gray-600 mt-2 text-sm lg:text-base">
            Manage products across all brands. Total: {products.length} products
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
          >
            + Add Product
          </button>
        </div>
      </div>

      {/* Show Inactive Toggle */}
      <div className="mb-4 lg:mb-6">
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 font-medium">
              Show Inactive ({products.filter(p => !p.isActive).length})
            </span>
          </label>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading products...</p>
        </div>
      ) : (
        <>
          {/* Mobile Card Layout */}
          <div className="md:hidden space-y-4">
            {filteredProducts.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
                No products found
              </div>
            ) : (
              filteredProducts.map((product) => {
                const getDescription = () => {
                  if (!product.description) return null;
                  try {
                    const parsed = JSON.parse(product.description);
                    if (parsed && typeof parsed === 'object' && (parsed.sk || parsed.en)) {
                      return parsed.sk || parsed.en || product.description;
                    }
                  } catch (e) {
                    // Not JSON
                  }
                  return product.description;
                };

                const productImage = getProductImage(product);
                
                return (
                  <div key={product.id} className="bg-white rounded-lg shadow p-4">
                    <div className="flex items-start gap-3 mb-3">
                      {productImage && (
                        <div className="relative w-16 h-16 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                          <Image
                            src={productImage}
                            alt={product.name}
                            fill
                            sizes="64px"
                            className="object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900">
                          {product.name}
                        </div>
                        {product.displayName && product.displayName !== product.name && (
                          <div className="text-xs text-blue-600 mt-1">
                            Web: {product.displayName}
                          </div>
                        )}
                        {getDescription() && (
                          <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {getDescription()}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2 ml-2">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          product.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {product.isActive ? 'Active' : 'Inactive'}
                        </span>
                        {product.isBestSeller && (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            ⭐ Best
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">Brand:</span>
                        <span className="text-gray-900">{getBrandName(product.tenantSlug)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">Category:</span>
                        <span className="text-gray-900">{product.category}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">Price:</span>
                        <span className="text-gray-900 font-semibold">€{(product.priceCents / 100).toFixed(2)}</span>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-gray-200 flex gap-2">
                      <button
                        onClick={() => handleEdit(product)}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(product)}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Desktop Table Layout */}
          <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Brand
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Best Seller
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                        No products found
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((product) => {
                      const productImage = getProductImage(product);
                      return (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {productImage && (
                              <div className="relative w-12 h-12 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                                <Image
                                  src={productImage}
                                  alt={product.name}
                                  fill
                                  sizes="48px"
                                  className="object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-900">
                                {product.name}
                              </div>
                              {product.displayName && (
                                <div className={`text-xs mt-1 ${product.displayName !== product.name ? 'text-blue-600' : 'text-gray-500'}`}>
                                  Web: {product.displayName}
                                </div>
                              )}
                              {product.description && (() => {
                                // Try to parse as JSON {sk: "...", en: "..."}
                                try {
                                  const parsed = JSON.parse(product.description);
                                  if (parsed && typeof parsed === 'object' && (parsed.sk || parsed.en)) {
                                    return (
                                      <div className="text-xs text-gray-500 mt-1 line-clamp-1">
                                        {parsed.sk || parsed.en || product.description}
                                      </div>
                                    );
                                  }
                                } catch (e) {
                                  // Not JSON, show as is
                                }
                                return (
                                  <div className="text-xs text-gray-500 mt-1 line-clamp-1">
                                    {product.description}
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {getBrandName(product.tenantSlug)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{product.category}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            €{(product.priceCents / 100).toFixed(2)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            product.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {product.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {product.isBestSeller ? (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                              ⭐ Best Seller
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleEdit(product)}
                            className="text-blue-600 hover:text-blue-900 mr-4 font-semibold"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(product)}
                            className="text-red-600 hover:text-red-900 font-semibold"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Edit Modal */}
      {editingProduct && (
        <EditProductModal
          product={editingProduct}
          tenantSlug={editingProduct.tenantSlug || 'pornopizza'}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingProduct(null);
          }}
          onUpdate={handleUpdate}
        />
      )}

      {/* Add Modal */}
      <AddProductModal
        tenantSlug={selectedTenant}
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleUpdate}
      />
      </div>
    // </ProtectedRoute> // Disabled for development
  );
}
