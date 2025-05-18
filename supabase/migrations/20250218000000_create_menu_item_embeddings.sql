CREATE OR REPLACE FUNCTION public.match_menu_items(
  p_query_embedding vector,
  p_match_threshold double precision,
  p_match_count integer,
  p_item_type text DEFAULT NULL::text,
  p_category_ids_include uuid[] DEFAULT NULL::uuid[],
  p_slot_ids uuid[] DEFAULT NULL::uuid[],
  p_allergen_ids_exclude uuid[] DEFAULT NULL::uuid[],
  p_diet_tag_ids_include uuid[] DEFAULT NULL::uuid[],
  p_is_vegetarian_base boolean DEFAULT NULL::boolean,
  p_is_vegan_base boolean DEFAULT NULL::boolean,
  p_is_gluten_free_base boolean DEFAULT NULL::boolean,
  p_is_alcoholic boolean DEFAULT NULL::boolean,
  p_calories_max integer DEFAULT NULL::integer,
  p_calories_min integer DEFAULT NULL::integer,
  p_price_max numeric DEFAULT NULL::numeric,
  p_price_min numeric DEFAULT NULL::numeric,
  p_keywords_include text[] DEFAULT NULL::text[]
)
RETURNS TABLE(
  id uuid,
  name text,
  description text,
  price numeric(6,2),
  image_url text,
  food_info text,
  origin text,
  pairing_suggestion text,
  chef_notes text,
  is_recommended boolean,
  is_available boolean,
  profit_margin numeric(5,2),
  category_ids uuid[],
  item_type text,
  keywords text[],
  calories_est_min integer,
  calories_est_max integer,
  is_alcoholic boolean,
  drink_type text,
  drink_subtype text,
  drink_characteristics text[],
  drink_volume_ml integer,
  drink_abv numeric(4,2),
  drink_brand text,
  wine_varietal text[],
  wine_region text,
  is_new_item boolean,
  is_seasonal boolean,
  is_vegetarian_base boolean,
  is_vegan_base boolean,
  is_gluten_free_base boolean,
  similarity double precision
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    mi.id,
    mi.name,
    mi.description,
    mi.price,
    mi.image_url,
    mi.food_info,
    mi.origin,
    mi.pairing_suggestion,
    mi.chef_notes,
    mi.is_recommended,
    mi.is_available,
    mi.profit_margin,
    mi.category_ids,
    mi.item_type,
    mi.keywords,
    mi.calories_est_min,
    mi.calories_est_max,
    mi.is_alcoholic,
    mi.drink_type,
    mi.drink_subtype,
    mi.drink_characteristics,
    mi.drink_volume_ml,
    mi.drink_abv,
    mi.drink_brand,
    mi.wine_varietal,
    mi.wine_region,
    mi.is_new_item,
    mi.is_seasonal,
    mi.is_vegetarian_base,
    mi.is_vegan_base,
    mi.is_gluten_free_base,
    (1 - (mie.embedding <=> p_query_embedding)) AS similarity
  FROM
    public.menu_items mi
  JOIN
    public.menu_item_embeddings mie ON mi.id = mie.item_id
  WHERE
    mi.is_available = TRUE
    AND (1 - (mie.embedding <=> p_query_embedding)) >= p_match_threshold

    -- Filtros Opcionales (solo se aplican si el parámetro no es NULL)
    AND (p_item_type IS NULL OR mi.item_type = p_item_type)
    AND (p_category_ids_include IS NULL OR mi.category_ids && p_category_ids_include)
    AND (p_slot_ids IS NULL OR EXISTS (
        SELECT 1 FROM public.slot_menu_items smi
        WHERE smi.menu_item_id = mi.id AND smi.slot_id = ANY(p_slot_ids)
    ))
    AND (p_allergen_ids_exclude IS NULL OR NOT EXISTS (
        SELECT 1 FROM public.menu_item_allergens mia
        WHERE mia.menu_item_id = mi.id AND mia.allergen_id = ANY(p_allergen_ids_exclude)
    ))
    AND (p_diet_tag_ids_include IS NULL OR (
        SELECT count(DISTINCT midt.diet_tag_id)
        FROM public.menu_item_diet_tags midt
        WHERE midt.menu_item_id = mi.id AND midt.diet_tag_id = ANY(p_diet_tag_ids_include)
    ) = array_length(p_diet_tag_ids_include, 1))
    AND (p_is_vegetarian_base IS NULL OR mi.is_vegetarian_base = p_is_vegetarian_base)
    AND (p_is_vegan_base IS NULL OR mi.is_vegan_base = p_is_vegan_base)
    AND (p_is_gluten_free_base IS NULL OR mi.is_gluten_free_base = p_is_gluten_free_base)
    AND (p_is_alcoholic IS NULL OR mi.is_alcoholic = p_is_alcoholic)
    AND (p_calories_max IS NULL OR mi.calories_est_max <= p_calories_max)
    AND (p_calories_min IS NULL OR mi.calories_est_min >= p_calories_min)
    AND (p_price_max IS NULL OR mi.price <= p_price_max)
    AND (p_price_min IS NULL OR mi.price >= p_price_min)

    -- Filtro de palabras clave mejorado
    AND (
      p_keywords_include IS NULL OR EXISTS (
        SELECT 1 FROM unnest(p_keywords_include) keyword
        WHERE
          mi.name ILIKE '%' || keyword || '%'
          OR mi.description ILIKE '%' || keyword || '%'
          OR mi.food_info ILIKE '%' || keyword || '%'
          OR mi.origin ILIKE '%' || keyword || '%'
          OR mi.pairing_suggestion ILIKE '%' || keyword || '%'
          OR mi.chef_notes ILIKE '%' || keyword || '%'
          OR keyword = ANY(mi.keywords)
      )
    )

  ORDER BY
    similarity DESC
  LIMIT p_match_count;
END;
$$; 