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
import Script from 'next/script';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'arial'],
  adjustFontFallback: true,
});

export const metadata: Metadata = {
  title: 'The DishDash',
  description: 'Order food easily with The DishDash.',
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
    <html lang="es" className="bg-background text-foreground">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#000000" />
        <meta name="description" content="The Dish Dash - Tu menú digital" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/logo192.png" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <Script id="font-loading" strategy="afterInteractive">
          {`
            // Optimizar la carga de fuentes
            if ('fonts' in document) {
              Promise.all([
                document.fonts.load('1em Inter'),
                document.fonts.load('500 1em Inter'),
                document.fonts.load('600 1em Inter'),
                document.fonts.load('700 1em Inter')
              ]).then(() => {
                document.documentElement.classList.add('fonts-loaded');
              });
            }
          `}
        </Script>
        <Script id="css-optimization" strategy="afterInteractive">
          {`
            // Optimizar la carga de CSS
            const cssLinks = document.querySelectorAll('link[rel="stylesheet"]');
            cssLinks.forEach(link => {
              if (link.href.includes('_next/static/css')) {
                link.setAttribute('media', 'all');
                link.setAttribute('fetchpriority', 'high');
              }
            });
          `}
        </Script>
      </head>
      <body className={inter.className} suppressHydrationWarning>
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
