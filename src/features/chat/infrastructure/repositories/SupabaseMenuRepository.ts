import { MenuRepository } from '@/features/chat/domain/ports/MenuRepository';
import { MenuItem, Modifier, ModifierOption } from '@/features/chat/domain/types';
import { WeatherContext } from '@/features/chat/domain/types/WeatherContext';
import { Filters } from '@/features/chat/domain/entities/Filters';
import { Slot } from '@/features/chat/domain/entities/Slot';
import { createClient } from '@supabase/supabase-js';

interface SlotMenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category_ids: string[];
  item_type: string;
  is_vegetarian_base: boolean;
  is_vegan_base: boolean;
  is_gluten_free_base: boolean;
  calories_est_min: number;
  calories_est_max: number;
}

export class SupabaseMenuRepository implements MenuRepository {
  private supabase;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  async findMenuItems(
    slotId: string,
    filters: Filters,
    excludeIds: string[],
    weather?: WeatherContext
  ): Promise<MenuItem[]> {
    try {
      let query = this.supabase
        .from('slot_menu_items')
        .select(`
          *,
          menu_item:menu_items (
            id,
            name,
            description,
            price,
            image_url,
            category_ids,
            item_type,
            is_vegetarian_base,
            is_vegan_base,
            is_gluten_free_base,
            calories_est_min,
            calories_est_max
          )
        `)
        .eq('slot_id', slotId);

      if (excludeIds.length > 0) {
        query = query.not('menu_item_id', 'in', excludeIds);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data as unknown as SlotMenuItem[]).map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        imageUrl: item.image_url,
        categoryIds: item.category_ids || [],
        isAvailable: true, // Por defecto asumimos que está disponible
        itemType: item.item_type,
        isRecommended: false,
        modifiers: [],
        dietaryInfo: {
          isVegetarian: item.is_vegetarian_base,
          isVegan: item.is_vegan_base,
          isGlutenFree: item.is_gluten_free_base,
          calories: item.calories_est_min || item.calories_est_max || 0
        }
      }));
    } catch (error) {
      console.error('Error finding menu items:', error);
      throw new Error('Error finding menu items');
    }
  }

  async getModifiers(itemId: string): Promise<ModifierOption[]> {
    try {
      const { data, error } = await this.supabase
        .from('modifiers')
        .select(`
          id,
          name,
          description,
          required,
          multi_select
        `)
        .eq('menu_item_id', itemId);

      if (error) throw error;

      return data.map(item => ({
        id: item.id,
        name: item.name,
        extraPrice: 0,
        isDefault: false
      }));
    } catch (error) {
      console.error('Error getting modifiers:', error);
      throw new Error('Error getting modifiers');
    }
  }

  async getMenuItems(slotId: string, filters: Filters): Promise<MenuItem[]> {
    try {
      const { data, error } = await this.supabase
        .from('slot_menu_items')
        .select(`
          *,
          menu_item:menu_items (
            id,
            name,
            description,
            price,
            image_url,
            category_ids,
            item_type,
            is_vegetarian_base,
            is_vegan_base,
            is_gluten_free_base,
            calories_est_min,
            calories_est_max
          )
        `)
        .eq('slot_id', slotId);

      if (error) throw error;

      return (data as unknown as SlotMenuItem[]).map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        imageUrl: item.image_url,
        categoryIds: item.category_ids || [],
        isAvailable: true, // Por defecto asumimos que está disponible
        itemType: item.item_type,
        isRecommended: false,
        modifiers: [],
        dietaryInfo: {
          isVegetarian: item.is_vegetarian_base,
          isVegan: item.is_vegan_base,
          isGlutenFree: item.is_gluten_free_base,
          calories: item.calories_est_min || item.calories_est_max || 0
        }
      }));
    } catch (error) {
      console.error('Error getting menu items:', error);
      throw new Error('Error getting menu items');
    }
  }

  async getCurrentSlot(): Promise<Slot | null> {
    try {
      const now = new Date();
      const currentTime = now.toTimeString().split(' ')[0]; // HH:MM:SS format

      const { data, error } = await this.supabase
        .from('slots')
        .select('*')
        .lte('start_time', currentTime)
        .gte('end_time', currentTime)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No slot found for current time
          return null;
        }
        throw error;
      }

      return {
        id: data.id,
        name: data.name,
        startTime: data.start_time,
        endTime: data.end_time
      };
    } catch (error) {
      console.error('Error getting current slot:', error);
      throw new Error('Error getting current slot');
    }
  }
} 