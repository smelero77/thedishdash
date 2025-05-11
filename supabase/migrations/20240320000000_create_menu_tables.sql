-- Añadir columna menu_text a la tabla sessions
ALTER TABLE sessions
ADD COLUMN menu_text TEXT;

-- Actualizar las sesiones existentes con un valor por defecto
UPDATE sessions
SET menu_text = '[]'
WHERE menu_text IS NULL; 