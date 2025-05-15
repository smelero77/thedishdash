/**
 * Formatea un número como precio en formato de moneda (EUR)
 * @param price - El precio a formatear
 * @returns El precio formateado como string (ej. "150,00 €")
 */
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(price);
}; 