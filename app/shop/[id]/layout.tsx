import type { Metadata } from 'next'
import { createPageMetadata, createProductSchema, createBreadcrumbSchema } from '@/lib/seo-metadata'

const BASE_URL = 'https://jessyluxury.com'

/**
 * Dynamic metadata generation for product pages
 * Fetches product data and generates SEO metadata and JSON-LD schemas
 */
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  try {
    const product = await fetch(`${BASE_URL}/api/products/${params.id}`, {
      cache: 'no-store',
    }).then((res) => res.json())

    if (!product || product.error) {
      return createPageMetadata({
        title: 'Product Not Found',
        description: 'This product could not be found.',
        path: `/shop/${params.id}`,
      })
    }

    const price = product.displayPrice ?? product.salePrice ?? product.price
    const productDescription = product.description || `Discover ${product.name} by ${product.brand} - premium fragrance from Jessy Luxury. High-quality ${product.volume} perfume with exceptional sillage and longevity.`

    return createPageMetadata({
      title: `${product.name} | ${product.brand}`,
      description: `Buy ${product.name} - ${productDescription.substring(0, 120)}... ₦${price.toLocaleString()}. Fast Nigeria delivery.`,
      path: `/shop/${params.id}`,
      keywords: [
        product.name,
        product.brand,
        'perfume',
        'fragrance',
        product.category ? (typeof product.category === 'object' ? product.category.name : product.category) : 'fragrance',
        `₦${price}`,
        'Nigeria',
      ],
      image: Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : undefined,
      type: 'article',
    })
  } catch (error) {
    console.error('Error generating product metadata:', error)
    return createPageMetadata({
      title: 'Product',
      description: 'Browse our premium fragrance collection.',
      path: `/shop/${params.id}`,
    })
  }
}

/**
 * ProductLayoutWrapper component
 * Injects JSON-LD schemas for product pages
 */
export default async function ProductLayout({ children, params }: { children: React.ReactNode; params: { id: string } }) {
  let productSchema = null

  try {
    const product = await fetch(`${BASE_URL}/api/products/${params.id}`, {
      cache: 'no-store',
    }).then((res) => res.json())

    if (product && !product.error) {
      const price = product.displayPrice ?? product.salePrice ?? product.price
      const reviews = Array.isArray(product.reviews) ? product.reviews : []
      const avgRating = reviews.length > 0 ? reviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / reviews.length : undefined

      // Generate Product schema
      productSchema = createProductSchema({
        id: product.id,
        name: product.name,
        description: product.description || `Premium ${product.brand} fragrance`,
        brand: product.brand,
        price,
        currency: 'NGN',
        image: Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : undefined,
        inStock: product.stock > 0,
        rating: avgRating,
        reviewCount: reviews.length,
      })
    }
  } catch (error) {
    console.error('Error generating product schema:', error)
  }

  // Breadcrumb schema
  const breadcrumbSchema = createBreadcrumbSchema([
    { name: 'Home', url: BASE_URL },
    { name: 'Shop', url: `${BASE_URL}/shop` },
    { name: 'Product', url: `${BASE_URL}/shop/${params.id}` },
  ])

  return (
    <>
      {productSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(productSchema),
          }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />
      {children}
    </>
  )
}
