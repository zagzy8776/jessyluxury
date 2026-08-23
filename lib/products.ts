// Shared product types and formatting helpers.
// Live product records are stored in PostgreSQL and must be loaded through /api/products.

export type Tone = 'amber' | 'pistachio' | 'smoke' | 'rose' | 'oud' | 'fresh' | 'sweet' | 'musk'

export interface Product {
  id: number
  name: string
  brand: string
  price: number
  salePrice?: number
  displayPrice?: number
  wholesalePrice?: number | null
  isWholesale?: boolean
  badge?: 'SALE' | 'BEST' | 'NEW' | 'OIL'
  category: string
  volume: string
  notes: string
  tone: Tone
  stock: number
  featured?: boolean
  gift?: boolean
  images?: string[]
}

// Canonical storefront category labels. Product membership comes from the database.
export const categories = [
  'All',
  'Best Sellers',
  'Oud & Amber',
  'Fresh',
  'Sweet & Gourmand',
  'Perfume Oils',
  'Gift Sets',
]

// Intentionally empty: this module no longer contains demo inventory.
// Components must use live API data instead of silently falling back to fake products.
export const products: Product[] = []

export function formatNaira(n: number) {
  return '₦' + n.toLocaleString('en-NG')
}

export function byCategory(cat: string) {
  if (!cat || cat === 'All') return products
  return products.filter((p) => p.category === cat)
}
