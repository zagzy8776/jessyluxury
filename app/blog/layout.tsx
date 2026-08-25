import { pageMetadata } from '@/lib/seo-metadata'

export const metadata = pageMetadata.blog

/**
 * Blog Article schemas for SEO
 * Each article gets its own schema for better indexing
 */
const blogArticles = [
  {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    'headline': 'How to Choose a Signature Scent',
    'description': 'Your signature scent is the fragrance people remember you by. Here is a simple five-step method to find yours — start with mood, then budget, then strength.',
    'url': 'https://jessyluxury.com/blog#how-to-choose-a-signature-scent',
    'datePublished': '2025-01-01',
    'dateModified': '2025-01-01',
    'author': {
      '@type': 'Organization',
      'name': 'Jessy Luxury Fragrance',
    },
    'publisher': {
      '@type': 'Organization',
      'name': 'Jessy Luxury Fragrance',
      'logo': {
        '@type': 'ImageObject',
        'url': 'https://jessyluxury.com/logo.png.jpeg',
        'width': 250,
        'height': 60,
      },
    },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    'headline': 'Perfume Oils vs EDP: Which Is Right for You?',
    'description': 'Both have fans for good reasons. Oils sit close to the skin and last quietly; sprays project and announce you. Learn which to choose.',
    'url': 'https://jessyluxury.com/blog#perfume-oils-vs-edp',
    'datePublished': '2025-01-01',
    'dateModified': '2025-01-01',
    'author': {
      '@type': 'Organization',
      'name': 'Jessy Luxury Fragrance',
    },
    'publisher': {
      '@type': 'Organization',
      'name': 'Jessy Luxury Fragrance',
      'logo': {
        '@type': 'ImageObject',
        'url': 'https://jessyluxury.com/logo.png.jpeg',
        'width': 250,
        'height': 60,
      },
    },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    'headline': 'Best Perfumes for Hot Nigerian Weather',
    'description': 'Heat changes how a fragrance behaves. For warm weather, fresh, citrus and aquatic notes stay clean while heavy ouds may feel overwhelming mid-day.',
    'url': 'https://jessyluxury.com/blog#best-perfumes-for-hot-nigerian-weather',
    'datePublished': '2025-01-01',
    'dateModified': '2025-01-01',
    'author': {
      '@type': 'Organization',
      'name': 'Jessy Luxury Fragrance',
    },
    'publisher': {
      '@type': 'Organization',
      'name': 'Jessy Luxury Fragrance',
      'logo': {
        '@type': 'ImageObject',
        'url': 'https://jessyluxury.com/logo.png.jpeg',
        'width': 250,
        'height': 60,
      },
    },
  },
]

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {blogArticles.map((article, idx) => (
        <script
          key={idx}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(article),
          }}
        />
      ))}
      {children}
    </>
  )
}
