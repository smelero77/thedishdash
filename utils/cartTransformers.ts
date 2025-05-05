import { MenuItemData } from '@/types/menu';
import { SelectedModifiers } from '@/types/menu';

export const normalizeModifiers = (modifiers: Record<string, any> | null): Record<string, any> | null => {
    // Caso base: Si no es objeto ni array, devolver el valor tal cual
    if (!modifiers || typeof modifiers !== 'object') {
        return modifiers;
    }

    // Si es un objeto
    if (!Array.isArray(modifiers)) {
        const normalizedObj: Record<string, any> = {};
        // Recorrer las claves del objeto ordenadas alfabéticamente
        Object.keys(modifiers).sort().forEach(key => {
            // Llamada recursiva para normalizar el valor asociado a la clave
            normalizedObj[key] = normalizeModifiers(modifiers[key]);
        });
        return normalizedObj;
    }

    // Si es un array
    if (Array.isArray(modifiers)) {
        // Si el array está vacío, devolverlo tal cual
        if (modifiers.length === 0) {
            return modifiers;
        }

        // Si es un array de objetos con id, ordenar por id
        if (modifiers[0] && typeof modifiers[0] === 'object' && 'id' in modifiers[0]) {
            return [...modifiers]
                .map(item => normalizeModifiers(item))
                .filter((item): item is Record<string, any> => item !== null)
                .sort((a, b) => (a.id || '').localeCompare(b.id || ''));
        }

        // Para otros tipos de arrays, normalizar cada elemento pero mantener el orden
        return modifiers.map(item => normalizeModifiers(item));
    }

    return modifiers;
};

export const getCartKey = (itemId: string, modifiers: Record<string, any> | null): string => {
    const normalizedModifiers = normalizeModifiers(modifiers);
    return `${itemId}${normalizedModifiers ? `-${JSON.stringify(normalizedModifiers)}` : ''}`;
};

export const transformCartItem = (item: MenuItemData, modifiers: Record<string, any> | null) => {
    return {
        item,
        modifiers: normalizeModifiers(modifiers),
        quantity: 1
    };
}; 