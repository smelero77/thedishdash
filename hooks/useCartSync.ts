import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { normalizeModifiers } from '@/utils/cartTransformers';

interface RealtimePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new?: { data: any };
  old?: { data: any };
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
        async (payload: RealtimePayload) => {
          try {
            console.log('Realtime change received:', payload);
            
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              const { data: item } = payload.new!;
              const normalizedModifiers = normalizeModifiers(item.modifiers_data);
              onCartUpdate((prevCart: any) => ({
                ...prevCart,
                [`${item.menu_item_id}-${JSON.stringify(normalizedModifiers)}`]: {
                  item: item.menu_item,
                  modifiers: normalizedModifiers,
                  quantity: item.quantity
                }
              }));
            } else if (payload.eventType === 'DELETE') {
              const { data: item } = payload.old!;
              const normalizedModifiers = normalizeModifiers(item.modifiers_data);
              onCartUpdate((prevCart: any) => {
                const newCart = { ...prevCart };
                delete newCart[`${item.menu_item_id}-${JSON.stringify(normalizedModifiers)}`];
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