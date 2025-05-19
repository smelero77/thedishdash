import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { normalizeModifiers, getCartKey } from '@/utils/cartTransformers';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

interface TemporaryOrderItem {
  temporary_order_id: string;
  menu_item_id: string;
  quantity: number;
  modifiers_data: any;
  alias: string;
  menu_item: any;
  created_at: string;
  updated_at: string;
}

export const useCartSync = (
  temporaryOrderId: string | null,
  onCartUpdate: (cart: any) => void,
  onError: (error: Error) => void
) => {
  useEffect(() => {
    if (!temporaryOrderId) return;

    const subscription = supabase
      .channel(`temporary_order_items:${temporaryOrderId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'temporary_order_items',
          filter: `temporary_order_id=eq.${temporaryOrderId}`
        },
        async (payload: RealtimePostgresChangesPayload<TemporaryOrderItem>) => {
          try {
            console.log('Realtime change received:', payload);
            
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              const item = payload.new;
              if (!item || !item.menu_item_id || !item.alias) {
                console.warn('Item incompleto recibido:', item);
                return;
              }
              
              const normalizedModifiers = normalizeModifiers(item.modifiers_data);
              const cartKey = getCartKey(item.menu_item_id, normalizedModifiers, item.alias);
              onCartUpdate((prevCart: any) => ({
                ...prevCart,
                [cartKey]: {
                  id: item.menu_item_id,
                  item: item.menu_item,
                  modifiers: normalizedModifiers,
                  quantity: item.quantity,
                  client_alias: item.alias
                }
              }));
            } else if (payload.eventType === 'DELETE') {
              const item = payload.old;
              if (!item || !item.menu_item_id || !item.alias) {
                console.warn('Item incompleto recibido:', item);
                return;
              }
              
              const normalizedModifiers = normalizeModifiers(item.modifiers_data);
              const cartKey = getCartKey(item.menu_item_id, normalizedModifiers, item.alias);
              onCartUpdate((prevCart: any) => {
                const newCart = { ...prevCart };
                delete newCart[cartKey];
                return newCart;
              });
            }
          } catch (error) {
            onError(error as Error);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [temporaryOrderId, onCartUpdate, onError]);
}; 