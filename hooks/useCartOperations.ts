import { useState, useCallback } from 'react';
import { MenuItemData } from '@/types/menu';
import { normalizeModifiers, getCartKey, transformCartItem } from '@/utils/cartTransformers';
import { calculateItemPrice, calculateCartTotal } from '@/utils/cartCalculations';

export const useCartOperations = (currentClientAlias: string | null) => {
  const [cart, setCart] = useState<Record<string, any>>({});
  const [total, setTotal] = useState(0);
  const [pendingOperations, setPendingOperations] = useState<Array<() => void>>([]);

  const addItem = useCallback((item: MenuItemData, modifiers: Record<string, any> | null) => {
    const normalizedModifiers = normalizeModifiers(modifiers);
    const cartKey = getCartKey(item.id, normalizedModifiers, currentClientAlias || '');
    
    // Actualización optimista
    setCart(prevCart => {
      const newCart = { ...prevCart };
      if (newCart[cartKey]) {
        newCart[cartKey].quantity += 1;
      } else {
        newCart[cartKey] = transformCartItem(item, normalizedModifiers);
      }
      return newCart;
    });

    // Actualizar el total inmediatamente
    setTotal(prevTotal => prevTotal + calculateItemPrice(item, normalizedModifiers || {}));

    // Guardar la operación para rollback si es necesario
    setPendingOperations(prev => [...prev, () => {
      setCart(prevCart => {
        const newCart = { ...prevCart };
        if (newCart[cartKey]) {
          if (newCart[cartKey].quantity > 1) {
            newCart[cartKey].quantity -= 1;
          } else {
            delete newCart[cartKey];
          }
        }
        return newCart;
      });
      setTotal(prevTotal => prevTotal - calculateItemPrice(item, normalizedModifiers || {}));
    }]);
  }, [currentClientAlias]);

  const removeItem = useCallback((item: MenuItemData, modifiers: Record<string, any> | null) => {
    const normalizedModifiers = normalizeModifiers(modifiers);
    const cartKey = getCartKey(item.id, normalizedModifiers, currentClientAlias || '');
    
    // Actualización optimista
    setCart(prevCart => {
      const newCart = { ...prevCart };
      if (newCart[cartKey]) {
        if (newCart[cartKey].quantity > 1) {
          newCart[cartKey].quantity -= 1;
        } else {
          delete newCart[cartKey];
        }
      }
      return newCart;
    });

    // Actualizar el total inmediatamente
    setTotal(prevTotal => prevTotal - calculateItemPrice(item, normalizedModifiers || {}));

    // Guardar la operación para rollback si es necesario
    setPendingOperations(prev => [...prev, () => {
      setCart(prevCart => {
        const newCart = { ...prevCart };
        if (newCart[cartKey]) {
          newCart[cartKey].quantity += 1;
        } else {
          newCart[cartKey] = transformCartItem(item, normalizedModifiers);
        }
        return newCart;
      });
      setTotal(prevTotal => prevTotal + calculateItemPrice(item, normalizedModifiers || {}));
    }]);
  }, [currentClientAlias]);

  const getItemQuantity = useCallback((itemId: string, modifiers: Record<string, any> | null) => {
    const cartKey = getCartKey(itemId, modifiers, currentClientAlias || '');
    return cart[cartKey]?.quantity || 0;
  }, [cart, currentClientAlias]);

  const rollbackLastOperation = useCallback(() => {
    if (pendingOperations.length > 0) {
      const lastOperation = pendingOperations[pendingOperations.length - 1];
      lastOperation();
      setPendingOperations(prev => prev.slice(0, -1));
    }
  }, [pendingOperations]);

  return {
    cart,
    total,
    addItem,
    removeItem,
    getItemQuantity,
    rollbackLastOperation
  };
}; 