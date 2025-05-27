import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Menú - The DishDash',
  description: 'Explora nuestro delicioso menú',
};

export default function MenuPageLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
