"use client";

import React, { useState, useEffect, useCallback, forwardRef } from 'react';
import { X } from 'lucide-react';
import { MenuItemAllergen as Allergen } from "../types/menu";
import { MenuItemData } from "../types/menu";

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

const formatPrice = (price: number) => {
  return price.toFixed(2) + '€';
};

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

  // Reset selected options when modal opens
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
    } else {
      setIsVisible(false);
    }
  }, [isOpen, modifiers]);

  const handleOptionSelect = useCallback((modifierId: string, optionId: string) => {
    const modifier = modifiers.find(m => m.id === modifierId);
    if (!modifier) return;

    console.log('Modifier ID:', modifier.id, '→ multi_select:', modifier.multi_select);
    const isMulti = !!modifier.multi_select;

    if (!isMulti) {
      const newSelectedOptions = { ...selectedOptions, [modifierId]: [optionId] };
      onConfirm(newSelectedOptions);
      onClose(); // ✅ Solo cerrar si es mono-selección
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

  // Solo mostrar el botón si hay al menos un modificador multi-select con opciones
  const showConfirmButton = modifiers.some(
    (m) => m.multi_select && m.options.length > 0
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Fondo oscuro */}
      <div
        className={`fixed inset-0 bg-black transition-opacity duration-500 ${isVisible ? 'opacity-50' : 'opacity-0'}`}
        onClick={onClose}
      />

      {/* Modal principal */}
      <div
        className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl transform transition-all duration-500 ease-in-out ${isVisible ? 'translate-y-0' : 'translate-y-full'}`}
        style={{ maxHeight: '80vh' }}
      >
        <div className="p-4 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-[#0e1b19] text-xl font-bold">{itemName}</h2>
              {itemAllergens?.map((a) => (
                a.icon_url ? (
                  <img 
                    key={a.id}
                    src={a.icon_url}
                    alt={a.name}
                    title={a.name}
                    className="w-5 h-5 object-contain"
                  />
                ) : (
                  <div
                    key={a.id}
                    className="text-xs px-2 py-1 bg-[#f3f7f7] text-[#4f968f] rounded"
                  >
                    {a.name}
                  </div>
                )
              ))}
            </div>
            <button onClick={onClose} className="text-[#4f968f] hover:text-[#0e1b19]">
              <X className="h-6 w-6" />
            </button>
          </div>

          <p className="text-gray-600 mb-6">{itemDescription}</p>

          <div className="overflow-y-auto flex-1 no-scrollbar" style={{ maxHeight: 'calc(80vh - 200px)' }}>
            {modifiers.map((modifier) => (
              <div key={modifier.id} className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <h3 className="text-lg font-semibold text-[#0e1b19]">{modifier.name}</h3>
                    {modifier.required && (
                      <span className="ml-2 px-2 py-0.5 text-xs font-medium text-white bg-gradient-to-r from-red-500 to-red-700 rounded-full">
                        Obligatorio
                      </span>
                    )}
                  </div>
                </div>

                {modifier.description && (
                  <p className="text-sm text-gray-500 mb-4">{modifier.description}</p>
                )}

                <div className="space-y-3">
                  {modifier.options.map((option) => {
                    // Debug logs
                    console.log(`Option "${option.name}":`, {
                      related_menu_item_id: option.related_menu_item_id,
                      found_item: menuItems.find(item => item.id === option.related_menu_item_id),
                      all_menu_items_ids: menuItems.map(item => item.id)
                    });

                    const relatedItemImage = option.related_menu_item_id
                      ? menuItems.find(item => item.id === option.related_menu_item_id)?.image_url
                      : null;

                    if (option.related_menu_item_id && !relatedItemImage) {
                      console.warn(`No image found for option "${option.name}" with related_menu_item_id:`, option.related_menu_item_id);
                    }

                    return (
                      <button
                        key={option.id}
                        onClick={() => handleOptionSelect(modifier.id, option.id)}
                        className={`w-full flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                          isOptionSelected(modifier.id, option.id)
                            ? 'bg-[#1ce3cf] border-[#1ce3cf]'
                            : 'border-[#d0e6e4] hover:border-[#1ce3cf]'
                        }`}
                      >
                        {/* Render image using related item's image_url if found */}
                        {relatedItemImage && (
                          <img
                            src={relatedItemImage}
                            alt={option.name}
                            className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
                          />
                        )}
                        {/* Fallback or alternative if no related image (optional) */}
                        {/* {!relatedItemImage && option.icon_url && (...)} */}
                        
                        {/* Option Details */}
                        <div className="flex-1 text-left">
                          <div className="flex justify-between">
                            <span className={`text-sm font-bold ${
                              isOptionSelected(modifier.id, option.id)
                                ? 'text-[#0e1b19]'
                                : 'text-[#4f968f]'
                            }`}>
                              {option.name}
                            </span>
                            {option.extra_price > 0 && (
                              <span className="text-sm font-bold text-[#4f968f]">
                                +{formatPrice(option.extra_price)}
                              </span>
                            )}
                          </div>
                          {option.allergens?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {option.allergens.map((a) => (
                                <div
                                  key={a.id}
                                  className="text-xs px-1.5 py-0.5 bg-[#f3f7f7] text-[#4f968f] rounded"
                                >
                                  {a.name}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {showConfirmButton && (
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleConfirm}
                className="px-4 py-2 bg-[#1ce3cf] text-[#0e1b19] text-sm font-bold rounded-lg"
              >
                Añadir
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

ModifierModalComponent.displayName = "ModifierModal";
export default React.memo(ModifierModalComponent);
