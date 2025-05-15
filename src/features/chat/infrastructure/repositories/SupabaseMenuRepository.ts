import { MenuRepository } from '@/features/chat/domain/ports/MenuRepository';
import { MenuItem, Modifier, ModifierOption } from '@/features/chat/domain/types';
import { WeatherContext } from '@/features/chat/domain/types/WeatherContext';
import { Filters } from '@/features/chat/domain/entities/Filters';
import { createClient } from '@supabase/supabase-js';

interface SlotMenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category_id: string;
  is_available: boolean;
  is_combo: boolean;
  combo_items?: string[];
  modifiers?: string[];
  dietary_info: {
    is_vegetarian: boolean;
    is_vegan: boolean;
    is_gluten_free: boolean;
    calories: number;
  };
  weather_conditions?: {
    temperature_range: {
      min: number;
      max: number;
    };
    allowed_conditions: string[];
  };
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
            category_id,
            is_available,
            is_combo,
            combo_items,
            modifiers,
            dietary_info,
            weather_conditions
          )
        `)
        .eq('slot_id', slotId)
        .eq('is_available', true);

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
        categoryIds: [item.category_id],
        isAvailable: item.is_available,
        isRecommended: false,
        modifiers: item.modifiers?.map(modifierId => ({
          id: modifierId,
          name: '',
          required: false,
          multiSelect: false,
          options: []
        })) || []
      }));
    } catch (error) {
      console.error('Error finding menu items:', error);
      throw new Error('Error finding menu items');
    }
  }

  async getModifiers(itemId: string): Promise<ModifierOption[]> {
    try {
      const { data, error } = await this.supabase
        .from('menu_item_modifiers')
        .select(`
          *,
          modifier:modifiers (
            id,
            name,
            description,
            options
          )
        `)
        .eq('menu_item_id', itemId);

      if (error) throw error;

      return data.map(item => ({
        id: item.modifier.id,
        name: item.modifier.name,
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
            category_id,
            is_available,
            is_combo,
            combo_items,
            modifiers,
            dietary_info,
            weather_conditions
          )
        `)
        .eq('slot_id', slotId)
        .eq('is_available', true);

      if (error) throw error;

      return (data as unknown as SlotMenuItem[]).map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        imageUrl: item.image_url,
        categoryIds: [item.category_id],
        isAvailable: item.is_available,
        isRecommended: false,
        modifiers: item.modifiers?.map(modifierId => ({
          id: modifierId,
          name: '',
          required: false,
          multiSelect: false,
          options: []
        })) || []
      }));
    } catch (error) {
      console.error('Error getting menu items:', error);
      throw new Error('Error getting menu items');
    }
  }
} 