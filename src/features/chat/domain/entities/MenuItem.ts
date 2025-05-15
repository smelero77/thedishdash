export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  categoryIds: string[];
  isAvailable: boolean;
  isRecommended?: boolean;
  modifiers?: Modifier[];
  isCombo?: boolean;
  slotId?: string;
  itemType?: 'Comida' | 'Bebida';
  calories?: number;
  isVegetarian?: boolean;
  isVegan?: boolean;
  isGlutenFree?: boolean;
  isAlcoholic?: boolean;
  drinkSize?: 'Pequeño' | 'Mediano' | 'Grande';
  drinkTemperature?: 'Frío' | 'Caliente';
  drinkIce?: boolean;
  drinkVolume?: number;
  drinkType?: string;
  drinkSubtype?: string;
  drinkCharacteristics?: string[];
  wineVarietal?: string[];
  wineRegion?: string;
  drinkBrand?: string;
  isNewItem?: boolean;
  isSeasonal?: boolean;
  keywords?: string[];
}

export interface Modifier {
  id: string;
  name: string;
  required: boolean;
  multiSelect: boolean;
  options: ModifierOption[];
}

export interface ModifierOption {
  id: string;
  name: string;
  extraPrice: number;
  isDefault: boolean;
} 