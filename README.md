# The Dish Dash - Documentación de la Base de Datos

Esta documentación detalla la estructura de las tablas, sus campos y las relaciones entre ellas en la base de datos de la aplicación The Dish Dash.

---

## Tabla: `allergens`

**Propósito:** Almacena información sobre los alérgenos que pueden contener los productos del menú.

| Nombre Columna | Tipo de Dato                  | ¿Nulable? | Valor por Defecto   | UDT Name    | Descripción                                    |
| :------------- | :---------------------------- | :-------- | :------------------ | :---------- | :--------------------------------------------- |
| `id`           | `uuid`                        | NO        | `gen_random_uuid()` | `uuid`      | Identificador único para el alérgeno.          |
| `name`         | `text`                        | NO        | `null`              | `text`      | Nombre del alérgeno (ej. "Gluten", "Lactosa"). |
| `created_at`   | `timestamp without time zone` | SÍ        | `now()`             | `timestamp` | Fecha y hora de creación del registro.         |
| `updated_at`   | `timestamp without time zone` | SÍ        | `now()`             | `timestamp` | Fecha y hora de la última actualización.       |
| `icon_url`     | `text`                        | SÍ        | `null`              | `text`      | URL del icono representativo del alérgeno.     |
| `description`  | `text`                        | SÍ        | `null`              | `text`      | Descripción adicional sobre el alérgeno.       |

**Relaciones:**

- **Referenciada por:**
  - `menu_item_allergens.allergen_id` referencia a `allergens.id`
  - `modifier_options_allergens.allergen_id` referencia a `allergens.id`

---

## Tabla: `categories`

**Propósito:** Define las categorías en las que se agrupan los ítems del menú (ej. "Entrantes", "Platos Principales", "Bebidas").

| Nombre Columna     | Tipo de Dato                  | ¿Nulable? | Valor por Defecto   | UDT Name    | Descripción                                            |
| :----------------- | :---------------------------- | :-------- | :------------------ | :---------- | :----------------------------------------------------- |
| `id`               | `uuid`                        | NO        | `gen_random_uuid()` | `uuid`      | Identificador único para la categoría.                 |
| `name`             | `text`                        | NO        | `null`              | `text`      | Nombre de la categoría.                                |
| `sort_order`       | `integer`                     | SÍ        | `0`                 | `int4`      | Orden de aparición de la categoría en el menú.         |
| `created_at`       | `timestamp without time zone` | SÍ        | `now()`             | `timestamp` | Fecha y hora de creación del registro.                 |
| `updated_at`       | `timestamp without time zone` | SÍ        | `now()`             | `timestamp` | Fecha y hora de la última actualización.               |
| `created_by`       | `uuid`                        | SÍ        | `null`              | `uuid`      | ID del usuario que creó la categoría (si aplica).      |
| `updated_by`       | `uuid`                        | SÍ        | `null`              | `uuid`      | ID del usuario que actualizó la categoría (si aplica). |
| `is_complementary` | `boolean`                     | SÍ        | `false`             | `bool`      | Indica si la categoría es de ítems complementarios.    |
| `image_url`        | `text`                        | SÍ        | `null`              | `text`      | URL de una imagen representativa de la categoría.      |

**Relaciones:**

- **Referenciada por:**
  - `slot_categories.category_id` referencia a `categories.id`
- **Notas:** El campo `category_ids` en `menu_items` (tipo `ARRAY` de `uuid`) probablemente referencia a `categories.id`.

---

## Tabla: `customer_aliases`

**Propósito:** Asocia un identificador de dispositivo (`device_id`) con un alias de cliente, permitiendo identificar a un mismo cliente a través de diferentes dispositivos o sesiones anónimas.

| Nombre Columna | Tipo de Dato                  | ¿Nulable? | Valor por Defecto | UDT Name    | Descripción                                          |
| :------------- | :---------------------------- | :-------- | :---------------- | :---------- | :--------------------------------------------------- |
| `device_id`    | `uuid`                        | NO        | `null`            | `uuid`      | Identificador único del dispositivo del cliente.     |
| `alias`        | `text`                        | NO        | `null`            | `text`      | Alias asignado al cliente (podría ser autogenerado). |
| `created_at`   | `timestamp without time zone` | SÍ        | `now()`           | `timestamp` | Fecha y hora de creación de la asociación.           |

**Relaciones:**

- **Notas:** Ninguna clave foránea explícita definida en la información proporcionada, pero `alias` podría ser usado para identificar al cliente en otras tablas como `orders` y `sessions`.

---

## Tabla: `diet_tags`

**Propósito:** Almacena etiquetas dietéticas para los ítems del menú (ej. "Vegetariano", "Vegano", "Sin Gluten").

| Nombre Columna | Tipo de Dato                  | ¿Nulable? | Valor por Defecto   | UDT Name    | Descripción                                     |
| :------------- | :---------------------------- | :-------- | :------------------ | :---------- | :---------------------------------------------- |
| `id`           | `uuid`                        | NO        | `gen_random_uuid()` | `uuid`      | Identificador único para la etiqueta dietética. |
| `name`         | `text`                        | NO        | `null`              | `text`      | Nombre de la etiqueta dietética.                |
| `created_at`   | `timestamp without time zone` | SÍ        | `now()`             | `timestamp` | Fecha y hora de creación del registro.          |
| `updated_at`   | `timestamp without time zone` | SÍ        | `now()`             | `timestamp` | Fecha y hora de la última actualización.        |
| `description`  | `text`                        | SÍ        | `null`              | `text`      | Descripción adicional de la etiqueta.           |

