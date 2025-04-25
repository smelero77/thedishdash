# 📘 The DishDash – Base de datos del sistema de pedidos

Esta documentación describe la estructura de la base de datos del sistema de pedidos **DishDash**, diseñada para gestionar menús digitales, pedidos colaborativos, alérgenos, modificadores y sugerencias gastronómicas en tiempo real.

Cada tabla está pensada para representar un elemento clave del flujo de experiencia en mesa, combinando precisión técnica con un enfoque centrado en la gastronomía.

---

## 🍽️ `menu_items`
**Platos del menú**.

| Columna              | Tipo       | Null | Descripción |
|----------------------|------------|------|-------------|
| id                   | uuid       | NO   | Identificador único del plato |
| name                 | text       | NO   | Nombre del plato |
| description          | text       | YES  | Descripción culinaria del plato |
| price                | numeric    | NO   | Precio del plato |
| is_recommended       | boolean    | YES  | Si es una recomendación del chef |
| is_available         | boolean    | YES  | Si está disponible en el momento actual |
| pairing_suggestion   | text       | YES  | Maridaje recomendado (vino, bebida, etc.) |
| chef_notes           | text       | YES  | Comentarios del chef sobre preparación o consumo |
| profit_margin        | numeric    | YES  | Margen de beneficio estimado |
| category_ids         | ARRAY      | YES  | Categorías a las que pertenece |
| origin               | text       | YES  | Origen del plato (p. ej. "Italia") |
| image_url            | text       | YES  | Imagen del plato |
| food_info            | text       | YES  | Información gastronómica o cultural |
| created_at           | timestamp  | YES  | Fecha de creación |
| updated_at           | timestamp  | YES  | Última actualización |
| created_by           | uuid       | YES  | Usuario que lo creó |
| updated_by           | uuid       | YES  | Usuario que lo modificó |

---

## 🧂 `modifiers`
**Agrupaciones de opciones adicionales para personalizar platos** (p. ej. "Elige tu salsa").

| Columna       | Tipo       | Null | Descripción |
|---------------|------------|------|-------------|
| id            | uuid       | NO   | ID del grupo de modificadores |
| menu_item_id  | uuid       | YES  | ID del plato al que pertenece |
| name          | text       | NO   | Nombre del grupo (ej: "Nivel de picante") |
| description   | text       | YES  | Explicación opcional |
| required      | boolean    | YES  | Si el cliente debe seleccionar al menos uno |
| multi_select  | boolean    | YES  | Si se pueden elegir múltiples opciones |
| created_at    | timestamp  | YES  | Fecha de creación |
| updated_at    | timestamp  | YES  | Última modificación |
| created_by    | uuid       | YES  | Usuario que lo creó |
| updated_by    | uuid       | YES  | Usuario que lo modificó |

---

## 🧁 `modifier_options`
**Opciones concretas dentro de un modificador** (ej: "Salsa de mango", "Extra queso").

| Columna               | Tipo       | Null | Descripción |
|------------------------|------------|------|-------------|
| id                     | uuid       | NO   | ID de la opción |
| modifier_id            | uuid       | YES  | Relación con `modifiers` |
| name                   | text       | NO   | Nombre de la opción |
| extra_price            | numeric    | YES  | Precio adicional si aplica |
| is_default             | boolean    | YES  | Si está seleccionada por defecto |
| related_menu_item_id   | uuid       | YES  | Referencia a otro plato (si la opción es un extra compuesto) |
| icon_url               | text       | YES  | Icono para representar visualmente la opción |
| created_at             | timestamp  | YES  | Creación |
| updated_at             | timestamp  | YES  | Modificación |
| created_by             | uuid       | YES  | Creador |
| updated_by             | uuid       | YES  | Última edición |

---

## 🌿 `allergens` y `diet_tags`
Listados de alérgenos y etiquetas dietéticas.

### `allergens`
| Columna     | Tipo    | Null | Descripción |
|-------------|---------|------|-------------|
| id          | uuid    | NO   | ID del alérgeno |
| name        | text    | NO   | Nombre (gluten, frutos secos...) |
| icon_url    | text    | YES  | Icono representativo |
| created_at  | timestamp | YES | Fecha de creación |

### `diet_tags`
| Columna     | Tipo    | Null | Descripción |
|-------------|---------|------|-------------|
| id          | uuid    | NO   | ID de la etiqueta dietética |
| name        | text    | NO   | Ej: vegano, sin lactosa... |
| created_at  | timestamp | YES | Creación |

---

## 📦 `temporary_orders` y `temporary_order_items`
Pedidos en curso durante la experiencia del comensal. Se eliminan tras cierto tiempo de inactividad.

