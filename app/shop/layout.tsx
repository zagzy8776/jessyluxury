import { pageMetadata } from '@/lib/seo-metadata'

export const metadata = pageMetadata.shop

/**
 * CollectionPage schema for /shop
 * Helps Google understand this is a product collection
 */
const collectionPageSchema = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  '@id': 'https://jessyluxury.com/shop#collection',
  'name': 'Fragrance Shop',
  'description': 'Browse 100+ original designer fragrances, Arabian perfumes, perfume oils, gift sets and body mists. Fast Nigeria delivery from Owerri.',
  'url': 'https://jessyluxury.com/shop',
  'isPartOf': {
    '@type': 'WebSite',
    '@id': 'https://jessyluxury.com/#website',
  },
}

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(collectionPageSchema),
        }}
      />
      {children}
    </>
  )
}