**Relaciones:**

- **Referenciada por:**
  - `menu_item_diet_tags.diet_tag_id` referencia a `diet_tags.id`
  - `modifier_option_diet_tags.diet_tag_id` referencia a `diet_tags.id`

---

## Tabla: `gpt_daily_prompts`

**Propósito:** Almacena prompts enviados a un modelo GPT y sus respuestas, organizados por día. Podría usarse para generar contenido diario, sugerencias, etc. para The Dish Dash.

| Nombre Columna | Tipo de Dato                  | ¿Nulable? | Valor por Defecto   | UDT Name    | Descripción                                |
| :------------- | :---------------------------- | :-------- | :------------------ | :---------- | :----------------------------------------- |
| `id`           | `uuid`                        | NO        | `gen_random_uuid()` | `uuid`      | Identificador único del prompt diario.     |
| `date`         | `date`                        | NO        | `null`              | `date`      | Fecha a la que corresponde el prompt.      |
| `prompt`       | `text`                        | NO        | `null`              | `text`      | El texto del prompt enviado al modelo GPT. |
| `response`     | `text`                        | SÍ        | `null`              | `text`      | La respuesta recibida del modelo GPT.      |
| `created_at`   | `timestamp without time zone` | SÍ        | `now()`             | `timestamp` | Fecha y hora de creación del registro.     |

**Relaciones:**

- **Notas:** Ninguna clave foránea explícita definida.

---

## Tabla: `menu_item_allergens` (Tabla de Unión)

**Propósito:** Relaciona los ítems del menú con los alérgenos que contienen. Es una tabla de muchos a muchos entre `menu_items` y `allergens`.

| Nombre Columna | Tipo de Dato                  | ¿Nulable? | Valor por Defecto | UDT Name    | Descripción                                      |
| :------------- | :---------------------------- | :-------- | :---------------- | :---------- | :----------------------------------------------- |
| `menu_item_id` | `uuid`                        | NO        | `null`            | `uuid`      | ID del ítem del menú.                            |
| `allergen_id`  | `uuid`                        | NO        | `null`            | `uuid`      | ID del alérgeno.                                 |
| `created_at`   | `timestamp without time zone` | SÍ        | `now()`           | `timestamp` | Fecha y hora de creación de la relación.         |
| `created_by`   | `uuid`                        | SÍ        | `null`            | `uuid`      | ID del usuario que creó la relación (si aplica). |

**Relaciones:**

- **Claves Foráneas Definidas:**
  - `menu_item_allergens.allergen_id` referencia a `allergens(id)`
  - `menu_item_allergens.menu_item_id` referencia a `menu_items(id)`

---

## Tabla: `menu_item_diet_tags` (Tabla de Unión)

**Propósito:** Relaciona los ítems del menú con sus etiquetas dietéticas. Es una tabla de muchos a muchos entre `menu_items` y `diet_tags`.

| Nombre Columna | Tipo de Dato                  | ¿Nulable? | Valor por Defecto | UDT Name    | Descripción                                      |
| :------------- | :---------------------------- | :-------- | :---------------- | :---------- | :----------------------------------------------- |
| `menu_item_id` | `uuid`                        | NO        | `null`            | `uuid`      | ID del ítem del menú.                            |
| `diet_tag_id`  | `uuid`                        | NO        | `null`            | `uuid`      | ID de la etiqueta dietética.                     |
| `created_at`   | `timestamp without time zone` | SÍ        | `now()`           | `timestamp` | Fecha y hora de creación de la relación.         |
| `created_by`   | `uuid`                        | SÍ        | `null`            | `uuid`      | ID del usuario que creó la relación (si aplica). |

**Relaciones:**

- **Claves Foráneas Definidas:**
  - `menu_item_diet_tags.diet_tag_id` referencia a `diet_tags(id)`
  - `menu_item_diet_tags.menu_item_id` referencia a `menu_items(id)`

---

## Tabla: `menu_item_embeddings`

**Propósito:** Almacena embeddings vectoriales para los ítems del menú. Estos se usan para búsquedas semánticas, recomendaciones basadas en similitud, etc., dentro de The Dish Dash.

| Nombre Columna | Tipo de Dato   | ¿Nulable? | Valor por Defecto | UDT Name | Descripción                                                         |
| :------------- | :------------- | :-------- | :---------------- | :------- | :------------------------------------------------------------------ |
| `item_id`      | `uuid`         | NO        | `null`            | `uuid`   | ID del ítem del menú al que pertenece el embedding.                 |
| `embedding`    | `USER-DEFINED` | NO        | `null`            | `vector` | El vector de embedding.                                             |
| `text`         | `text`         | SÍ        | `null`            | `text`   | Texto original a partir del cual se generó el embedding (opcional). |

