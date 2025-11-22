'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Product } from '@pizza-ecosystem/shared';
import { updateProduct, getProductMappings, ProductMapping } from '@/lib/api';
import { getProductTranslation } from '@/lib/product-translations';
import { getProductTranslation } from '@/lib/product-translations';

interface EditProductModalProps {
  product: Product | null;
  tenantSlug: string;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

const CATEGORIES = [
  'PIZZA',
  'SIDES',
  'DRINKS',
  'DESSERTS',
  'SAUCES',
  'STANGLE',
  'SOUPS',
];

export function EditProductModal({ 
  product, 
  tenantSlug, 
  isOpen, 
  onClose, 
  onUpdate 
}: EditProductModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0, // Price in euros (for display)
    category: 'PIZZA',
    image: '',
    isActive: true,
    isBestSeller: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [mappings, setMappings] = useState<ProductMapping[]>([]);
  const [loadingMappings, setLoadingMappings] = useState(false);

  const loadMappings = useCallback(async () => {
    if (!product) return;
    
    setLoadingMappings(true);
    try {
      const productMappings = await getProductMappings(tenantSlug, product.id);
      setMappings(productMappings);
    } catch (error) {
      console.error('Failed to load product mappings:', error);
      setMappings([]);
    } finally {
      setLoadingMappings(false);
    }
  }, [product, tenantSlug]);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: (product.priceCents || 0) / 100, // Convert cents to euros
        category: product.category || 'PIZZA',
        image: product.image || '',
        isActive: product.isActive !== undefined ? product.isActive : true,
        isBestSeller: product.isBestSeller !== undefined ? product.isBestSeller : false,
      });
      setImagePreview(product.image || null);
      setImageFile(null);
      setError(null);
      
      // Načítaj mappings pre produkt
      loadMappings();
    }
  }, [product, tenantSlug, loadMappings]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }

      setImageFile(file);
      setError(null);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);
    
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const res = await fetch(`${API_URL}/api/upload/image`, {
      method: 'POST',
      body: formData,
    });
    
    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Failed to upload image' }));
      throw new Error(error.message || 'Failed to upload image');
    }
    
    const data = await res.json();
    return data.url;
  };

  if (!isOpen || !product) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let imageUrl = formData.image;
      
      // Upload image if file is selected
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      await updateProduct(tenantSlug, product.id, {
        name: formData.name,
        description: formData.description || null,
        priceCents: Math.round(formData.price * 100), // Convert euros to cents
        category: formData.category,
        image: imageUrl || null,
        isActive: formData.isActive,
        isBestSeller: formData.isBestSeller,
      });
      
      onUpdate();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Edit Product</h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (SK / EN)
                  </label>
                  <div className="space-y-2">
                    {/* Try to parse description as JSON with sk/en, or display as single string */}
                    {(() => {
                      try {
                        const desc = formData.description;
                        if (!desc) return null;
                        
                        // Try to parse as JSON
                        const parsed = JSON.parse(desc);
                        if (parsed && typeof parsed === 'object' && (parsed.sk || parsed.en)) {
                          return (
                            <div className="space-y-2">
                              <div>
                                <label className="text-xs text-gray-600 mb-1 block">Slovensky (SK):</label>
                                <textarea
                                  value={parsed.sk || ''}
                                  onChange={(e) => {
                                    const newDesc = { ...parsed, sk: e.target.value };
                                    setFormData({ ...formData, description: JSON.stringify(newDesc) });
                                  }}
                                  rows={2}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-gray-600 mb-1 block">English (EN):</label>
                                <textarea
                                  value={parsed.en || ''}
                                  onChange={(e) => {
                                    const newDesc = { ...parsed, en: e.target.value };
                                    setFormData({ ...formData, description: JSON.stringify(newDesc) });
                                  }}
                                  rows={2}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                />
                              </div>
                            </div>
                          );
                        }
                      } catch (e) {
                        // Not JSON, treat as single string
                      }
                      
                      // Single string or not JSON - show both fields with translations
                      const descStr = formData.description || '';
                      const translationSK = product ? getProductTranslation(product.name, 'sk') : null;
                      const translationEN = product ? getProductTranslation(product.name, 'en') : null;
                      
                      return (
                        <div className="space-y-2">
                          <div>
                            <label className="text-xs text-gray-600 mb-1 block">Slovensky (SK):</label>
                            <textarea
                              value={descStr || translationSK?.description || ''}
                              onChange={(e) => {
                                const sk = e.target.value;
                                const en = translationEN?.description || '';
                                setFormData({ 
                                  ...formData, 
                                  description: en ? JSON.stringify({ sk, en }) : sk 
                                });
                              }}
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                              placeholder="Zadajte popis v slovenčine..."
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-600 mb-1 block">English (EN):</label>
                            <textarea
                              value={translationEN?.description || ''}
                              onChange={(e) => {
                                const en = e.target.value;
                                const sk = descStr || translationSK?.description || '';
                                setFormData({ 
                                  ...formData, 
                                  description: en ? JSON.stringify({ sk, en }) : sk 
                                });
                              }}
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                              placeholder="Enter description in English..."
                            />
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Zobrazí sa oba jazyky (SK a EN) na webe
                  </p>
                </div>

                {/* Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price (€) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Image
                  </label>
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {imagePreview && (
                      <div className="mt-2">
                        <Image 
                          src={imagePreview} 
                          alt="Preview" 
                          width={128}
                          height={128}
                          className="h-32 w-32 object-cover rounded-md border border-gray-300"
                        />
                      </div>
                    )}
                    <input
                      type="text"
                      value={formData.image}
                      onChange={(e) => {
                        setFormData({ ...formData, image: e.target.value });
                        setImagePreview(e.target.value || null);
                      }}
                      placeholder="Or enter image URL"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Active Status */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                    Active (visible to customers)
                  </label>
                </div>

                {/* Best Seller */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isBestSeller"
                    checked={formData.isBestSeller}
                    onChange={(e) => setFormData({ ...formData, isBestSeller: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isBestSeller" className="ml-2 block text-sm text-gray-900">
                    Best Seller
                  </label>
                </div>

                {/* Product Mappings */}
                <div className="border-t pt-4 mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Webové mapovanie
                  </label>
                  <p className="text-xs text-gray-500 mb-3">
                    Ako sa tento produkt zobrazuje na webe
                  </p>
                  {loadingMappings ? (
                    <div className="text-sm text-gray-500">Načítavam mapovania...</div>
                  ) : mappings.length > 0 ? (
                    <div className="space-y-2">
                      {mappings.map((mapping) => (
                        <div
                          key={mapping.id}
                          className="p-3 bg-blue-50 rounded-md border border-blue-200"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="text-sm font-semibold text-blue-900 mb-1">
                                {mapping.externalIdentifier}
                              </div>
                              <div className="text-xs text-gray-600">
                                V databáze: <span className="font-medium">{mapping.internalProductName}</span>
                              </div>
                              {mapping.source && (
                                <div className="text-xs text-gray-500 mt-1">
                                  Zdroj: {mapping.source}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 italic p-2 bg-gray-50 rounded-md">
                      Žiadne mapovania pre tento produkt
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

