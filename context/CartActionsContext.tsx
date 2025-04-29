"use client";

import { createContext } from 'react';
import { CartActions } from '@/types/menu';

export const CartActionsContext = createContext<CartActions | null>(null); 