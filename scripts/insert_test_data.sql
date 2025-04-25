-- Insertar algunos alérgenos
INSERT INTO allergens (id, name, icon_url) VALUES
  (gen_random_uuid(), 'Gluten', 'https://cdn.usegalileo.ai/sdxl10/gluten-icon.png'),
  (gen_random_uuid(), 'Lácteos', 'https://cdn.usegalileo.ai/sdxl10/dairy-icon.png'),
  (gen_random_uuid(), 'Frutos secos', 'https://cdn.usegalileo.ai/sdxl10/nuts-icon.png'),
  (gen_random_uuid(), 'Soya', 'https://cdn.usegalileo.ai/sdxl10/soy-icon.png');

-- Insertar algunas etiquetas dietéticas
INSERT INTO diet_tags (id, name) VALUES
  (gen_random_uuid(), 'Vegetariano'),
  (gen_random_uuid(), 'Vegano'),
  (gen_random_uuid(), 'Sin gluten'),
  (gen_random_uuid(), 'Bajo en calorías');

-- Insertar elementos del menú para la categoría "Tapas"
INSERT INTO menu_items (id, name, description, price, image_url, category_id, food_info, origin, pairing_suggestion, chef_notes, is_recommended) VALUES
  (
    gen_random_uuid(),
    'Patatas Bravas',
    'Patatas fritas con salsa brava y alioli',
    8.50,
    'https://cdn.usegalileo.ai/sdxl10/ecd9a08b-a1e3-4cfe-b7d2-df4f2b257f2f.png',
    '25f09309-bb9b-42d8-8331-08672f114bb3',
    'Calorías: 450kcal, Proteínas: 5g, Carbohidratos: 45g',
    'España',
    'Cerveza fría o vino tinto joven',
    'Nuestra salsa brava es una receta familiar con más de 50 años de historia',
    true
  ),
  (
    gen_random_uuid(),
    'Croquetas de Jamón',
    'Croquetas caseras de jamón ibérico',
    9.50,
    'https://cdn.usegalileo.ai/sdxl10/0bb58b90-b677-46dc-b759-3c05283efa8b.png',
    '25f09309-bb9b-42d8-8331-08672f114bb3',
    'Calorías: 380kcal, Proteínas: 12g, Carbohidratos: 35g',
    'España',
    'Vino blanco afrutado',
    'Elaboradas con jamón ibérico de bellota',
    true
  ),
  (
    gen_random_uuid(),
    'Tortilla Española',
    'Tortilla de patatas tradicional con cebolla',
    7.50,
    'https://cdn.usegalileo.ai/sdxl10/8a2dc3d0-8ba4-4100-982a-c684eb20e823.png',
    '25f09309-bb9b-42d8-8331-08672f114bb3',
    'Calorías: 420kcal, Proteínas: 15g, Carbohidratos: 40g',
    'España',
    'Vino tinto joven o cerveza',
    'Cocinada a fuego lento para una textura perfecta',
    false
  );

-- Obtener los IDs de los elementos del menú y alérgenos recién insertados
DO $$
DECLARE
  patatas_id UUID;
  croquetas_id UUID;
  tortilla_id UUID;
  gluten_id UUID;
  lacteos_id UUID;
BEGIN
  -- Obtener IDs de los elementos del menú
  SELECT id INTO patatas_id FROM menu_items WHERE name = 'Patatas Bravas';
  SELECT id INTO croquetas_id FROM menu_items WHERE name = 'Croquetas de Jamón';
  SELECT id INTO tortilla_id FROM menu_items WHERE name = 'Tortilla Española';

  -- Obtener IDs de los alérgenos
  SELECT id INTO gluten_id FROM allergens WHERE name = 'Gluten';
  SELECT id INTO lacteos_id FROM allergens WHERE name = 'Lácteos';

  -- Insertar relaciones de alérgenos
  INSERT INTO menu_item_allergens (menu_item_id, allergen_id) VALUES
    (patatas_id, gluten_id),
    (croquetas_id, gluten_id),
    (croquetas_id, lacteos_id),
    (tortilla_id, lacteos_id);
END $$; 