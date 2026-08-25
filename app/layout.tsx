import './globals.css'
import './category-art.css'
import { Inter, Cormorant_Garamond } from 'next/font/google'
import type { Metadata } from 'next'
import CartProvider from '@/components/CartProvider'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import CartDrawer from '@/components/CartDrawer'
import OneSignalInit from '@/components/OneSignalInit'
import StorefrontAnnouncement from '@/components/StorefrontAnnouncement'
import BottomNav from '@/components/storefront/BottomNav'
import PromoRewardWrapper from '@/components/PromoRewardWrapper'
import DeviceFilePickerGuard from '@/components/DeviceFilePickerGuard'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const display = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-display',
})

export const metadata: Metadata = {
  title: 'Jessy Luxury Fragrance | Smell Expensive. Feel Unforgettable.',
  description:
    'Original designer and Arabian fragrances, oil perfumes, body mists, gift sets and home scents from Jessy Luxury with WhatsApp ordering.',
  keywords: [
    'perfume', 'fragrance', 'designer perfume', 'Arabian perfume', 'oil perfume',
    'body mist', 'gift sets', 'Nigeria', 'Owerri', 'WhatsApp perfume shop'
  ],
  authors: [{ name: 'Jessy Luxury', url: 'https://jessyluxury.com' }],
  metadataBase: new URL('https://jessyluxury.com'),
  openGraph: {
    type: 'website',
    locale: 'en_NG',
    url: 'https://jessyluxury.com',
    title: 'Jessy Luxury Fragrance | Smell Expensive. Feel Unforgettable.',
    description:
      'Original designer and Arabian fragrances, oil perfumes, body mists, gift sets and home scents.',
    siteName: 'Jessy Luxury',
    images: [
      {
        url: 'https://jessyluxury.com/hero-spray.jpg',
        width: 1200,
        height: 630,
        alt: 'Jessy Luxury Fragrance Collection',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Jessy Luxury Fragrance | Smell Expensive. Feel Unforgettable.',
    description:
      'Original designer and Arabian fragrances, oil perfumes, body mists, gift sets and home scents.',
    images: ['https://jessyluxury.com/hero-spray.jpg'],
    creator: '@jessyluxuryfragrance',
  },
  alternates: {
    canonical: 'https://jessyluxury.com',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${display.variable}`}>
      <body>
        <DeviceFilePickerGuard />
        <OneSignalInit />
        <StorefrontAnnouncement />
        <PromoRewardWrapper />
        <CartProvider>
          <Header />
          <div className="pb-[calc(4.25rem+env(safe-area-inset-bottom))] lg:pb-0">
            {children}
            <Footer />
          </div>
          <CartDrawer />
          <BottomNav />
        </CartProvider>
      </body>
    </html>
  )
}
