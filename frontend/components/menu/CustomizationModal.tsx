'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Product } from '@pizza-ecosystem/shared';
import { pizzaCustomizations, stangleCustomizations, CustomizationOption, CustomizationCategory } from '@/lib/customization-options';
import { useLanguage } from '@/contexts/LanguageContext';
import { getProductTranslation, getAllergenDescription } from '@/lib/product-translations';
import Image from 'next/image';

interface CustomizationModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (customizations: Record<string, string[]>, totalPrice: number) => void;
  hideBackground?: boolean; // Only hide background for best sellers
}

// Helper function to convert hex to rgba
function hexToRgba(hex: string, opacity: number): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return hex;
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

export default function CustomizationModal({
  product,
  isOpen,
  onClose,
  onAddToCart,
  hideBackground = false,
}: CustomizationModalProps) {
  const { language } = useLanguage();
  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const [totalPrice, setTotalPrice] = useState(product.priceCents);
  const [mounted, setMounted] = useState(false);
  const [primaryColorRgba, setPrimaryColorRgba] = useState<string>('rgba(255, 107, 0, 0.3)');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Get primary color and convert to rgba for background
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const root = getComputedStyle(document.documentElement);
      const primaryColor = root.getPropertyValue('--color-primary').trim() || '#E91E63';
      setPrimaryColorRgba(hexToRgba(primaryColor, 0.3));
    }
  }, []);
  
  // Get translated product name and description
  const translation = getProductTranslation(product.name, language);
  const displayName = translation.name || product.name;
  const displayDescription = translation.description || product.description;

  // Get customization options based on product category
  const customizations: CustomizationCategory[] = useMemo(() => {
    if (product.category === 'STANGLE') {
      return stangleCustomizations;
    }
    return pizzaCustomizations;
  }, [product.category]);

  const calculateTotal = useCallback((currentSelections: Record<string, string[]>) => {
    let additionalCost = 0;
    
    Object.entries(currentSelections).forEach(([categoryId, optionIds]) => {
      const category = customizations.find(c => c.id === categoryId);
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
  }, [product.priceCents, customizations]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      // Save current scroll position
      const scrollY = window.scrollY;
      // Disable body scroll
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      
      return () => {
        // Restore body scroll
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  // Handle ESC key to close modal
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Initialize with default selections for required categories and expand required categories
  useEffect(() => {
    if (isOpen) {
      const defaults: Record<string, string[]> = {};
      const requiredCategoryIds = new Set<string>();
      
      customizations.forEach(category => {
        if (category.required && category.options.length > 0) {
          defaults[category.id] = [category.options[0].id];
          requiredCategoryIds.add(category.id);
        }
      });
      
      setSelections(defaults);
      calculateTotal(defaults);
      // Auto-expand required categories and first category if no required
      if (requiredCategoryIds.size > 0) {
        setExpandedCategories(requiredCategoryIds);
      } else if (customizations.length > 0) {
        // Expand first category if no required categories
        setExpandedCategories(new Set([customizations[0].id]));
      }
    } else {
      // Reset expanded categories when modal closes
      setExpandedCategories(new Set());
    }
  }, [isOpen, product, calculateTotal, customizations]);
  
  // Toggle category expansion
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const handleOptionToggle = (categoryId: string, optionId: string) => {
    const category = customizations.find(c => c.id === categoryId);
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
    const category = customizations.find(c => c.id === categoryId);
    if (!category) return false;
    const currentCount = selections[categoryId]?.length || 0;
    return currentCount < category.maxSelection;
  };

  const handleAddToCart = () => {
    // Validate required selections
    const allRequiredSelected = customizations
      .filter(c => c.required)
      .every(c => selections[c.id]?.length > 0);

    if (!allRequiredSelected) {
      alert(language === 'sk' ? 'Prosím vyberte všetky povinné položky' : 'Please select all required items');
      return;
    }

    onAddToCart(selections, totalPrice);
    onClose();
  };

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay - fixed positioned to cover entire screen */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80"
            style={{ zIndex: 999900 }}
          />

          {/* Modal Container */}
          <div
            className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none"
            style={{ zIndex: 999910 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col pointer-events-auto relative border border-gray-100"
              style={{ zIndex: 999920 }}
              onWheel={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
            >
            {/* Sticky Header */}
            <div className="sticky top-0 z-20 bg-white border-b border-gray-100 shadow-sm">
              <div className="relative p-4 sm:p-6">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 sm:top-6 sm:right-6 w-10 h-10 flex items-center justify-center rounded-full bg-gray-900 hover:bg-black text-white shadow-lg transition-colors z-10"
                aria-label={language === 'sk' ? 'Zatvoriť' : 'Close'}
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

                <div className="flex gap-3 sm:gap-4 items-start pr-12 sm:pr-14">
                  {product.image && (
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden flex-shrink-0 shadow-md">
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 mb-1 line-clamp-2 pr-2">{displayName}</h2>
                    {displayDescription && (
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">{displayDescription}</p>
                    )}
                    
                    {/* Weight and Allergens - Compact */}
                    {(translation.weight || translation.allergens) && (
                      <div className="flex items-center gap-3 mb-2 text-xs text-gray-500 flex-wrap">
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
                            <span className="text-xs">
                              {translation.allergens.map((code, index) => (
                                <span key={code}>
                                  <span className="font-semibold">{code}</span>
                                  {index < translation.allergens!.length - 1 && ', '}
                                </span>
                              ))}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        {language === 'sk' ? 'Základná cena:' : 'Base price:'}
                      </span>
                      <span className="text-lg font-bold" style={{ color: 'var(--color-primary)' }}>
                        €{(product.priceCents / 100).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Scrollable Content */}
            <div 
              className="flex-1 overflow-y-auto p-4 sm:p-6"
              onWheel={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
            >
              {customizations.map((category) => {
                const isExpanded = expandedCategories.has(category.id);
                
                return (
                  <div key={category.id} className="mb-3 border border-gray-200 rounded-lg overflow-hidden bg-white">
                    {/* Category Header - Clickable */}
                    <button
                      onClick={() => toggleCategory(category.id)}
                      className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 text-left">
                        <div className={`w-5 h-5 flex items-center justify-center transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                          <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                            {language === 'sk' ? category.name : category.nameEn}
                            {category.required && (
                              <span className="text-xs font-semibold px-2 py-0.5 rounded text-white" style={{ backgroundColor: 'var(--color-primary)' }}>
                                {language === 'sk' ? 'POVINNÉ' : 'REQUIRED'}
                              </span>
                            )}
                          </h3>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {language === 'sk' 
                              ? `Vyberte ${category.maxSelection === 1 ? '1' : `max. ${category.maxSelection}`}`
                              : `Select ${category.maxSelection === 1 ? '1' : `up to ${category.maxSelection}`}`
                            }
                          </p>
                        </div>
                      </div>
                    </button>

                    {/* Category Options - Collapsible */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="p-4 pt-0">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
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
                                  relative p-3 rounded-lg border-2 text-left transition-all cursor-pointer
                                  ${isSelected 
                                    ? 'shadow-md'
                                    : isDisabled
                                      ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                                      : 'border-gray-200 hover:border-[var(--color-primary)] hover:shadow-sm'
                                  }
                                `}
                                style={isSelected ? {
                                  borderColor: 'var(--color-primary)',
                                  backgroundColor: primaryColorRgba
                                } : {
                                  backgroundColor: '#ffffff'
                                }}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <div 
                                      className="font-semibold text-sm truncate"
                                      style={{ 
                                        color: '#000000', 
                                        fontWeight: 600,
                                        WebkitTextFillColor: '#000000'
                                      }}
                                    >
                                      {language === 'sk' ? option.name : option.nameEn}
                                    </div>
                                    {option.price > 0 && (
                                      <div 
                                        className="font-bold text-xs mt-0.5" 
                                        style={{ 
                                          color: isSelected ? '#000000' : 'var(--color-primary)',
                                          WebkitTextFillColor: isSelected ? '#000000' : 'var(--color-primary)'
                                        }}
                                      >
                                        +€{(option.price / 100).toFixed(2)}
                                      </div>
                                    )}
                                  </div>
                                  <div 
                                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${!isSelected ? 'border-gray-300' : ''}`}
                                    style={isSelected ? {
                                      borderColor: 'var(--color-primary)',
                                      backgroundColor: 'var(--color-primary)'
                                    } : {}}
                                  >
                                    {isSelected && (
                                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
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
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            {/* Sticky Footer */}
            <div className="sticky bottom-0 border-t border-gray-200 bg-white p-4 sm:p-6 shadow-lg">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="text-xs sm:text-sm text-gray-600 mb-1">
                    {language === 'sk' ? 'Celková cena:' : 'Total price:'}
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold" style={{ color: 'var(--color-primary)' }}>
                    €{(totalPrice / 100).toFixed(2)}
                  </div>
                </div>
                <button
                  onClick={handleAddToCart}
                  className="px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold text-white text-base sm:text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105 active:scale-95 inline-flex items-center gap-2 flex-shrink-0"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  {language === 'sk' ? 'Pridať do košíka' : 'Add to Cart'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