**Relaciones:**

- **Claves Foráneas Definidas:**
  - `menu_item_embeddings.item_id` referencia a `menu_items(id)`

---

## Tabla: `menu_items`

**Propósito:** Tabla central que almacena todos los ítems ofrecidos en el menú (platos, bebidas, etc.) de The Dish Dash.

| Nombre Columna          | Tipo de Dato                  | ¿Nulable? | Valor por Defecto   | UDT Name    | Descripción                                                     |
| :---------------------- | :---------------------------- | :-------- | :------------------ | :---------- | :-------------------------------------------------------------- |
| `id`                    | `uuid`                        | NO        | `gen_random_uuid()` | `uuid`      | Identificador único del ítem del menú.                          |
| `name`                  | `text`                        | NO        | `null`              | `text`      | Nombre del ítem del menú.                                       |
| `description`           | `text`                        | SÍ        | `null`              | `text`      | Descripción detallada del ítem.                                 |
| `price`                 | `numeric`                     | NO        | `null`              | `numeric`   | Precio del ítem.                                                |
| `image_url`             | `text`                        | SÍ        | `null`              | `text`      | URL de la imagen del ítem.                                      |
| `food_info`             | `text`                        | SÍ        | `null`              | `text`      | Información nutricional o adicional sobre el alimento.          |
| `origin`                | `text`                        | SÍ        | `null`              | `text`      | Origen de los ingredientes o del plato.                         |
| `pairing_suggestion`    | `text`                        | SÍ        | `null`              | `text`      | Sugerencias de maridaje (ej. con vinos, otras comidas).         |
| `chef_notes`            | `text`                        | SÍ        | `null`              | `text`      | Notas del chef sobre el plato.                                  |
| `is_recommended`        | `boolean`                     | SÍ        | `false`             | `bool`      | Indica si el ítem es recomendado.                               |
| `created_at`            | `timestamp without time zone` | SÍ        | `now()`             | `timestamp` | Fecha y hora de creación del registro.                          |
| `updated_at`            | `timestamp without time zone` | SÍ        | `now()`             | `timestamp` | Fecha y hora de la última actualización.                        |
| `is_available`          | `boolean`                     | SÍ        | `true`              | `bool`      | Indica si el ítem está disponible actualmente.                  |
| `profit_margin`         | `numeric`                     | SÍ        | `null`              | `numeric`   | Margen de beneficio del ítem (para uso interno).                |
| `category_ids`          | `ARRAY`                       | SÍ        | `null`              | `_uuid`     | Array de IDs de categorías a las que pertenece el ítem.         |
| `item_type`             | `text`                        | NO        | `'Comida'::text`    | `text`      | Tipo de ítem (ej. "Comida", "Bebida").                          |
| `keywords`              | `ARRAY`                       | SÍ        | `null`              | `_text`     | Palabras clave asociadas para búsqueda.                         |
| `calories_est_min`      | `integer`                     | SÍ        | `null`              | `int4`      | Estimación mínima de calorías.                                  |
| `calories_est_max`      | `integer`                     | SÍ        | `null`              | `int4`      | Estimación máxima de calorías.                                  |
| `is_alcoholic`          | `boolean`                     | SÍ        | `null`              | `bool`      | Indica si la bebida es alcohólica (si `item_type` es "Bebida"). |
| `drink_type`            | `text`                        | SÍ        | `null`              | `text`      | Tipo de bebida (ej. "Vino", "Cerveza", "Refresco").             |
| `drink_subtype`         | `text`                        | SÍ        | `null`              | `text`      | Subtipo de bebida (ej. "Tinto", "Lager", "Cola").               |
| `drink_characteristics` | `ARRAY`                       | SÍ        | `null`              | `_text`     | Características de la bebida (ej. "Seco", "Afrutado").          |
| `drink_volume_ml`       | `integer`                     | SÍ        | `null`              | `int4`      | Volumen de la bebida en mililitros.                             |
| `drink_abv`             | `numeric`                     | SÍ        | `null`              | `numeric`   | Grado alcohólico por volumen (ABV) de la bebida.                |
| `drink_brand`           | `text`                        | SÍ        | `null`              | `text`      | Marca de la bebida.                                             |
| `wine_varietal`         | `ARRAY`                       | SÍ        | `null`              | `_text`     | Varietal(es) del vino (ej. "Cabernet Sauvignon", "Chardonnay"). |
| `wine_region`           | `text`                        | SÍ        | `null`              | `text`      | Región de origen del vino.                                      |
| `is_new_item`           | `boolean`                     | SÍ        | `false`             | `bool`      | Indica si es un ítem nuevo en el menú.                          |
| `is_seasonal`           | `boolean`                     | SÍ        | `false`             | `bool`      | Indica si el ítem es de temporada.                              |
| `is_vegetarian_base`    | `boolean`                     | SÍ        | `null`              | `bool`      | Indica si la base del plato es vegetariana.                     |
| `is_vegan_base`         | `boolean`                     | SÍ        | `null`              | `bool`      | Indica si la base del plato es vegana.                          |
| `is_gluten_free_base`   | `boolean`                     | SÍ        | `null`              | `bool`      | Indica si la base del plato es sin gluten.                      |

