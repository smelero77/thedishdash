/**
 * Formatea un número como precio en euros
 */
export function formatPrice(price: number): string {
  return `${price.toFixed(2)}€`;
} 