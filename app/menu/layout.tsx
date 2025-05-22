import React from 'react';
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Menú - The DishDash',
  description: 'Explora nuestro delicioso menú',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#1ce3cf',
};

export default function MenuPageLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