**Relaciones:**

- **Referenciada por:**
  - `menu_item_allergens.menu_item_id` referencia a `menu_items.id`
  - `menu_item_diet_tags.menu_item_id` referencia a `menu_items.id`
  - `menu_item_embeddings.item_id` referencia a `menu_items.id`
  - `modifiers.menu_item_id` referencia a `menu_items.id`
  - `modifier_options.related_menu_item_id` referencia a `menu_items.id`
  - `related_items.menu_item_id` referencia a `menu_items.id`
  - `related_items.related_menu_item_id` referencia a `menu_items.id`
  - `slot_menu_items.menu_item_id` referencia a `menu_items.id`
  - `order_items.menu_item_id` referencia a `menu_items.id`
  - `temporary_order_items.menu_item_id` referencia a `menu_items.id`
- **Notas:** `category_ids` es un array de UUIDs que probablemente referencian `categories.id`.

---

## Tabla: `message_embeddings`

**Propósito:** Almacena embeddings vectoriales para los mensajes. Similar a `menu_item_embeddings`, pero para el contenido de los mensajes, probablemente para análisis semántico o búsqueda en conversaciones dentro de The Dish Dash.

| Nombre Columna | Tipo de Dato   | ¿Nulable? | Valor por Defecto | UDT Name | Descripción                                   |
| :------------- | :------------- | :-------- | :---------------- | :------- | :-------------------------------------------- |
| `message_id`   | `uuid`         | NO        | `null`            | `uuid`   | ID del mensaje al que pertenece el embedding. |
| `embedding`    | `USER-DEFINED` | SÍ        | `null`            | `vector` | El vector de embedding del mensaje.           |

**Relaciones:**

- **Claves Foráneas Definidas:**
  - `message_embeddings.message_id` referencia a `messages(id)`

---

## Tabla: `messages`

**Propósito:** Almacena los mensajes intercambiados, posiblemente en un sistema de chat (cliente-IA, cliente-staff) de The Dish Dash.

| Nombre Columna | Tipo de Dato               | ¿Nulable? | Valor por Defecto   | UDT Name      | Descripción                                         |
| :------------- | :------------------------- | :-------- | :------------------ | :------------ | :-------------------------------------------------- |
| `id`           | `uuid`                     | NO        | `gen_random_uuid()` | `uuid`        | Identificador único del mensaje.                    |
| `session_id`   | `uuid`                     | NO        | `null`              | `uuid`        | ID de la sesión a la que pertenece el mensaje.      |
| `sender`       | `text`                     | NO        | `null`              | `text`        | Quién envió el mensaje (ej. "user", "ai", "staff"). |
| `content`      | `text`                     | NO        | `null`              | `text`        | Contenido del mensaje.                              |
| `created_at`   | `timestamp with time zone` | SÍ        | `now()`             | `timestamptz` | Fecha y hora de creación del mensaje.               |

**Relaciones:**

- **Claves Foráneas Definidas:**
  - `messages.session_id` referencia a `sessions(id)`
- **Referenciada por:**
  - `message_embeddings.message_id` referencia a `messages.id`

---

## Tabla: `modifier_option_diet_tags` (Tabla de Unión)

**Propósito:** Relaciona las opciones de modificadores con sus etiquetas dietéticas. Es una tabla de muchos a muchos entre `modifier_options` y `diet_tags`.

| Nombre Columna       | Tipo de Dato                  | ¿Nulable? | Valor por Defecto | UDT Name    | Descripción                              |
| :------------------- | :---------------------------- | :-------- | :---------------- | :---------- | :--------------------------------------- |
| `modifier_option_id` | `uuid`                        | NO        | `null`            | `uuid`      | ID de la opción de modificador.          |
| `diet_tag_id`        | `uuid`                        | NO        | `null`            | `uuid`      | ID de la etiqueta dietética.             |
| `created_at`         | `timestamp without time zone` | SÍ        | `now()`           | `timestamp` | Fecha y hora de creación de la relación. |

**Relaciones:**

- **Claves Foráneas Definidas:**
  - `modifier_option_diet_tags.diet_tag_id` referencia a `diet_tags(id)`
  - `modifier_option_diet_tags.modifier_option_id` referencia a `modifier_options(id)`

---

## Tabla: `modifier_options`

**Propósito:** Almacena las opciones individuales para un modificador de ítem de menú (ej. para un modificador "Tamaño", las opciones serían "Pequeño", "Mediano", "Grande").

