import type { Metadata } from 'next'

const BASE_URL = 'https://jessyluxury.com'
const BRAND_NAME = 'Jessy Luxury Fragrance'
const LOGO_URL = `${BASE_URL}/logo.png.jpeg`

/**
 * Create consistent metadata for pages
 * Includes title, description, OG, Twitter, canonical
 */
export function createPageMetadata(config: {
  title: string
  description: string
  path: string
  keywords?: string[]
  image?: string
  type?: 'website' | 'article'
}): Metadata {
  const {
    title,
    description,
    path,
    keywords = [],
    image = LOGO_URL,
    type = 'website',
  } = config

  const fullTitle = `${title} | ${BRAND_NAME}`
  const url = `${BASE_URL}${path}`

  return {
    title: fullTitle,
    description,
    keywords,
    metadataBase: new URL(BASE_URL),
    openGraph: {
      title,
      description,
      url,
      type: type as 'website' | 'article',
      siteName: BRAND_NAME,
      locale: 'en_NG',
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: BRAND_NAME,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
      creator: '@jessyluxuryfragrance',
    },
    alternates: {
      canonical: url,
    },
  }
}

/**
 * Page metadata definitions
 */
export const pageMetadata = {
  home: createPageMetadata({
    title: 'Smell Expensive. Feel Unforgettable.',
    description:
      'Original designer and Arabian fragrances, oil perfumes, body mists, gift sets and home scents from Jessy Luxury with WhatsApp ordering.',
    path: '/',
    keywords: [
      'luxury perfume',
      'designer fragrance',
      'arabian perfume',
      'perfume online',
      'fragrance Nigeria',
    ],
  }),

  about: createPageMetadata({
    title: 'About Us | Authentic Fragrances in Owerri, Nigeria',
    description:
      'Learn about Jessy Luxury Fragrance — 100% authentic designer and Arabian perfumes, oils, and gift sets. Based in Owerri, Imo State, Nigeria.',
    path: '/about',
    keywords: [
      'about Jessy Luxury',
      'fragrance retailer Owerri',
      'authentic perfumes Nigeria',
      'luxury perfume store',
    ],
  }),

  contact: createPageMetadata({
    title: 'Contact Us | Get in Touch - Owerri, Nigeria',
    description:
      'Contact Jessy Luxury Fragrance in Owerri, Imo State, Nigeria. WhatsApp orders, email, phone support available.',
    path: '/contact',
    keywords: ['contact perfume shop', 'Jessy Luxury contact', 'fragrance customer service'],
  }),

  shop: createPageMetadata({
    title: 'Shop Fragrances | Designer & Arabian Perfumes',
    description:
      'Browse 100+ original designer fragrances, Arabian perfumes, perfume oils, gift sets and body mists. Fast Nigeria delivery from Owerri.',
    path: '/shop',
    keywords: [
      'buy perfume online',
      'perfume shop',
      'designer fragrances',
      'arabian perfumes',
      'perfume oils',
      'fragrance store',
    ],
    type: 'website',
  }),

  blog: createPageMetadata({
    title: 'Fragrance Blog | Scent Guides & Tips',
    description:
      'Read perfume tips, fragrance guides, scent advice and styling tips from Jessy Luxury.',
    path: '/blog',
    keywords: [
      'fragrance tips',
      'perfume guide',
      'how to wear perfume',
      'fragrance advice',
      'scent guide',
    ],
  }),

  delivery: createPageMetadata({
    title: 'Delivery & Shipping | Fast Perfume Delivery Nigeria',
    description:
      'Fast perfume delivery across Nigeria. See delivery zones, shipping rates, delivery times and how to track your Jessy Luxury order.',
    path: '/delivery',
    keywords: [
      'perfume delivery',
      'fast shipping',
      'delivery in Nigeria',
      'track order',
      'shipping rates',
    ],
  }),

  perfumeFinder: createPageMetadata({
    title: 'Perfume Finder Quiz | Find Your Signature Scent',
    description:
      'Take the 5-minute fragrance quiz to discover your perfect perfume based on mood, budget and preferred scent family.',
    path: '/perfume-finder',
    keywords: [
      'perfume quiz',
      'fragrance finder',
      'find my scent',
      'perfume recommendation',
      'scent match',
    ],
  }),

  gallery: createPageMetadata({
    title: 'Fragrance Gallery | Perfume Collections',
    description:
      'Browse our fragrance collection gallery. See all our designer, Arabian, and luxury perfumes in one place.',
    path: '/gallery',
    keywords: [
      'fragrance collection',
      'perfume gallery',
      'fragrance showcase',
      'perfume types',
    ],
  }),

  returns: createPageMetadata({
    title: 'Returns & Refunds | Jessy Luxury Fragrance',
    description:
      'Our returns policy, refund process and how to return your Jessy Luxury fragrance within 7 days if not satisfied.',
    path: '/returns',
    keywords: ['returns policy', 'refund policy', 'fragrance guarantee', 'customer satisfaction'],
  }),

  terms: createPageMetadata({
    title: 'Terms of Service | Jessy Luxury',
    description: 'Terms and conditions for shopping at Jessy Luxury Fragrance.',
    path: '/terms',
  }),

  privacy: createPageMetadata({
    title: 'Privacy Policy | Jessy Luxury',
    description: 'Our privacy policy and how we protect your data at Jessy Luxury Fragrance.',
    path: '/privacy',
  }),

  owerri: createPageMetadata({
    title: 'Luxury Perfumes in Owerri, Imo State | Jessy Luxury',
    description:
      'Original designer and Arabian fragrances in Owerri, Imo State, Nigeria. WhatsApp ordering, local delivery, walk-in shopping available.',
    path: '/owerri',
    keywords: [
      'perfume shop Owerri',
      'fragrances Owerri',
      'luxury perfumes Owerri',
      'perfume delivery Owerri',
      'fragrance store Owerri',
    ],
  }),
}

