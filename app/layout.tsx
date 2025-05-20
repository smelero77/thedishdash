// app/layout.tsx
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Providers from '@/components/Providers';
import { getMenuItems, getCurrentSlot } from '@/lib/data';
import { processMenuItem } from '@/utils/menu';
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Gourmeton',
  description: 'Menú digital de Gourmeton',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Gourmeton',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#1ce3cf',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Cargamos en paralelo los datos que necesita el Provider
  const [menuItems, slot] = await Promise.all([getMenuItems(), getCurrentSlot()]);

  // Transformamos los menuItems al formato correcto
  const processedMenuItems = menuItems.map(processMenuItem);

  return (
    <html lang="es">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1ce3cf" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, viewport-fit=cover, maximum-scale=1.0, user-scalable=no"
        />
      </head>
      <body className={inter.className}>
        {/*
          El primer componente cliente es Providers.
          Ahí es donde inyectamos why-did-you-render (en desarrollo)
          y levantamos todos los contextos.
        */}
        <Providers menuItems={processedMenuItems}>
          <ServiceWorkerRegistration />
          {children}
          <Analytics />
          <SpeedInsights />
        </Providers>
      </body>
    </html>
  );
}
