// app/layout.tsx
import type { Metadata, Viewport } from 'next';
import { Inter, Montserrat } from 'next/font/google';
import './globals.css';
import Providers from '@/components/Providers';
import { getMenuItems, getCurrentSlot } from '@/lib/data';
import { processMenuItem } from '@/utils/menu';
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import Script from 'next/script';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'arial'],
  adjustFontFallback: true,
  variable: '--font-inter',
});

const montserrat = Montserrat({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  variable: '--font-montserrat',
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
  viewportFit: 'cover',
  themeColor: '#1ce3cf',
  userScalable: false,
  maximumScale: 1,
  minimumScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Cargamos en paralelo los datos que necesita el Provider
  const [menuItems, slot] = await Promise.all([getMenuItems(), getCurrentSlot()]);

  // Transformamos los menuItems al formato correcto
  const processedMenuItems = menuItems.map(processMenuItem);

  return (
    <html lang="es" className={`${inter.variable} ${montserrat.variable} bg-background text-foreground`}>
      <head>
        {/* <meta name="screen-orientation" content="portrait" />
        <meta name="x5-orientation" content="portrait" />
        <meta name="full-screen" content="yes" />
        <meta name="browsermode" content="application" />
        <meta name="x5-fullscreen" content="true" />
        <meta name="x5-page-mode" content="app" />
        <meta name="orientation" content="portrait" /> */}
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <Providers menuItems={processedMenuItems}>
          <ServiceWorkerRegistration />
          {children}
          <Analytics />
          <SpeedInsights />
        </Providers>
        <Script id="lock-orientation" strategy="beforeInteractive">
          {`
            /* if (typeof window !== 'undefined' && window.screen && window.screen.orientation && typeof window.screen.orientation.lock === 'function') {
              window.screen.orientation.lock('portrait').catch(function(error) {
                console.info('Bloqueo de orientación a vertical intentado. Error (puede ser informativo):', error.message);
              });
            } else {
              console.info('API Screen.orientation.lock no soportada completamente.');
            } */
          `}
        </Script>
      </body>
    </html>
  );
}
