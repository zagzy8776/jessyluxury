import { MetadataRoute } from 'next'

const BASE_URL = 'https://jessyluxury.com'

// Keep a stable build date so the sitemap output is deterministic and cacheable
// (the file is generated at build time by Next.js and served at /sitemap.xml).
const LAST_MODIFIED = '2025-01-01'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages - all public indexable pages
  const staticPages = [
    { path: '/', priority: 1.0, changefreq: 'weekly' as const },
    { path: '/about', priority: 0.8, changefreq: 'monthly' as const },
    { path: '/contact', priority: 0.8, changefreq: 'monthly' as const },
    { path: '/shop', priority: 0.95, changefreq: 'daily' as const },
    { path: '/blog', priority: 0.7, changefreq: 'weekly' as const },
    { path: '/gallery', priority: 0.6, changefreq: 'weekly' as const },
    { path: '/gifts', priority: 0.8, changefreq: 'weekly' as const },
    { path: '/delivery', priority: 0.7, changefreq: 'monthly' as const },
    { path: '/track', priority: 0.6, changefreq: 'weekly' as const },
    { path: '/perfume-finder', priority: 0.6, changefreq: 'monthly' as const },
    { path: '/returns', priority: 0.5, changefreq: 'monthly' as const },
    { path: '/terms', priority: 0.3, changefreq: 'yearly' as const },
    { path: '/privacy', priority: 0.3, changefreq: 'yearly' as const },
    // NOTE: /account removed - this is login page, should not be indexed
  ]

  // Category/filter pages with proper URL encoding
  const categoryPages = [
    { path: '/shop?cat=Oud%26Amber', priority: 0.8 },
    { path: '/shop?cat=Fresh', priority: 0.8 },
    { path: '/shop?cat=Sweet%26Gourmand', priority: 0.8 },
    { path: '/shop?cat=Gift Sets', priority: 0.8 },
    { path: '/shop?cat=Perfume Oils', priority: 0.8 },
    { path: '/shop?filter=best', priority: 0.8 },
    { path: '/shop?filter=new', priority: 0.8 },
  ]

  // Dynamic product pages
  let productPages: Array<{ path: string; priority: number; changefreq: 'daily' | 'weekly' | 'monthly' | 'yearly' }> = []

  try {
    const products = await fetch(`${BASE_URL}/api/products`, {
      cache: 'no-store',
    }).then((res) => res.json())

    if (Array.isArray(products) && products.length > 0) {
      productPages = products.map((product: any) => ({
        path: `/shop/${product.id}`,
        priority: 0.75,
        changefreq: 'weekly' as const,
      }))
    }
  } catch (error) {
    console.error('Error fetching products for sitemap:', error)
    // Fallback: return only static pages if API call fails
    productPages = []
  }

  const allPages = [
    ...staticPages.map(p => ({ path: p.path, priority: p.priority, changeFrequency: p.changefreq })),
    ...categoryPages.map(p => ({ path: p.path, priority: p.priority, changeFrequency: 'weekly' as const })),
    ...productPages.map(p => ({ path: p.path, priority: p.priority, changeFrequency: p.changefreq })),
  ]

  return allPages.map(({ path, priority, changeFrequency }) => ({
    url: `${BASE_URL}${path}`,
    lastModified: LAST_MODIFIED,
    changeFrequency,
    priority,
  }))
}

// ============================================
// 100 SEO KEYWORDS FOR JESSY LUXURY FRAGRANCE
// ============================================
// Category: General Perfume/Fragrance Terms (25)
export const keywordsGeneral = [
  'perfume', 'fragrance', 'scents', 'aromatic', 'scented', 'parfum',
  'niche perfume', 'designer perfume', 'arabian perfume', 'middle eastern perfume',
  'long lasting perfume', 'premium fragrance', 'luxury scent', 'high end perfume',
  'affordable luxury perfume', 'signature scent', 'personal fragrance', 'perfume collection',
  'fragrance for women', 'fragrance for men', 'unisex perfume', 'exclusive fragrances',
  'designer scents', 'arabian scents', 'middle eastern scents'
]

// Category: Product Types (20)
export const keywordsProductTypes = [
  'eau de parfum', 'eau de toilette', 'perfume oil', 'fragrance oil', 'body mist',
  'oil perfume', 'attar perfume', 'oud oil', 'attar', 'mukhallat',
  'perfume set', 'gift set', 'travel size perfume', 'sample perfume', 'mini perfume',
  'tester perfume', 'refillable perfume', 'premium perfume oil', 'natural perfume oil',
  'synthetic perfume oil'
]

// Category: Scents/Notes (20)
export const keywordsScents = [
  'oud', 'amber', 'rose', 'jasmine', 'sandalwood', 'musk', 'vanilla', 'ambergris',
  'amber oud', 'oud amber', 'oud and amber', 'oud & amber', 'oud amber blend',
  'oud amber perfume', 'oud amber oil', 'oud amber fragrance', 'oud amber scent',
  'oud amber mixture', 'oud amber perfume blend'
]

// Category: Nigerian Market (20)
export const keywordsNigeria = [
  'Nigeria perfume', 'Lagos perfume shop', 'Abuja perfume', 'Port Harcourt perfume',
  'Owerri perfume', 'best perfume in Nigeria', 'Nigerian perfume shop', 'Nigeria fragrance',
  'affordable perfume Nigeria', 'luxury perfume Nigeria', 'perfume delivery Nigeria',
  'Nigeria perfume online', 'Nigeria perfume store', 'Nigerian perfume brands',
  'Nigeria perfume prices', 'perfume shop Nigeria', 'Nigeria perfume delivery',
  'Nigeria perfume outlet', 'Nigeria perfume market', 'Nigeria perfume dealers'
]

// Category: Long Lasting & Quality (15)
export const keywordsQuality = [
  'long lasting perfume', 'long lasting fragrance', 'all day perfume', 'all night fragrance',
  'sillage perfume', 'projection perfume', 'high concentration perfume', 'pure perfume oil',
  'concentrated perfume', 'long lasting oil perfume', 'all day oil perfume', 'night time perfume',
  'strong perfume', 'powerful fragrance', 'intense perfume'
]

// ============================================
// HOW TO USE THESE KEYWORDS:
// ============================================
// 1. Add to page meta tags in app/layout.tsx and individual pages
// 2. Use in product descriptions
// 3. Use in blog content
// 4. Use in alt text for images
// 5. Use in schema markup

// Example usage in metadata:
/*
export const metadata: Metadata = {
  title: 'Jessy Luxury Fragrance',
  description: 'Original designer and Arabian fragrances from Jessy Luxury.',
  keywords: [
    ...keywordsGeneral,
    ...keywordsProductTypes,
    ...keywordsScents,
    ...keywordsNigeria,
    ...keywordsQuality,
  ].slice(0, 50), // Google recommends max 50 keywords
}
*/
