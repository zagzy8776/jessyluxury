import { MetadataRoute } from 'next'

const BASE_URL = 'https://jessyluxury.com'

// Keep a stable build date so the sitemap output is deterministic and cacheable
// (the file is generated at build time by Next.js and served at /sitemap.xml).
const LAST_MODIFIED = '2025-01-01'

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = [
    { path: '/', priority: 1.0 },
    { path: '/about', priority: 0.8 },
    { path: '/contact', priority: 0.8 },
    { path: '/shop', priority: 0.9 },
    { path: '/shop?filter=best', priority: 0.8 },
    { path: '/shop?filter=new', priority: 0.8 },
    { path: '/gifts', priority: 0.7 },
    { path: '/delivery', priority: 0.6 },
    { path: '/track', priority: 0.6 },
    { path: '/account', priority: 0.5 },
    { path: '/terms', priority: 0.3 },
    { path: '/privacy', priority: 0.3 },
    { path: '/returns', priority: 0.3 },
  ]

  const categoryPages = [
    '/shop?cat=Oud+%26+Amber',
    '/shop?cat=Fresh',
    '/shop?cat=Sweet+%26+Gourmand',
    '/shop?cat=Gift+Sets',
    '/shop?cat=Perfume+Oils',
  ].map((path) => ({ path, priority: 0.8 }))

  const allPages = [...staticPages, ...categoryPages]

  return allPages.map(({ path, priority }) => ({
    url: `${BASE_URL}${path}`,
    lastModified: LAST_MODIFIED,
    changeFrequency: 'weekly' as const,
    priority,
  }))
}
