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

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'arial'],
  adjustFontFallback: true,
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'The DishDash',
  description: 'The Dish Dash - Tu menú digital',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'The DishDash',
  },
  formatDetection: { telephone: false },
  icons: {
    apple: '/icons/icon-192x192.png',
    icon: '/icons/icon-192x192.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#1ce3cf',
  viewportFit: 'cover',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Cargamos en paralelo los datos que necesita el Provider
  const [menuItems, slot] = await Promise.all([getMenuItems(), getCurrentSlot()]);

  // Transformamos los menuItems al formato correcto
  const processedMenuItems = menuItems.map(processMenuItem);

  return (
    <html lang="es" className={`${inter.variable} bg-background text-foreground`}>
      <body className={inter.className} suppressHydrationWarning>
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