| Nombre Columna         | Tipo de Dato                  | ¿Nulable? | Valor por Defecto   | UDT Name    | Descripción                                                         |
| :--------------------- | :---------------------------- | :-------- | :------------------ | :---------- | :------------------------------------------------------------------ |
| `id`                   | `uuid`                        | NO        | `gen_random_uuid()` | `uuid`      | Identificador único de la opción de modificador.                    |
| `modifier_id`          | `uuid`                        | SÍ        | `null`              | `uuid`      | ID del modificador al que pertenece esta opción.                    |
| `name`                 | `text`                        | NO        | `null`              | `text`      | Nombre de la opción (ej. "Extra Queso").                            |
| `extra_price`          | `numeric`                     | SÍ        | `0.00`              | `numeric`   | Precio adicional si se selecciona esta opción.                      |
| `is_default`           | `boolean`                     | SÍ        | `false`             | `bool`      | Indica si esta opción está seleccionada por defecto.                |
| `created_at`           | `timestamp without time zone` | SÍ        | `now()`             | `timestamp` | Fecha y hora de creación del registro.                              |
| `updated_at`           | `timestamp without time zone` | SÍ        | `now()`             | `timestamp` | Fecha y hora de la última actualización.                            |
| `created_by`           | `uuid`                        | SÍ        | `null`              | `uuid`      | ID del usuario que creó la opción (si aplica).                      |
| `updated_by`           | `uuid`                        | SÍ        | `null`              | `uuid`      | ID del usuario que actualizó la opción (si aplica).                 |
| `icon_url`             | `text`                        | SÍ        | `null`              | `text`      | URL de un icono para la opción.                                     |
| `related_menu_item_id` | `uuid`                        | SÍ        | `null`              | `uuid`      | Si esta opción añade/modifica con otro ítem de menú, su ID va aquí. |

**Relaciones:**

- **Claves Foráneas Definidas:**
  - `modifier_options.modifier_id` referencia a `modifiers(id)`
  - `modifier_options.related_menu_item_id` referencia a `menu_items(id)`
- **Referenciada por:**
  - `modifier_options_allergens.modifier_option_id` referencia a `modifier_options.id`
  - `modifier_option_diet_tags.modifier_option_id` referencia a `modifier_options.id`

---

## Tabla: `modifier_options_allergens` (Tabla de Unión)

**Propósito:** Relaciona las opciones de modificadores con los alérgenos que contienen o introducen. Es una tabla de muchos a muchos entre `modifier_options` y `allergens`.

| Nombre Columna       | Tipo de Dato                  | ¿Nulable? | Valor por Defecto | UDT Name    | Descripción                                      |
| :------------------- | :---------------------------- | :-------- | :---------------- | :---------- | :----------------------------------------------- |
| `modifier_option_id` | `uuid`                        | NO        | `null`            | `uuid`      | ID de la opción de modificador.                  |
| `allergen_id`        | `uuid`                        | NO        | `null`            | `uuid`      | ID del alérgeno.                                 |
| `created_at`         | `timestamp without time zone` | SÍ        | `now()`           | `timestamp` | Fecha y hora de creación de la relación.         |
| `created_by`         | `uuid`                        | SÍ        | `null`            | `uuid`      | ID del usuario que creó la relación (si aplica). |

**Relaciones:**

- **Claves Foráneas Definidas:**
  - `modifier_options_allergens.allergen_id` referencia a `allergens(id)`
  - `modifier_options_allergens.modifier_option_id` referencia a `modifier_options(id)`

---

## Tabla: `modifiers`

**Propósito:** Define grupos de modificaciones que se pueden aplicar a un ítem del menú (ej. "Tamaño", "Aderezos", "Punto de cocción").

| Nombre Columna | Tipo de Dato                  | ¿Nulable? | Valor por Defecto   | UDT Name    | Descripción                                                          |
| :------------- | :---------------------------- | :-------- | :------------------ | :---------- | :------------------------------------------------------------------- |
| `id`           | `uuid`                        | NO        | `gen_random_uuid()` | `uuid`      | Identificador único del modificador.                                 |
| `name`         | `text`                        | NO        | `null`              | `text`      | Nombre del grupo de modificadores (ej. "Elige tu salsa").            |
| `menu_item_id` | `uuid`                        | SÍ        | `null`              | `uuid`      | ID del ítem del menú al que se aplica este modificador.              |
| `required`     | `boolean`                     | SÍ        | `false`             | `bool`      | Indica si es obligatorio seleccionar una opción de este modificador. |
| `created_at`   | `timestamp without time zone` | SÍ        | `now()`             | `timestamp` | Fecha y hora de creación del registro.                               |
| `updated_at`   | `timestamp without time zone` | SÍ        | `now()`             | `timestamp` | Fecha y hora de la última actualización.                             |
| `created_by`   | `uuid`                        | SÍ        | `null`              | `uuid`      | ID del usuario que creó el modificador (si aplica).                  |
| `updated_by`   | `uuid`                        | SÍ        | `null`              | `uuid`      | ID del usuario que actualizó el modificador (si aplica).             |
| `description`  | `text`                        | SÍ        | `null`              | `text`      | Descripción adicional del modificador.                               |
| `multi_select` | `boolean`                     | SÍ        | `false`             | `bool`      | Indica si se pueden seleccionar múltiples opciones.                  |

**Relaciones:**

- **Claves Foráneas Definidas:**
  - `modifiers.menu_item_id` referencia a `menu_items(id)`
- **Referenciada por:**
  - `modifier_options.modifier_id` referencia a `modifiers.id`

---

## Tabla: `order_items`

**Propósito:** Almacena los detalles de cada ítem individual dentro de una orden de The Dish Dash.

