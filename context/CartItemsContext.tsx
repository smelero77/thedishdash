'use client';

import { createContext } from 'react';
import { Cart } from '@/types/menu';

export const CartItemsContext = createContext<Cart | null>(null);
