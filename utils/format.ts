/**
 * Formatea un precio numérico a formato de moneda
 * @param price Precio a formatear
 * @param options Opciones de formateo
 * @returns string Precio formateado
 */
export function formatPrice(
  price: number,
  options: {
    useComma?: boolean;
    includeSpace?: boolean;
  } = {},
): string {
  const { useComma = false, includeSpace = true } = options;
  const formattedNumber = price.toFixed(2);
  const separator = useComma ? ',' : '.';
  const space = includeSpace ? ' ' : '';
  return formattedNumber.replace('.', separator) + space + '€';
}