/**
 * Organization/LocalBusiness schema for JSON-LD
 */
export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  '@id': `${BASE_URL}/#organization`,
  'name': BRAND_NAME,
  'image': LOGO_URL,
  'description':
    '100% authentic designer and Arabian fragrances, perfume oils, gift sets and body mists. Based in Owerri, Imo State, Nigeria.',
  'url': BASE_URL,
  'telephone': '+234...',
  'email': 'hello@jessyluxury.com',
  'address': {
    '@type': 'PostalAddress',
    'streetAddress': '15 Umez Eronini St',
    'addressLocality': 'Owerri',
    'addressRegion': 'Imo',
    'postalCode': '460281',
    'addressCountry': 'NG',
  },
  'geo': {
    '@type': 'GeoCoordinates',
    'latitude': 5.4831,
    'longitude': 7.0543,
  },
  'areaServed': {
    '@type': 'Country',
    'name': 'Nigeria',
  },
  'serviceType': ['Fragrance Retail', 'Perfume Consultation', 'Gift Services'],
  'priceRange': '₦',
  'sameAs': [
    'https://instagram.com/jessyluxuryfragrance',
    'https://tiktok.com/@jessyluxuryfragrance',
    'https://wa.me/234...',
  ],
}

/**
 * WebSite schema with search action
 */
export const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${BASE_URL}/#website`,
  'url': BASE_URL,
  'name': BRAND_NAME,
  'description': 'Original designer and Arabian fragrances with WhatsApp ordering',
  'potentialAction': {
    '@type': 'SearchAction',
    'target': {
      '@type': 'EntryPoint',
      'urlTemplate': `${BASE_URL}/shop?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
}

/**
 * Breadcrumb schema template
 */
export function createBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': items.map((item, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'name': item.name,
      'item': item.url,
    })),
  }
}

/**
 * Product schema template
 */
export function createProductSchema(product: {
  id: string | number
  name: string
  description: string
  brand: string
  price: number
  currency?: string
  image?: string
  inStock?: boolean
  rating?: number
  reviewCount?: number
}) {
  const { id, name, description, brand, price, currency = 'NGN', image = LOGO_URL, inStock = true, rating, reviewCount } = product

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${BASE_URL}/shop/${id}#product`,
    'name': name,
    'description': description,
    'image': image,
    'brand': {
      '@type': 'Brand',
      'name': brand,
    },
    'offers': {
      '@type': 'Offer',
      'url': `${BASE_URL}/shop/${id}`,
      'priceCurrency': currency,
      'price': price.toString(),
      'availability': inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      'seller': {
        '@type': 'Organization',
        'name': BRAND_NAME,
        'url': BASE_URL,
      },
    },
    ...(rating &&
      reviewCount && {
        'aggregateRating': {
          '@type': 'AggregateRating',
          'ratingValue': rating.toString(),
          'reviewCount': reviewCount.toString(),
        },
      }),
  }
}

/**
 * FAQ Page schema template
 */
export function createFAQSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': faqs.map((faq) => ({
      '@type': 'Question',
      'name': faq.question,
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': faq.answer,
      },
    })),
  }
}
