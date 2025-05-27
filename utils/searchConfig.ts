import { MenuItemData } from '@/types/menu';

// Sugerencias populares predefinidas
export const POPULAR_SEARCHES = [
  { term: 'Ensaladas', icon: '🥗' },
  { term: 'Pizzas', icon: '🍕' },
  { term: 'Postres', icon: '🍰' },
  { term: 'Bebidas', icon: '🥤' },
  { term: 'Vegano', icon: '🌱' },
  { term: 'Sin Gluten', icon: '🌾' },
  { term: 'Pasta', icon: '🍝' },
  { term: 'Carnes', icon: '🥩' },
];

// Configuración de Fuse.js para búsqueda fuzzy
export const FUSE_OPTIONS = {
  keys: [
    { name: 'name', weight: 2 },
    { name: 'keywords', weight: 1.5 },
    { name: 'description', weight: 1 },
    { name: 'food_info', weight: 1 },
    { name: 'origin', weight: 1 },
    { name: 'pairing_suggestion', weight: 1 },
    { name: 'chef_notes', weight: 1 },
    { name: 'item_type', weight: 1 },
  ],
  threshold: 0.4,
  includeScore: true,
  minMatchCharLength: 2,
  shouldSort: true,
  findAllMatches: true,
  location: 0,
  distance: 100,
  useExtendedSearch: true,
};

// Función para obtener sugerencias similares cuando no hay resultados
export const getSimilarSuggestions = (query: string, menuItems: MenuItemData[]): string[] => {
  const words = query.toLowerCase().split(' ');
  const suggestions = new Set<string>();

  menuItems.forEach((item) => {
    // Buscar coincidencias en el nombre
    if (item.name.toLowerCase().includes(words[0])) {
      suggestions.add(item.name);
    }
    // Buscar coincidencias en keywords
    item.keywords?.forEach((keyword) => {
      if (keyword.toLowerCase().includes(words[0])) {
        suggestions.add(keyword);
      }
    });
  });

  return Array.from(suggestions).slice(0, 3); // Devolver máximo 3 sugerencias
};
