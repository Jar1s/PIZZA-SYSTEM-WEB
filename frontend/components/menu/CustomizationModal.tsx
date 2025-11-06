'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Product } from '@/shared';
import { pizzaCustomizations, CustomizationOption } from '@/lib/customization-options';
import { useLanguage } from '@/contexts/LanguageContext';
import { getProductTranslation, getAllergenDescription } from '@/lib/product-translations';
import Image from 'next/image';

interface CustomizationModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (customizations: Record<string, string[]>, totalPrice: number) => void;
}

export default function CustomizationModal({
  product,
  isOpen,
  onClose,
  onAddToCart,
}: CustomizationModalProps) {
  const { language } = useLanguage();
  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const [totalPrice, setTotalPrice] = useState(product.priceCents);
  
  // Get translated product name and description
  const translation = getProductTranslation(product.name, language);
  const displayName = translation.name || product.name;
  const displayDescription = translation.description || product.description;

  // Initialize with default selections for required categories
  useEffect(() => {
    if (isOpen) {
      const defaults: Record<string, string[]> = {};
      pizzaCustomizations.forEach(category => {
        if (category.required && category.options.length > 0) {
          defaults[category.id] = [category.options[0].id];
        }
      });
      setSelections(defaults);
      calculateTotal(defaults);
    }
  }, [isOpen, product]);

  const calculateTotal = (currentSelections: Record<string, string[]>) => {
    let additionalCost = 0;
    
    Object.entries(currentSelections).forEach(([categoryId, optionIds]) => {
      const category = pizzaCustomizations.find(c => c.id === categoryId);
      if (category) {
        optionIds.forEach(optionId => {
          const option = category.options.find(o => o.id === optionId);
          if (option) {
            additionalCost += option.price;
          }
        });
      }
    });

    setTotalPrice(product.priceCents + additionalCost);
  };

  const handleOptionToggle = (categoryId: string, optionId: string) => {
    const category = pizzaCustomizations.find(c => c.id === categoryId);
    if (!category) return;

    setSelections(prev => {
      const newSelections = { ...prev };
      const currentSelections = newSelections[categoryId] || [];

      if (category.maxSelection === 1) {
        // Radio behavior
        newSelections[categoryId] = [optionId];
      } else {
        // Checkbox behavior
        if (currentSelections.includes(optionId)) {
          newSelections[categoryId] = currentSelections.filter(id => id !== optionId);
        } else {
          if (currentSelections.length < category.maxSelection) {
            newSelections[categoryId] = [...currentSelections, optionId];
          }
        }
      }

      calculateTotal(newSelections);
      return newSelections;
    });
  };

  const isOptionSelected = (categoryId: string, optionId: string) => {
    return selections[categoryId]?.includes(optionId) || false;
  };

  const canAddMore = (categoryId: string) => {
    const category = pizzaCustomizations.find(c => c.id === categoryId);
    if (!category) return false;
    const currentCount = selections[categoryId]?.length || 0;
    return currentCount < category.maxSelection;
  };

  const handleAddToCart = () => {
    // Validate required selections
    const allRequiredSelected = pizzaCustomizations
      .filter(c => c.required)
      .every(c => selections[c.id]?.length > 0);

    if (!allRequiredSelected) {
      alert(language === 'sk' ? 'Prosím vyberte všetky povinné položky' : 'Please select all required items');
      return;
    }

    onAddToCart(selections, totalPrice);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col pointer-events-auto"
            >
            {/* Header */}
            <div className="relative p-6 border-b bg-gradient-to-r from-orange-50 to-white">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-md hover:bg-gray-100 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="flex gap-4">
                {product.image && (
                  <div className="relative w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 shadow-md">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">{displayName}</h2>
                  {displayDescription && (
                    <p className="text-gray-600 mb-3">{displayDescription}</p>
                  )}
                  
                  {/* Weight and Allergens */}
                  {(translation.weight || translation.allergens) && (
                    <div className="flex items-center gap-4 mb-3 text-sm text-gray-500 flex-wrap">
                      {translation.weight && (
                        <div className="flex items-center gap-1">
                          <span>⚖️</span>
                          <span>{translation.weight}</span>
                        </div>
                      )}
                      {translation.allergens && translation.allergens.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap">
                          <span>⚠️</span>
                          <span className="font-semibold">
                            {language === 'sk' ? 'Alergény:' : 'Allergens:'}
                          </span>
                          <span className="text-xs italic text-gray-600">
                            {translation.allergens.map((code, index) => (
                              <span key={code}>
                                <span className="font-semibold">{code}</span>
                                {' - '}
                                <span>{getAllergenDescription(code, language)}</span>
                                {index < translation.allergens!.length - 1 && ', '}
                              </span>
                            ))}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm text-gray-500">
                      {language === 'sk' ? 'Základná cena:' : 'Base price:'}
                    </span>
                    <span className="text-xl font-bold" style={{ color: 'var(--color-primary)' }}>
                      €{(product.priceCents / 100).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {pizzaCustomizations.map((category) => (
                <div key={category.id} className="bg-gray-50 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900">
                      {language === 'sk' ? category.name : category.nameEn}
                      {category.required && (
                        <span className="ml-2 text-red-500 text-sm">POVINNÉ</span>
                      )}
                    </h3>
                    <span className="text-sm text-gray-500">
                      {language === 'sk' 
                        ? `Vyberte ${category.maxSelection === 1 ? '1' : `max. ${category.maxSelection}`}`
                        : `Select ${category.maxSelection === 1 ? '1' : `up to ${category.maxSelection}`}`
                      }
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {category.options.map((option) => {
                      const isSelected = isOptionSelected(category.id, option.id);
                      // For radio buttons (maxSelection=1), never disable
                      // For checkboxes, only disable if max reached and this is not selected
                      const isDisabled = category.maxSelection > 1 && !isSelected && !canAddMore(category.id);

                      return (
                        <button
                          key={option.id}
                          onClick={() => handleOptionToggle(category.id, option.id)}
                          disabled={isDisabled}
                          className={`
                            relative p-4 rounded-lg border-2 text-left transition-all cursor-pointer
                            ${isSelected 
                              ? 'border-orange-500 bg-orange-50 shadow-md' 
                              : isDisabled
                                ? 'border-gray-200 bg-gray-100 opacity-50 cursor-not-allowed'
                                : 'border-gray-200 hover:border-orange-300 hover:bg-white hover:shadow-sm'
                            }
                          `}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="font-semibold text-gray-900">
                                {language === 'sk' ? option.name : option.nameEn}
                              </div>
                              {option.price > 0 && (
                                <div className="text-orange-600 font-bold mt-1">
                                  +€{(option.price / 100).toFixed(2)}
                                </div>
                              )}
                            </div>
                            <div className={`
                              w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0
                              ${isSelected 
                                ? 'border-orange-500 bg-orange-500' 
                                : 'border-gray-300'
                              }
                            `}>
                              {isSelected && (
                                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="border-t p-6 bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600 mb-1">
                    {language === 'sk' ? 'Celková cena:' : 'Total price:'}
                  </div>
                  <div className="text-4xl font-bold" style={{ color: 'var(--color-primary)' }}>
                    €{(totalPrice / 100).toFixed(2)}
                  </div>
                </div>
                <button
                  onClick={handleAddToCart}
                  className="px-8 py-4 rounded-xl font-bold text-white text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  🛒 {language === 'sk' ? 'Pridať do košíka' : 'Add to Cart'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
        </div>
      )}
    </AnimatePresence>
  );
}