| Nombre Columna   | Tipo de Dato | ¿Nulable? | Valor por Defecto   | UDT Name  | Descripción                                                                        |
| :--------------- | :----------- | :-------- | :------------------ | :-------- | :--------------------------------------------------------------------------------- |
| `id`             | `uuid`       | NO        | `gen_random_uuid()` | `uuid`    | Identificador único del ítem de la orden.                                          |
| `order_id`       | `uuid`       | NO        | `null`              | `uuid`    | ID de la orden a la que pertenece este ítem.                                       |
| `menu_item_id`   | `uuid`       | NO        | `null`              | `uuid`    | ID del ítem del menú ordenado.                                                     |
| `quantity`       | `integer`    | NO        | `null`              | `int4`    | Cantidad ordenada de este ítem.                                                    |
| `alias`          | `text`       | NO        | `null`              | `text`    | Alias del cliente que ordenó este ítem específico (para órdenes compartidas).      |
| `modifiers`      | `jsonb`      | SÍ        | `null`              | `jsonb`   | JSON que almacena las opciones de modificadores seleccionadas para este ítem.      |
| `price`          | `numeric`    | NO        | `null`              | `numeric` | Precio del ítem en el momento de la orden (considerando cantidad y modificadores). |
| `menu_item_name` | `text`       | SÍ        | `null`              | `text`    | Nombre del ítem del menú (redundante, pero útil para históricos o logs).           |

**Relaciones:**

- **Claves Foráneas Definidas:**
  - `order_items.menu_item_id` referencia a `menu_items(id)`
  - `order_items.order_id` referencia a `orders(id)`

---

## Tabla: `orders`

**Propósito:** Representa una orden realizada por un cliente en The Dish Dash.

| Nombre Columna | Tipo de Dato               | ¿Nulable? | Valor por Defecto   | UDT Name      | Descripción                                                           |
| :------------- | :------------------------- | :-------- | :------------------ | :------------ | :-------------------------------------------------------------------- |
| `id`           | `uuid`                     | NO        | `gen_random_uuid()` | `uuid`        | Identificador único de la orden.                                      |
| `table_code`   | `text`                     | NO        | `null`              | `text`        | Código de la mesa donde se realizó la orden.                          |
| `alias`        | `text`                     | NO        | `null`              | `text`        | Alias principal del cliente o grupo que realizó la orden.             |
| `created_at`   | `timestamp with time zone` | SÍ        | `now()`             | `timestamptz` | Fecha y hora de creación de la orden (cuando se empieza).             |
| `slot_id`      | `uuid`                     | SÍ        | `null`              | `uuid`        | ID del slot (franja horaria) en el que se realizó la orden.           |
| `total_price`  | `numeric`                  | SÍ        | `null`              | `numeric`     | Precio total de la orden.                                             |
| `notes`        | `text`                     | SÍ        | `null`              | `text`        | Notas adicionales para la orden (ej. alergias generales, peticiones). |
| `confirmed_at` | `timestamp with time zone` | SÍ        | `now()`             | `timestamptz` | Fecha y hora en que la orden fue confirmada y enviada.                |

**Relaciones:**

- **Claves Foráneas Definidas:**
  - `orders.slot_id` referencia a `slots(id)`
- **Referenciada por:**
  - `order_items.order_id` referencia a `orders.id`
- **Notas:** `table_code` podría referenciar a `table_codes.table_number` o un campo similar. `alias` podría relacionarse con `customer_aliases.alias`.

---

## Tabla: `related_items`

**Propósito:** Define relaciones entre ítems del menú, como sugerencias de acompañamiento, upsells, o ítems que suelen pedirse juntos.

| Nombre Columna         | Tipo de Dato                  | ¿Nulable? | Valor por Defecto   | UDT Name    | Descripción                                                         |
| :--------------------- | :---------------------------- | :-------- | :------------------ | :---------- | :------------------------------------------------------------------ |
| `id`                   | `uuid`                        | NO        | `gen_random_uuid()` | `uuid`      | Identificador único de la relación.                                 |
| `menu_item_id`         | `uuid`                        | SÍ        | `null`              | `uuid`      | ID del ítem de menú principal.                                      |
| `related_menu_item_id` | `uuid`                        | SÍ        | `null`              | `uuid`      | ID del ítem de menú relacionado.                                    |
| `extra_price`          | `numeric`                     | SÍ        | `null`              | `numeric`   | Costo adicional si se añade este ítem relacionado (ej. como combo). |
| `optional`             | `boolean`                     | SÍ        | `true`              | `bool`      | Indica si la adición del ítem relacionado es opcional.              |
| `created_at`           | `timestamp without time zone` | SÍ        | `now()`             | `timestamp` | Fecha y hora de creación del registro.                              |
| `updated_at`           | `timestamp without time zone` | SÍ        | `now()`             | `timestamp` | Fecha y hora de la última actualización.                            |
| `created_by`           | `uuid`                        | SÍ        | `null`              | `uuid`      | ID del usuario que creó la relación (si aplica).                    |
| `updated_by`           | `uuid`                        | SÍ        | `null`              | `uuid`      | ID del usuario que actualizó la relación (si aplica).               |

**Relaciones:**

