import { supabase } from '../supabase';

export interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  food_info: string | null;
  origin: string | null;
  pairing_suggestion: string | null;
  chef_notes: string | null;
  is_recommended: boolean;
  is_available: boolean;
  profit_margin: number | null;
  category_ids: string[];
  allergens?: string[];
  diet_tags?: string[];
  modifiers?: {
    id: string;
    name: string;
    description: string | null;
    required: boolean;
    multi_select: boolean;
    options: {
      id: string;
      name: string;
      extra_price: number;
      is_default: boolean;
      icon_url: string | null;
      related_menu_item_id: string | null;
      allergens?: string[];
    }[];
  }[];
}

export interface Category {
  id: string;
  name: string;
  menu_items: MenuItem[] | null;
}

export interface Slot {
  id: string;
  name: string;
  description: string | null;
  start_time: string;
  end_time: string;
  categories?: {
    id: string;
    name: string;
  }[];
}

export interface MenuContext {
  categories: Category[];
  slots: Slot[];
}

export async function getPromptContextFromSupabase(): Promise<MenuContext> {
  try {
    const { data, error } = await supabase.rpc('gpt_get_prompt_context');

    if (error) {
      console.error('Error getting prompt context:', error);
      throw error;
    }

    if (!data) {
      throw new Error('No data returned from gpt_get_prompt_context');
    }

    return data;
  } catch (error) {
    console.error('Error in getPromptContextFromSupabase:', error);
    throw error;
  }
}

// SQL function to be executed in Supabase:
/*
CREATE OR REPLACE FUNCTION public.gpt_get_prompt_context()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN jsonb_build_object(
    'categories', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', c.id,
          'name', c.name,
          'menu_items', (
            SELECT jsonb_agg(
              jsonb_build_object(
                'id', mi.id,
                'name', mi.name,
                'description', mi.description,
                'price', mi.price,
                'image_url', mi.image_url,
                'food_info', mi.food_info,
                'origin', mi.origin,
                'pairing_suggestion', mi.pairing_suggestion,
                'chef_notes', mi.chef_notes,
                'is_recommended', mi.is_recommended,
                'is_available', mi.is_available,
                'profit_margin', mi.profit_margin,
                'category_ids', mi.category_ids,
                'allergens', (
                  SELECT jsonb_agg(a.name)
                  FROM menu_item_allergens mia
                  JOIN allergens a ON a.id = mia.allergen_id
                  WHERE mia.menu_item_id = mi.id
                ),
                'diet_tags', (
                  SELECT jsonb_agg(dt.name)
                  FROM menu_item_diet_tags midt
                  JOIN diet_tags dt ON dt.id = midt.diet_tag_id
                  WHERE midt.menu_item_id = mi.id
                ),
                'modifiers', (
                  SELECT jsonb_agg(
                    jsonb_build_object(
                      'id', m.id,
                      'name', m.name,
                      'description', m.description,
                      'required', m.required,
                      'multi_select', m.multi_select,
                      'options', (
                        SELECT jsonb_agg(
                          jsonb_build_object(
                            'id', mo.id,
                            'name', mo.name,
                            'extra_price', COALESCE(mo.extra_price, 0),
                            'is_default', mo.is_default,
                            'icon_url', mo.icon_url,
                            'related_menu_item_id', mo.related_menu_item_id,
                            'allergens', (
                              SELECT jsonb_agg(a.name)
                              FROM modifier_options_allergens moa
                              JOIN allergens a ON a.id = moa.allergen_id
                              WHERE moa.modifier_option_id = mo.id
                            )
                          )
                        )
                        FROM modifier_options mo
                        WHERE mo.modifier_id = m.id
                      )
                    )
                  )
                  FROM modifiers m
                  WHERE m.menu_item_id = mi.id
                )
              )
            )
            FROM menu_items mi
            WHERE c.id = ANY(mi.category_ids)
            AND mi.is_available = true
          )
        )
      )
      FROM categories c
      WHERE c.is_complementary = false
    ),
    'slots', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', s.id,
          'name', s.name,
          'description', s.description,
          'start_time', s.start_time,
          'end_time', s.end_time,
          'categories', (
            SELECT jsonb_agg(
              jsonb_build_object(
                'id', c.id,
                'name', c.name
              )
            )
            FROM slot_categories sc
            JOIN categories c ON c.id = sc.category_id
            WHERE sc.slot_id = s.id
          )
        )
      )
      FROM slots s
    )
  );
END;
$$;
*/ 