import { supabase } from '@/lib/supabase';
import { normalizeModifiers } from '@/utils/cartTransformers';

export const useCartDatabase = (temporaryOrderId: string | null, onError: (error: Error) => void) => {
  const addItemToDatabase = async (itemId: string, modifiers: Record<string, any> | null) => {
    if (!temporaryOrderId) return;

    try {
      const normalizedModifiers = normalizeModifiers(modifiers);
      
      const { data: existingItem, error: fetchError } = await supabase
        .from('temporary_order_items')
        .select('*')
        .eq('temporary_order_id', temporaryOrderId)
        .eq('menu_item_id', itemId)
        .eq('modifiers_data', normalizedModifiers)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw new Error(`Error fetching item: ${fetchError.message}`);
      }

      if (existingItem) {
        const { error: updateError } = await supabase
          .from('temporary_order_items')
          .update({ quantity: existingItem.quantity + 1 })
          .eq('id', existingItem.id);

        if (updateError) {
          throw new Error(`Error updating item: ${updateError.message}`);
        }
      } else {
        const { error: insertError } = await supabase
          .from('temporary_order_items')
          .insert({
            temporary_order_id: temporaryOrderId,
            menu_item_id: itemId,
            modifiers_data: normalizedModifiers,
            quantity: 1
          });

        if (insertError) {
          throw new Error(`Error inserting item: ${insertError.message}`);
        }
      }
    } catch (error) {
      onError(error as Error);
      throw error;
    }
  };

  const removeItemFromDatabase = async (itemId: string, modifiers: Record<string, any> | null) => {
    if (!temporaryOrderId) return;

    try {
      const normalizedModifiers = normalizeModifiers(modifiers);
      
      const { data: existingItem, error: fetchError } = await supabase
        .from('temporary_order_items')
        .select('*')
        .eq('temporary_order_id', temporaryOrderId)
        .eq('menu_item_id', itemId)
        .eq('modifiers_data', normalizedModifiers)
        .single();

      if (fetchError) {
        throw new Error(`Error fetching item: ${fetchError.message}`);
      }

      if (existingItem.quantity > 1) {
        const { error: updateError } = await supabase
          .from('temporary_order_items')
          .update({ quantity: existingItem.quantity - 1 })
          .eq('id', existingItem.id);

        if (updateError) {
          throw new Error(`Error updating item: ${updateError.message}`);
        }
      } else {
        const { error: deleteError } = await supabase
          .from('temporary_order_items')
          .delete()
          .eq('id', existingItem.id);

        if (deleteError) {
          throw new Error(`Error deleting item: ${deleteError.message}`);
        }
      }
    } catch (error) {
      onError(error as Error);
      throw error;
    }
  };

  return {
    addItemToDatabase,
    removeItemFromDatabase
  };
}; 