- **Claves Foráneas Definidas:**
  - `related_items.menu_item_id` referencia a `menu_items(id)`
  - `related_items.related_menu_item_id` referencia a `menu_items(id)`

---

## Tabla: `sessions`

**Propósito:** Gestiona las sesiones de interacción de los usuarios/clientes con el sistema de The Dish Dash, específicamente para el chat con el asistente de IA o el menú digital. Cada sesión representa una conversación única de un cliente en una mesa determinada.

| Nombre Columna   | Tipo de Dato               | ¿Nulable? | Valor por Defecto   | UDT Name      | Descripción                                                                                        |
| :--------------- | :------------------------- | :-------- | :------------------ | :------------ | :------------------------------------------------------------------------------------------------- |
| `id`             | `uuid`                     | NO        | `gen_random_uuid()` | `uuid`        | Identificador único de la sesión de chat. Es la clave primaria.                                    |
| `table_number`   | `integer`                  | NO        |                     | `int4`        | Número de la mesa física donde se está llevando a cabo la sesión de chat.                          |
| `alias`          | `text`                     | NO        |                     | `text`        | Alias textual del cliente/usuario que está participando en esta sesión de chat (ej. "ser", "ana"). |
| `started_at`     | `timestamp with time zone` | SÍ        | `now()`             | `timestamptz` | Fecha y hora de inicio de la sesión.                                                               |
| `updated_at`     | `timestamp with time zone` | SÍ        | `now()`             | `timestamptz` | Fecha y hora de la última actualización del registro de sesión (ej. por un nuevo mensaje).         |
| `system_context` | `text`                     | SÍ        | `null`              | `text`        | Contexto del sistema para la IA (ej. "Eres un camarero virtual de The Dish Dash...").              |
| `menu_items`     | `jsonb`                    | SÍ        | `null`              | `jsonb`       | Estado actual de los ítems seleccionados o en carrito para esta sesión de chat (no confirmado).    |
| `time_of_day`    | `text`                     | SÍ        | `null`              | `text`        | Parte del día (ej. "Mañana", "Tarde", "Noche") para contextualizar la interacción.                 |

**Relaciones:**

- **Referenciada por:**
  - `messages.session_id` referencia a `sessions.id` (Indica a qué sesión de chat pertenece cada mensaje).
- **Notas:**
  - `table_number` podría tener una relación conceptual o una clave foránea (no definida aquí) con una tabla `table_codes(table_number)` si existiera una tabla maestra de mesas.
  - `alias` identifica al usuario en esta sesión. Podría relacionarse con `customer_aliases.alias` si se desea vincular estas sesiones de chat con un registro de cliente más persistente.
  - Se recomienda un trigger en `updated_at` para que se actualice automáticamente con cada modificación de la fila.

**Consideraciones de Unicidad (Importante para la lógica de la aplicación):**

- La clave primaria es `id`, lo que garantiza que cada registro de sesión es único.
- Para asegurar que un mismo cliente (`alias`) no tenga múltiples sesiones de chat activas y conflictivas en la misma mesa (`table_number`), la aplicación debe gestionar la creación o reutilización de sesiones.
- Si se desea forzar a nivel de base de datos que solo exista una sesión activa por combinación de `table_number` y `alias`, se podría añadir una restricción `UNIQUE (table_number, alias)`. Esto dependerá de si se permite que un mismo alias en la misma mesa pueda tener varias conversaciones paralelas o si siempre se debe reutilizar la última activa.

---

## Tabla: `slot_categories` (Tabla de Unión)

**Propósito:** Asocia categorías de menú a franjas horarias (`slots`). Permite que ciertas categorías solo estén disponibles en determinados momentos (ej. "Desayunos" solo en el slot de mañana).

| Nombre Columna | Tipo de Dato | ¿Nulable? | Valor por Defecto | UDT Name | Descripción                  |
| :------------- | :----------- | :-------- | :---------------- | :------- | :--------------------------- |
| `slot_id`      | `uuid`       | NO        | `null`            | `uuid`   | ID de la franja horaria.     |
| `category_id`  | `uuid`       | NO        | `null`            | `uuid`   | ID de la categoría del menú. |

**Relaciones:**

- **Claves Foráneas Definidas:**
  - `slot_categories.category_id` referencia a `categories(id)`
  - `slot_categories.slot_id` referencia a `slots(id)`

---

## Tabla: `slot_menu_items` (Tabla de Unión)

**Propósito:** Asocia ítems de menú específicos a franjas horarias (`slots`). Permite que ciertos ítems solo estén disponibles en determinados momentos.

| Nombre Columna | Tipo de Dato | ¿Nulable? | Valor por Defecto | UDT Name | Descripción              |
| :------------- | :----------- | :-------- | :---------------- | :------- | :----------------------- |
| `slot_id`      | `uuid`       | NO        | `null`            | `uuid`   | ID de la franja horaria. |
| `menu_item_id` | `uuid`       | NO        | `null`            | `uuid`   | ID del ítem del menú.    |

**Relaciones:**

- **Claves Foráneas Definidas:**
  - `slot_menu_items.menu_item_id` referencia a `menu_items(id)`
  - `slot_menu_items.slot_id` referencia a `slots(id)`

