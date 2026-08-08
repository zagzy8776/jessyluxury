// Product catalogue for Jessy Luxury.
// Starter data in the client's style — swap names/prices for her live inventory.

export type Tone = 'amber' | 'pistachio' | 'smoke' | 'rose' | 'oud' | 'fresh' | 'sweet' | 'musk'

export interface Product {
  id: number
  name: string
  brand: string
  price: number
  salePrice?: number
  badge?: 'SALE' | 'BEST' | 'NEW' | 'OIL'
  category: string
  volume: string
  notes: string
  tone: Tone
  stock: number
  featured?: boolean
  gift?: boolean
}

export const categories = [
  'All',
  'Best Sellers',
  'Oud & Amber',
  'Fresh',
  'Sweet & Gourmand',
  'Perfume Oils',
  'Gift Sets',
]

export const products: Product[] = [
  {
    id: 1,
    name: 'Khair Pistachio',
    brand: 'Paris Corner',
    price: 36000,
    salePrice: 32000,
    badge: 'BEST',
    category: 'Sweet & Gourmand',
    volume: '100ml EDP',
    notes: 'Pistachio · Cream · Vanilla',
    tone: 'pistachio',
    stock: 8,
    featured: true,
  },
  {
    id: 2,
    name: 'Supremacy Collector',
    brand: 'Afnan',
    price: 62000,
    badge: 'BEST',
    category: 'Best Sellers',
    volume: '100ml EDP',
    notes: 'Fruity · Woody · Amber',
    tone: 'amber',
    stock: 5,
    featured: true,
  },
  {
    id: 3,
    name: 'Invicto Legend',
    brand: 'Fragrance World',
    price: 38000,
    badge: 'NEW',
    category: 'Fresh',
    volume: '100ml EDP',
    notes: 'Fresh · Aromatic · Woody',
    tone: 'fresh',
    stock: 12,
    featured: true,
  },
  {
    id: 4,
    name: 'Almas Perfume Oil',
    brand: 'Jessy Selection',
    price: 14000,
    salePrice: 12000,
    badge: 'OIL',
    category: 'Perfume Oils',
    volume: '12ml Oil',
    notes: 'Warm · Floral · Musk',
    tone: 'rose',
    stock: 20,
    featured: true,
  },
  {
    id: 5,
    name: 'Raghba Intense',
    brand: 'Lattafa',
    price: 42000,
    badge: 'SALE',
    category: 'Oud & Amber',
    volume: '100ml EDP',
    notes: 'Oud · Vanilla · Amber',
    tone: 'oud',
    stock: 6,
    salePrice: 30000,
  },
  {
    id: 6,
    name: 'Qaed Al Fursan',
    brand: 'Lattafa',
    price: 35000,
    category: 'Oud & Amber',
    volume: '100ml EDP',
    notes: 'Saffron · Woody · Vetiver',
    tone: 'oud',
    stock: 9,
  },
  {
    id: 7,
    name: '9PM',
    brand: 'Afnan',
    price: 45000,
    badge: 'BEST',
    category: 'Sweet & Gourmand',
    volume: '100ml EDP',
    notes: 'Vanilla · Cinnamon · Apple',
    tone: 'sweet',
    stock: 7,
  },
  {
    id: 8,
    name: 'Asad',
    brand: 'Lattafa',
    price: 36000,
    category: 'Best Sellers',
    volume: '100ml EDP',
    notes: 'Pineapple · Black Pepper · Amber',
    tone: 'amber',
    stock: 10,
  },
  {
    id: 9,
    name: 'Nebras',
    brand: 'Lattafa',
    price: 39000,
    badge: 'NEW',
    category: 'Sweet & Gourmand',
    volume: '100ml EDP',
    notes: 'Vanilla · Caramel · Cedarwood',
    tone: 'sweet',
    stock: 6,
  },
  {
    id: 10,
    name: 'Citrus Musk Body Mist',
    brand: 'Jessy Selection',
    price: 8000,
    category: 'Fresh',
    volume: '200ml Mist',
    notes: 'Citrus · Musk · Clean',
    tone: 'fresh',
    stock: 15,
  },
  {
    id: 11,
    name: 'The Signature Gift Set',
    brand: 'Jessy Curated',
    price: 68000,
    badge: 'BEST',
    category: 'Gift Sets',
    volume: 'Gift box',
    notes: 'EDP + Oil + Travel Spray',
    tone: 'amber',
    stock: 4,
    gift: true,
    featured: true,
  },
  {
    id: 12,
    name: 'Oud Royale Gift Set',
    brand: 'Jessy Curated',
    price: 52000,
    badge: 'SALE',
    category: 'Gift Sets',
    volume: 'Gift box',
    notes: 'Oud EDP + Body Mist',
    tone: 'oud',
    stock: 3,
    gift: true,
    salePrice: 44000,
  },
]

export function formatNaira(n: number) {
  return '₦' + n.toLocaleString('en-NG')
}

export function byCategory(cat: string) {
  if (!cat || cat === 'All') return products
  return products.filter((p) => p.category === cat)
}
