import './globals.css'
import { Inter, Cormorant_Garamond } from 'next/font/google'
import type { Metadata } from 'next'
import CartProvider from '@/components/CartProvider'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import CartDrawer from '@/components/CartDrawer'

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
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${display.variable}`}>
      <body>
        <CartProvider>
          <Header />
          {children}
          <Footer />
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  )
}

