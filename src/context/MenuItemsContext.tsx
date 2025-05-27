'use client';

import { createContext } from 'react';
import type { MenuItemData } from '@/types/menu';

// Crea el contexto. Puede empezar como null o un array vacío.
export const MenuItemsContext = createContext<MenuItemData[] | null>(null);

// Nota: No necesitamos un Provider complejo aquí, ya que MenuScreen actuará como Provider.
// Solo exportamos el contexto para ser usado con useContext.
