"use client";

import React, { useState, useEffect, useCallback, forwardRef, useRef } from 'react';
import { X } from 'lucide-react';
import { MenuItemAllergen as Allergen, MenuItemData } from '@/types/menu';
import { ScrollProgressBar } from '@/components/ScrollProgressBar';
import { formatPrice } from '@/utils/format';

interface ModifierOption {
  id: string;
  name: string;
  extra_price: number;
  is_default: boolean;
  icon_url?: string;
  related_menu_item_id?: string;
  allergens: Allergen[];
}

interface Modifier {
  id: string;
  name: string;
  description: string;
  required: boolean;
  multi_select: boolean;
  options: ModifierOption[];
}

interface ModifierModalProps {
  isOpen: boolean;
  itemName: string;
  itemDescription?: string;
  itemAllergens?: Allergen[];
  modifiers: Modifier[];
  menuItems: MenuItemData[];
  onClose: () => void;
  onConfirm: (selectedOptions: Record<string, string[]>) => void;
}

const ModifierModalComponent = forwardRef<HTMLDivElement, ModifierModalProps>(({
  isOpen,
  itemName,
  itemDescription,
  itemAllergens,
  modifiers,
  menuItems,
  onClose,
  onConfirm
}, ref) => {
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});
  const [isVisible, setIsVisible] = useState(false);
  const [activeModifier, setActiveModifier] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const modifierRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Función para detectar el modificador visible
  const handleScroll = useCallback(() => {
    const content = contentRef.current;
    if (!content) return;

    const scrollTop = content.scrollTop;
    const headerHeight = 180;
    const viewportHeight = content.clientHeight;
    const scrollBottom = scrollTop + viewportHeight;
    const tolerance = 50; // Margen de tolerancia para la detección

    // Encontrar el modificador más visible
    let mostVisibleModifier: string | null = null;
    let maxVisibility = 0;

    Object.entries(modifierRefs.current).forEach(([id, element]) => {
      if (element) {
        const rect = element.getBoundingClientRect();
        const elementTop = rect.top + scrollTop;
        const elementBottom = elementTop + rect.height;
        
        // Calcular cuánto del elemento es visible
        const visibleTop = Math.max(elementTop, scrollTop);
        const visibleBottom = Math.min(elementBottom, scrollBottom);
        const visibleHeight = Math.max(0, visibleBottom - visibleTop);
        
        // Añadir bonus de visibilidad si el elemento está cerca del centro del viewport
        const elementCenter = elementTop + (rect.height / 2);
        const viewportCenter = scrollTop + (viewportHeight / 2);
        const distanceFromCenter = Math.abs(elementCenter - viewportCenter);
        const centerBonus = Math.max(0, 1 - (distanceFromCenter / (viewportHeight / 2)));
        
        // Añadir bonus si es el último elemento y estamos cerca del final
        const isLastElement = id === modifiers[modifiers.length - 1].id;
        const isNearBottom = scrollBottom >= content.scrollHeight - tolerance;
        const lastElementBonus = isLastElement && isNearBottom ? 1 : 0;
        
        const totalVisibility = visibleHeight + (centerBonus * 100) + (lastElementBonus * 200);
        
        if (totalVisibility > maxVisibility) {
          maxVisibility = totalVisibility;
          mostVisibleModifier = id;
        }
      }
    });

    if (mostVisibleModifier) {
      setActiveModifier(mostVisibleModifier);
    }
  }, [modifiers]);

  // Añadir y remover el event listener de scroll
  useEffect(() => {
    const content = contentRef.current;
    if (content) {
      content.addEventListener('scroll', handleScroll);
      // Ejecutar una vez al montar para establecer el modificador inicial
      handleScroll();
      return () => content.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  // Reset selected options and set initial active modifier when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      // Initialize selected options with default values
      const initialOptions: Record<string, string[]> = {};
      modifiers.forEach(modifier => {
        if (modifier.required && !modifier.multi_select) {
          const defaultOption = modifier.options.find(opt => opt.is_default);
          if (defaultOption) {
            initialOptions[modifier.id] = [defaultOption.id];
          }
        }
      });
      setSelectedOptions(initialOptions);
      // Set first modifier as active
      if (modifiers.length > 0) {
        setActiveModifier(modifiers[0].id);
      }
    } else {
      setIsVisible(false);
    }
  }, [isOpen, modifiers]);

  // Función para hacer scroll a un modificador específico
  const scrollToModifier = useCallback((modifierId: string) => {
    const element = modifierRefs.current[modifierId];
    if (element && contentRef.current) {
      const headerHeight = 180;
      const isLastModifier = modifierId === modifiers[modifiers.length - 1].id;
      
      // Si es el último modificador, asegurarnos de que se vea completamente
      const offset = isLastModifier 
        ? Math.max(0, contentRef.current.scrollHeight - contentRef.current.clientHeight)
        : element.offsetTop - headerHeight;

      contentRef.current.scrollTo({
        top: offset,
        behavior: 'smooth'
      });
      setActiveModifier(modifierId);
    }
  }, [modifiers]);

  const handleOptionSelect = useCallback((modifierId: string, optionId: string) => {
    const modifier = modifiers.find(m => m.id === modifierId);
    if (!modifier) return;

    console.log('Modifier ID:', modifier.id, '→ multi_select:', modifier.multi_select);
    const isMulti = !!modifier.multi_select;

    if (!isMulti) {
      const newSelectedOptions = { ...selectedOptions, [modifierId]: [optionId] };
      // Si es multi-selección o hay más de un modificador, no cerrar automáticamente
      if (isMulti || modifiers.length > 1) {
        setSelectedOptions(newSelectedOptions);
      } else {
        onConfirm(newSelectedOptions);
        onClose();
      }
    } else {
      setSelectedOptions(prev => {
        const current = prev[modifierId] || [];
        const newOptions = current.includes(optionId)
          ? current.filter(id => id !== optionId)
          : [...current, optionId];
        return { ...prev, [modifierId]: newOptions };
      });
    }
  }, [modifiers, selectedOptions, onConfirm, onClose]);

  const handleConfirm = useCallback(() => {
    // Validate required modifiers
    const requiredModifiers = modifiers.filter(m => m.required);
    const hasAllRequired = requiredModifiers.every(modifier => {
      const selected = selectedOptions[modifier.id];
      return selected && selected.length > 0;
    });

    if (!hasAllRequired) {
      // TODO: Show error message
      return;
    }

    console.log('Confirming selected options:', selectedOptions);
    onConfirm(selectedOptions);
    onClose();
  }, [modifiers, selectedOptions, onConfirm, onClose]);

  const isOptionSelected = (modifierId: string, optionId: string) => {
    return selectedOptions[modifierId]?.includes(optionId) || false;
  };

  // Solo mostrar el botón si hay más de un modificador o si hay modificadores multi-select
  const showConfirmButton = modifiers.length > 1 || modifiers.some(
    (m) => m.multi_select && m.options.length > 0
  );

  // Función para calcular el total
  const calculateTotal = () => {
    let total = 0;
    Object.entries(selectedOptions).forEach(([modifierId, optionIds]) => {
      const modifier = modifiers.find(m => m.id === modifierId);
      if (modifier) {
        optionIds.forEach(optionId => {
          const option = modifier.options.find(o => o.id === optionId);
          if (option) {
            total += option.extra_price;
          }
        });
      }
    });
    return total;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Fondo con blur */}
      <div
        className={`fixed inset-0 backdrop-blur-md transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />

      {/* Modal principal */}
      <div
        className={`fixed bottom-0 left-0 right-0 bg-white dark:bg-[#0f1b1a] rounded-t-3xl transform transition-all duration-500 ease-in-out ${isVisible ? 'translate-y-0' : 'translate-y-full'}`}
        style={{ maxHeight: '90vh' }}
      >
        {/* Barra de progreso - solo si hay más de un modificador */}
        {modifiers.length > 1 && (
          <ScrollProgressBar 
            containerRef={contentRef}
            className="sticky top-0 z-20"
            barClassName="bg-[#1ce3cf]"
            trackClassName="bg-[#d0e6e4]"
          />
        )}

        {/* Header fijo */}
        <div className="sticky top-0 z-10 bg-white dark:bg-[#0f1b1a] px-4 pt-4 pb-2">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-[#0e1b19] dark:text-white text-xl font-bold">{itemName}</h2>
              {itemAllergens?.map((a) => (
                a.icon_url ? (
                  <img 
                    key={a.id}
                    src={a.icon_url}
                    alt={a.name}
                    title={a.name}
                    className="w-6 h-6 object-contain"
                  />
                ) : (
                  <div
                    key={a.id}
                    className="text-xs px-2.5 py-1.5 bg-[#f3f7f7] dark:bg-[#1ce3cf]/10 text-[#4f968f] rounded-full"
                  >
                    {a.name}
                  </div>
                )
              ))}
            </div>
            <button 
              onClick={onClose} 
              className="p-2 -m-2 text-[#4f968f] hover:text-[#1ce3cf] active:scale-95 transition-all"
              aria-label="Cerrar"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {itemDescription && (
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">{itemDescription}</p>
          )}

          {/* Tabs de modificadores - solo si hay más de uno */}
          {modifiers.length > 1 && (
            <div className="relative">
              <div className="overflow-x-auto" style={{ 
                msOverflowStyle: 'none',
                scrollbarWidth: 'none',
                WebkitOverflowScrolling: 'touch'
              }}>
                <div className="flex gap-2 pb-2 min-w-full">
                  {modifiers.map((modifier) => (
                    <button
                      key={modifier.id}
                      onClick={() => scrollToModifier(modifier.id)}
                      className={`flex-shrink-0 px-5 py-3 rounded-full text-sm font-medium transition-all ${
                        activeModifier === modifier.id
                          ? 'bg-[#1ce3cf] text-[#0e1b19]'
                          : selectedOptions[modifier.id]?.length > 0
                            ? 'bg-[#1ce3cf]/20 text-[#4f968f]'
                            : 'bg-[#f3f7f7] dark:bg-[#1ce3cf]/10 text-[#4f968f]'
                      }`}
                    >
                      {modifier.name}
                    </button>
                  ))}
                </div>
              </div>
              {/* Indicador de scroll */}
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-[#0f1b1a] to-transparent pointer-events-none" />
            </div>
          )}
        </div>

        {/* Contenido scrolleable */}
        <div 
          ref={contentRef}
          className="overflow-y-auto px-4 py-2 pb-24" 
          style={{ 
            maxHeight: 'calc(90vh - 180px)',
            msOverflowStyle: 'none',
            scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {modifiers.map((modifier) => (
            <div 
              key={modifier.id} 
              ref={(el) => {
                modifierRefs.current[modifier.id] = el;
              }}
              className="mb-6"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-[#0e1b19] dark:text-white">{modifier.name}</h3>
                  {modifier.required && (
                    <span className="px-2.5 py-1 text-xs font-medium text-white bg-[#ff6b6b] rounded-full">
                      Obligatorio
                    </span>
                  )}
                </div>
              </div>

              {modifier.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{modifier.description}</p>
              )}

              <div className="grid gap-3">
                {modifier.options.map((option) => {
                  const relatedItemImage = option.related_menu_item_id
                    ? menuItems.find(item => item.id === option.related_menu_item_id)?.image_url
                    : null;

                  return (
                    <button
                      key={option.id}
                      onClick={() => handleOptionSelect(modifier.id, option.id)}
                      className={`w-full flex items-start gap-3 p-4 rounded-2xl border transition-all duration-200 ${
                        isOptionSelected(modifier.id, option.id)
                          ? 'bg-[#1ce3cf]/10 border-[#1ce3cf] scale-[1.02]'
                          : 'border-[#d0e6e4] hover:border-[#1ce3cf] hover:bg-[#1ce3cf]/5'
                      }`}
                    >
                      {relatedItemImage && (
                        <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                          <img
                            src={relatedItemImage}
                            alt={option.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <span className={`text-base font-medium truncate ${
                            isOptionSelected(modifier.id, option.id)
                              ? 'text-[#0e1b19] dark:text-white'
                              : 'text-[#4f968f]'
                          }`}>
                            {option.name}
                          </span>
                          {option.extra_price > 0 && (
                            <span className="text-base font-medium text-[#1ce3cf] ml-2 flex-shrink-0">
                              +{formatPrice(option.extra_price)}
                            </span>
                          )}
                        </div>
                        
                        {option.allergens?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {option.allergens.map((a) => (
                              <div
                                key={a.id}
                                className="text-xs px-2.5 py-1 bg-[#f3f7f7] dark:bg-[#1ce3cf]/10 text-[#4f968f] rounded-full"
                              >
                                {a.name}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Indicador de selección */}
                      <div className={`w-6 h-6 rounded-full border-2 flex-shrink-0 ${
                        isOptionSelected(modifier.id, option.id)
                          ? 'border-[#1ce3cf] bg-[#1ce3cf]'
                          : 'border-[#d0e6e4]'
                      }`}>
                        {isOptionSelected(modifier.id, option.id) && (
                          <div className="w-full h-full rounded-full bg-white scale-[0.4]" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer fijo */}
        {showConfirmButton && (
          <div className="fixed bottom-4 left-4 right-4 z-50">
            <div className="max-w-2xl mx-auto">
              <button
                onClick={handleConfirm}
                className="w-full h-12 bg-[#1ce3cf] text-[#0e1b19] text-base font-bold leading-normal tracking-[0.015em] rounded-full shadow-lg hover:bg-[#1ce3cf] hover:text-[#0e1b19]"
              >
                Añadir al pedido
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

ModifierModalComponent.displayName = "ModifierModal";
export default React.memo(ModifierModalComponent);