---

## Tabla: `slots`

**Propósito:** Define franjas horarias durante las cuales ciertos menús, categorías o ítems están disponibles (ej. "Desayuno", "Almuerzo", "Cena", "Happy Hour").

| Nombre Columna | Tipo de Dato                  | ¿Nulable? | Valor por Defecto   | UDT Name    | Descripción                                   |
| :------------- | :---------------------------- | :-------- | :------------------ | :---------- | :-------------------------------------------- |
| `id`           | `uuid`                        | NO        | `gen_random_uuid()` | `uuid`      | Identificador único de la franja horaria.     |
| `name`         | `text`                        | NO        | `null`              | `text`      | Nombre de la franja horaria (ej. "Almuerzo"). |
| `description`  | `text`                        | SÍ        | `null`              | `text`      | Descripción adicional de la franja horaria.   |
| `start_time`   | `time without time zone`      | NO        | `null`              | `time`      | Hora de inicio de la franja.                  |
| `end_time`     | `time without time zone`      | NO        | `null`              | `time`      | Hora de fin de la franja.                     |
| `created_at`   | `timestamp without time zone` | SÍ        | `now()`             | `timestamp` | Fecha y hora de creación del registro.        |
| `updated_at`   | `timestamp without time zone` | SÍ        | `now()`             | `timestamp` | Fecha y hora de la última actualización.      |

**Relaciones:**

- **Referenciada por:**
  - `slot_categories.slot_id` referencia a `slots.id`
  - `slot_menu_items.slot_id` referencia a `slots.id`
  - `orders.slot_id` referencia a `slots.id`

---

## Tabla: `table_codes`

**Propósito:** Almacena los códigos o números identificativos de las mesas físicas en el establecimiento donde opera The Dish Dash.

| Nombre Columna | Tipo de Dato               | ¿Nulable? | Valor por Defecto              | UDT Name      | Descripción                                  |
| :------------- | :------------------------- | :-------- | :----------------------------- | :------------ | :------------------------------------------- |
| `id`           | `uuid`                     | NO        | `gen_random_uuid()`            | `uuid`        | Identificador único del código de mesa.      |
| `table_number` | `integer`                  | NO        | `null`                         | `int4`        | Número o código de la mesa.                  |
| `created_at`   | `timestamp with time zone` | SÍ        | `timezone('utc'::text, now())` | `timestamptz` | Fecha y hora de creación del código de mesa. |

**Relaciones:**

- **Notas:** Ninguna clave foránea explícita definida, pero `orders.table_code`, `sessions.alias_mesa` y `temporary_orders.table_number` podrían hacer referencia a `table_codes.table_number` o un campo similar.

---

## Tabla: `temporary_order_items`

**Propósito:** Almacena ítems que están siendo añadidos a una orden temporal en The Dish Dash, antes de que esta sea confirmada y convertida en una orden formal en la tabla `orders`.

| Nombre Columna       | Tipo de Dato | ¿Nulable? | Valor por Defecto | UDT Name | Descripción                                                              |
| :------------------- | :----------- | :-------- | :---------------- | :------- | :----------------------------------------------------------------------- |
| `temporary_order_id` | `uuid`       | NO        | `null`            | `uuid`   | ID de la orden temporal a la que pertenece este ítem.                    |
| `menu_item_id`       | `uuid`       | NO        | `null`            | `uuid`   | ID del ítem del menú.                                                    |
| `modifiers_data`     | `jsonb`      | NO        | `'{}'::jsonb`     | `jsonb`  | JSON que almacena las opciones de modificadores seleccionadas.           |
| `alias`              | `text`       | NO        | `null`            | `text`   | Alias del cliente que está seleccionando este ítem (para multi-usuario). |
| `quantity`           | `integer`    | NO        | `null`            | `int4`   | Cantidad del ítem.                                                       |

**Relaciones:**

- **Claves Foráneas Definidas:**
  - `temporary_order_items.menu_item_id` referencia a `menu_items(id)`
  - `temporary_order_items.temporary_order_id` referencia a `temporary_orders(id)`

---

## Tabla: `temporary_orders`

**Propósito:** Almacena órdenes que están en proceso de ser creadas por los clientes en The Dish Dash pero aún no han sido confirmadas. Es un "carrito de compras" temporal.

| Nombre Columna | Tipo de Dato               | ¿Nulable? | Valor por Defecto   | UDT Name      | Descripción                                       |
| :------------- | :------------------------- | :-------- | :------------------ | :------------ | :------------------------------------------------ |
| `id`           | `uuid`                     | NO        | `gen_random_uuid()` | `uuid`        | Identificador único de la orden temporal.         |
| `table_number` | `integer`                  | NO        | `null`              | `int4`        | Número de la mesa asociada a esta orden temporal. |
| `created_at`   | `timestamp with time zone` | NO        | `now()`             | `timestamptz` | Fecha y hora de creación de la orden temporal.    |

**Relaciones:**

- **Referenciada por:**
  - `temporary_order_items.temporary_order_id` referencia a `temporary_orders.id`
- **Notas:** `table_number` podría referenciar `table_codes.table_number` o un campo similar.

---