### `temporary_orders`
| Columna     | Tipo       | Null | Descripción |
|-------------|------------|------|-------------|
| id          | uuid       | NO   | ID del pedido temporal |
| alias       | text       | NO   | Nombre/avatar del comensal |
| table_code  | text       | NO   | Código de mesa |
| slot_id     | uuid       | YES  | Turno o franja horaria |
| confirmed   | boolean    | YES  | Si se ha confirmado el pedido |
| created_at  | timestamp  | YES  | Creación |

### `temporary_order_items`
| Columna          | Tipo     | Null | Descripción |
|------------------|----------|------|-------------|
| id               | uuid     | NO   | ID del ítem temporal |
| temporary_order_id | uuid   | NO   | Pedido al que pertenece |
| menu_item_id     | uuid     | NO   | Plato elegido |
| quantity         | integer  | NO   | Cantidad |
| price            | numeric  | NO   | Precio total por unidad (con extras) |
| modifiers_data   | jsonb    | NO   | Detalle de modificadores seleccionados |
| menu_item_name   | text     | YES  | Nombre del plato |
| alias            | text     | NO   | Alias de quien pidió |

---

## 🧾 `orders` y `order_items`
Representan los pedidos confirmados, ya enviados a cocina.

### `orders`
| Columna      | Tipo     | Null | Descripción |
|--------------|----------|------|-------------|
| id           | uuid     | NO   | ID del pedido final |
| created_at   | timestamp| YES  | Fecha de creación |
| slot_id      | uuid     | YES  | Slot asociado |
| total_price  | numeric  | YES  | Total del pedido |
| confirmed_at | timestamp| YES  | Momento de confirmación |
| table_code   | text     | NO   | Código de mesa |
| alias        | text     | NO   | Alias del comensal principal |
| notes        | text     | YES  | Notas especiales del cliente |

### `order_items`
| Columna      | Tipo     | Null | Descripción |
|--------------|----------|------|-------------|
| id           | uuid     | NO   | ID del ítem |
| order_id     | uuid     | NO   | Pedido al que pertenece |
| menu_item_id | uuid     | NO   | Plato pedido |
| quantity     | integer  | NO   | Cantidad |
| modifiers    | jsonb    | YES  | Detalle de modificadores |
| price        | numeric  | NO   | Precio total |
| alias        | text     | NO   | Quién pidió ese ítem |
| menu_item_name | text   | YES  | Nombre del plato |

---

## ⏰ `slots`, `slot_categories`, `slot_menu_items`
Definen franjas horarias (slots) y qué categorías/platos se sirven en cada una.

### `slots`
| Columna     | Tipo    | Null | Descripción |
|-------------|---------|------|-------------|
| id          | uuid    | NO   | ID del slot |
| name        | text    | NO   | Nombre del turno (Ej: "Desayuno") |
| description | text    | YES  | Descripción opcional |
| start_time  | time    | NO   | Hora inicio |
| end_time    | time    | NO   | Hora fin |
| created_at  | timestamp | YES | Fecha de creación |

### `slot_categories` y `slot_menu_items`
| slot_categories: Relación entre slot y categoría de platos |
| slot_menu_items: Relación entre slot y platos concretos |

---

## 🧑‍🍳 `categories`
Clasificación de platos (ej: entrantes, postres, bebidas).

| Columna           | Tipo    | Null | Descripción |
|-------------------|---------|------|-------------|
| id                | uuid    | NO   | ID de categoría |
| name              | text    | NO   | Nombre |
| sort_order        | integer | YES  | Orden en pantalla |
| is_complementary  | boolean | YES  | Si son platos extra no seleccionables |
| image_url         | text    | YES  | Imagen ilustrativa |
| created_at        | timestamp | YES | Fecha de creación |

---

## 👥 `table_codes` y `customer_aliases`
Gestión de mesas y alias temporales.

### `table_codes`
| Columna       | Tipo    | Null | Descripción |
|---------------|---------|------|-------------|
| id            | uuid    | NO   | ID del código |
| table_number  | integer | NO   | Número de mesa visible |
| created_at    | timestamp | YES | Creación |

### `customer_aliases`
| Columna    | Tipo | Null | Descripción |
|------------|------|------|-------------|
| device_id  | uuid | NO   | Identificador único del dispositivo |
| alias      | text | NO   | Alias mostrado en el pedido |
| created_at | timestamp | YES | Fecha de creación |

---

## 🔁 Tablas relacionales adicionales

### `menu_item_allergens`, `menu_item_diet_tags`, `modifier_options_allergens`
Relaciones entre platos/modificadores y sus etiquetas dietéticas o alérgenos.

### `related_items`
Permite sugerir otros platos vinculados a uno principal (ej: sugerencia de guarnición u opción premium).

---

Esta base de datos es el núcleo del sistema **GOURMETON**, optimizado para una experiencia gastronómica digital, modular y colaborativa 🍷✨.
