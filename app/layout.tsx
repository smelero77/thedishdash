import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Providers from '@/components/Providers'
import { getMenuItems, getCurrentSlot } from '@/lib/data'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Gourmeton',
  description: 'Menú digital de Gourmeton',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Gourmeton'
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#1ce3cf'
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Cargar datos del servidor
  const [menuItems, slot] = await Promise.all([
    getMenuItems(),
    getCurrentSlot()
  ]);

  return (
    <html lang="es">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1ce3cf" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className={inter.className}>
        {/* El wrapper Clientside que provee el CartContext */}
        <Providers menuItems={menuItems}>
          {children}
        </Providers>
      </body>
    </html>
  )
} 