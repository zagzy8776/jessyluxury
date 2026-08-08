'use client'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Product } from '@/lib/products'

export interface CartItem {
  id: number
  name: string
  brand: string
  price: number
  volume: string
  tone: string
  quantity: number
}

interface CartContextValue {
  items: CartItem[]
  count: number
  subtotal: number
  add: (p: Product, q?: number) => void
  remove: (id: number) => void
  updateQty: (id: number, q: number) => void
  clear: () => void
  drawer: boolean
  setDrawer: (v: boolean) => void
  wishlist: number[]
  toggleWish: (id: number) => void
}

const CartContext = createContext<CartContextValue | null>(null)

export function useCart() {
  const c = useContext(CartContext)
  if (!c) throw new Error('useCart must be used within CartProvider')
  return c
}

export default function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [wishlist, setWishlist] = useState<number[]>([])
  const [drawer, setDrawer] = useState(false)

  useEffect(() => {
    try {
      const c = JSON.parse(localStorage.getItem('jl_cart') || '[]')
      const w = JSON.parse(localStorage.getItem('jl_wish') || '[]')
      if (Array.isArray(c)) setItems(c)
      if (Array.isArray(w)) setWishlist(w)
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem('jl_cart', JSON.stringify(items))
    } catch {
      /* ignore */
    }
  }, [items])

  useEffect(() => {
    try {
      localStorage.setItem('jl_wish', JSON.stringify(wishlist))
    } catch {
      /* ignore */
    }
  }, [wishlist])

  const add = (p: Product, q = 1) =>
    setItems((prev) => {
      const price = p.salePrice ?? p.price
      const existing = prev.find((i) => i.id === p.id)
      if (existing)
        return prev.map((i) =>
          i.id === p.id ? { ...i, quantity: Math.min(i.quantity + q, p.stock) } : i
        )
      return [
        ...prev,
        {
          id: p.id,
          name: p.name,
          brand: p.brand,
          price,
          volume: p.volume,
          tone: p.tone,
          quantity: Math.min(q, p.stock),
        },
      ]
    })

  const remove = (id: number) => setItems((prev) => prev.filter((i) => i.id !== id))
  const updateQty = (id: number, q: number) =>
    setItems((prev) => (q <= 0 ? prev.filter((i) => i.id !== id) : prev.map((i) => (i.id === id ? { ...i, quantity: q } : i))))
  const clear = () => setItems([])
  const toggleWish = (id: number) =>
    setWishlist((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  const count = useMemo(() => items.reduce((n, i) => n + i.quantity, 0), [items])
  const subtotal = useMemo(() => items.reduce((n, i) => n + i.price * i.quantity, 0), [items])

  return (
    <CartContext.Provider
      value={{ items, count, subtotal, add, remove, updateQty, clear, drawer, setDrawer, wishlist, toggleWish }}
    >
      {children}
    </CartContext.Provider>
  )
}
