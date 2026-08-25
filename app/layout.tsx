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
import { organizationSchema, websiteSchema } from '@/lib/seo-metadata'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const display = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-display',
})

// 100 SEO keywords for Jessy Luxury Fragrance
const allKeywords = [
  // General Perfume/Fragrance Terms (25)
  'perfume', 'fragrance', 'scents', 'aromatic', 'scented', 'parfum',
  'niche perfume', 'designer perfume', 'arabian perfume', 'middle eastern perfume',
  'long lasting perfume', 'premium fragrance', 'luxury scent', 'high end perfume',
  'affordable luxury perfume', 'signature scent', 'personal fragrance', 'perfume collection',
  'fragrance for women', 'fragrance for men', 'unisex perfume', 'exclusive fragrances',
  'designer scents', 'arabian scents', 'middle eastern scents',
  // Product Types (20)
  'eau de parfum', 'eau de toilette', 'perfume oil', 'fragrance oil', 'body mist',
  'oil perfume', 'attar perfume', 'oud oil', 'attar', 'mukhallat',
  'perfume set', 'gift set', 'travel size perfume', 'sample perfume', 'mini perfume',
  'tester perfume', 'refillable perfume', 'premium perfume oil', 'natural perfume oil',
  'synthetic perfume oil',
  // Scents/Notes (20)
  'oud', 'amber', 'rose', 'jasmine', 'sandalwood', 'musk', 'vanilla', 'ambergris',
  'oud amber', 'rose oud', 'sandalwood amber', 'musk rose', 'vanilla amber', 'oud rose',
  'amber rose', 'sandalwood rose', 'oud sandalwood', 'rose sandalwood', 'amber musk',
  'oud musk', 'rose musk', 'amber vanilla', 'oud vanilla',
  // Nigerian Market (20)
  'Nigeria perfume', 'Lagos perfume shop', 'Abuja perfume', 'Port Harcourt perfume',
  'Owerri perfume', 'best perfume in Nigeria', 'Nigerian perfume shop', 'Nigeria fragrance',
  'affordable perfume Nigeria', 'luxury perfume Nigeria', 'perfume delivery Nigeria',
  'Nigeria perfume online', 'Nigeria perfume store', 'Nigerian perfume brands',
  'Nigeria perfume prices', 'perfume shop Nigeria', 'Nigeria perfume delivery',
  'Nigeria perfume outlet', 'Nigeria perfume market', 'Nigeria perfume dealers',
  // Long Lasting & Quality (15)
  'long lasting perfume', 'long lasting fragrance', 'all day perfume', 'all night fragrance',
  'sillage perfume', 'projection perfume', 'high concentration perfume', 'pure perfume oil',
  'concentrated perfume', 'long lasting oil perfume', 'all day oil perfume', 'night time perfume',
  'strong perfume', 'powerful fragrance', 'intense perfume'
]
// All 36 Nigerian states with their capital cities — local SEO coverage so
// shoppers searching "<state>/<city> perfume" in every state can find us.
const nigerianStateCapitals: Array<[string, string]> = [
  ['Abia', 'Umuahia'],
  ['Adamawa', 'Yola'],
  ['Akwa Ibom', 'Uyo'],
  ['Anambra', 'Awka'],
  ['Bauchi', 'Bauchi'],
  ['Bayelsa', 'Yenagoa'],
  ['Benue', 'Makurdi'],
  ['Borno', 'Maiduguri'],
  ['Cross River', 'Calabar'],
  ['Delta', 'Asaba'],
  ['Ebonyi', 'Abakaliki'],
  ['Edo', 'Benin City'],
  ['Ekiti', 'Ado-Ekiti'],
  ['Enugu', 'Enugu'],
  ['Gombe', 'Gombe'],
  ['Imo', 'Owerri'],
  ['Jigawa', 'Dutse'],
  ['Kaduna', 'Kaduna'],
  ['Kano', 'Kano'],
  ['Katsina', 'Katsina'],
  ['Kebbi', 'Birnin Kebbi'],
  ['Kogi', 'Lokoja'],
  ['Kwara', 'Ilorin'],
  ['Lagos', 'Ikeja'],
  ['Nasarawa', 'Lafia'],
  ['Niger', 'Minna'],
  ['Ogun', 'Abeokuta'],
  ['Ondo', 'Akure'],
  ['Osun', 'Osogbo'],
  ['Oyo', 'Ibadan'],
  ['Plateau', 'Jos'],
  ['Rivers', 'Port Harcourt'],
  ['Sokoto', 'Sokoto'],
  ['Taraba', 'Jalingo'],
  ['Yobe', 'Damaturu'],
  ['Zamfara', 'Gusau'],
]

// Streets & neighbourhoods (home base: Owerri, Imo) plus the FCT capital.
const streetKeywords = [
  'Abuja perfume',
  'MCC Road Owerri',
  'Ihechiuwa Junction Owerri',
  'Wetheral Road Owerri',
  'Douglas Road Owerri',
  'Tetlow Road Owerri',
  'Royce Road Owerri',
  'Okigwe Road Owerri',
  'Amakohia Owerri',
  'World Bank Housing Estate Owerri',
]

// Nigeria-wide local SEO: every state + every capital city + streets/FCT.
const localSeoKeywords = [
  ...nigerianStateCapitals.flatMap(([state, capital]) => [
    `${state} perfume`,
    `${capital} perfume`,
    `perfume in ${capital}`,
  ]),
  ...streetKeywords,
]


export const metadata: Metadata = {
  title: 'Jessy Luxury Fragrance | Smell Expensive. Feel Unforgettable.',
  description:
    'Original designer and Arabian fragrances, oil perfumes, body mists, gift sets and home scents from Jessy Luxury with WhatsApp ordering.',
  keywords: [...allKeywords.slice(0, 50), ...localSeoKeywords], // top product + Nigeria-wide local SEO keywords
  authors: [{ name: 'Jessy Luxury', url: 'https://jessyluxury.com' }],
  metadataBase: new URL('https://jessyluxury.com'),
  icons: {
    icon: [
      { url: '/logo.png.jpeg', sizes: '32x32', type: 'image/jpeg' },
      { url: '/logo.png.jpeg', sizes: '16x16', type: 'image/jpeg' },
    ],
    apple: [
      { url: '/logo.png.jpeg', sizes: '180x180', type: 'image/jpeg' },
    ],
    shortcut: '/logo.png.jpeg',
  },
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
        url: 'https://jessyluxury.com/logo.png.jpeg',
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
    images: ['https://jessyluxury.com/logo.png.jpeg'],
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteSchema),
          }}
        />
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
