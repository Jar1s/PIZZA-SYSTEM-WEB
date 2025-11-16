'use client';

import { useEffect, useState, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Product } from '@/shared';
import { getProducts, updateProduct, deleteProduct } from '@/lib/api';
import { ProtectedRoute } from '@/components/admin/ProtectedRoute';

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
  const [products, setProducts] = useState<ProductWithTenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pornopizza' | 'pizzavnudzi'>('all');
  const [showInactive, setShowInactive] = useState(false); // Filter for inactive products
  const [editingProduct, setEditingProduct] = useState<ProductWithTenant | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<'pornopizza' | 'pizzavnudzi'>('pornopizza');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const tenants = ['pornopizza', 'pizzavnudzi'];
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
  };

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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Products Management</h1>
          <p className="text-gray-600 mt-2">
            Manage products across all brands. Total: {products.length} products
          </p>
        </div>
        <div className="flex gap-4 items-center">
          <select
            value={selectedTenant}
            onChange={(e) => setSelectedTenant(e.target.value as 'pornopizza' | 'pizzavnudzi')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="pornopizza">PornoPizza</option>
            <option value="pizzavnudzi">Pizza v Núdzi</option>
          </select>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            + Add Product
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="mb-6">
        <div className="flex gap-4 items-center flex-wrap">
          <div className="flex gap-4">
            <button
              onClick={() => setFilter('all')}
              className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                filter === 'all'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              All ({products.length})
            </button>
            <button
              onClick={() => setFilter('pornopizza')}
              className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                filter === 'pornopizza'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              PornoPizza ({products.filter(p => p.tenantSlug === 'pornopizza').length})
            </button>
            <button
              onClick={() => setFilter('pizzavnudzi')}
              className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                filter === 'pizzavnudzi'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              Pizza v Núdzi ({products.filter(p => p.tenantSlug === 'pizzavnudzi').length})
            </button>
          </div>
          
          {/* Show Inactive Toggle */}
          <div className="ml-auto flex items-center gap-2">
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
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading products...</p>
          </div>
        ) : (
          <>
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
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {product.name}
                        </div>
                        {product.description && (
                          <div className="text-xs text-gray-500 mt-1 line-clamp-1">
                            {product.description}
                          </div>
                        )}
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
                  ))}
                </tbody>
              </table>
            </div>
            
            {!loading && filteredProducts.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                No products found
              </div>
            )}
          </>
        )}
      </div>

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
