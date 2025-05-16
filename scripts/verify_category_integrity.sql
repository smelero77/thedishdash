-- Verificar category_ids inválidos en menu_items
WITH invalid_categories AS (
  SELECT 
    mi.id as menu_item_id,
    mi.name as menu_item_name,
    unnest(mi.category_ids) as category_id
  FROM menu_items mi
  LEFT JOIN categories c ON c.id = unnest(mi.category_ids)
  WHERE c.id IS NULL
)
SELECT 
  menu_item_id,
  menu_item_name,
  category_id
FROM invalid_categories
ORDER BY menu_item_name;

-- Estadísticas de categorías
SELECT 
  COUNT(DISTINCT mi.id) as total_menu_items,
  COUNT(DISTINCT c.id) as total_categories,
  COUNT(DISTINCT unnest(mi.category_ids)) as total_category_references,
  COUNT(DISTINCT CASE WHEN c.id IS NOT NULL THEN unnest(mi.category_ids) END) as valid_category_references,
  COUNT(DISTINCT CASE WHEN c.id IS NULL THEN unnest(mi.category_ids) END) as invalid_category_references
FROM menu_items mi
LEFT JOIN categories c ON c.id = unnest(mi.category_ids);

-- Menú items sin categorías
SELECT 
  id as menu_item_id,
  name as menu_item_name
FROM menu_items
WHERE category_ids IS NULL OR array_length(category_ids, 1) = 0;

-- Categorías sin uso
SELECT 
  c.id as category_id,
  c.name as category_name
FROM categories c
LEFT JOIN menu_items mi ON c.id = ANY(mi.category_ids)
WHERE mi.id IS NULL; 