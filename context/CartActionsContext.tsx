"use client";

import { createContext } from 'react';
import { CartActions } from '@/types/cart';

export const CartActionsContext = createContext<CartActions | null>(null); 