import { MenuItemData } from '@/types/menu';
import { SelectedModifiers } from '@/types/menu';

export const normalizeModifiers = (val: any): any => {
  // Si no es objeto ni array, devolver el valor tal cual
  if (typeof val !== 'object' || val === null) {
    return val;
  }

  // Si es un array
  if (Array.isArray(val)) {
    if (val.length > 0 && typeof val[0] === 'object' && 'id' in val[0]) {
      // Si es un array de objetos con 'id', ordenar por id
      return val.map((item) => normalizeModifiers(item)).sort((a, b) => a.id.localeCompare(b.id));
    } else {
      // Para otros arrays, mantener el orden pero normalizar elementos
      return val.map((item) => normalizeModifiers(item));
    }
  }

  // Si es un objeto
  const normalizedObj: Record<string, any> = {};
  // Ordenar las claves alfabéticamente
  Object.keys(val)
    .sort()
    .forEach((key) => {
      normalizedObj[key] = normalizeModifiers(val[key]);
    });
  return normalizedObj;
};

export const getCartKey = (
  itemId: string,
  modifiers: Record<string, any> | null | undefined,
  alias: string | undefined,
): string => {
  const normalizedModifiers = normalizeModifiers(modifiers);
  return `${itemId}${normalizedModifiers ? `-${JSON.stringify(normalizedModifiers)}` : ''}-${alias || ''}`;
};

export const transformCartItem = (item: MenuItemData, modifiers: Record<string, any> | null) => {
  return {
    item,
    modifiers: normalizeModifiers(modifiers),
    quantity: 1,
  };
};
