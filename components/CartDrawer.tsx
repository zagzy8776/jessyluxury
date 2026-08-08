'use client'
import { X, Minus, Plus, Trash2, ShoppingBag, MessageCircle } from 'lucide-react'
import { useCart } from './CartProvider'
import Bottle from './Bottle'
import { formatNaira } from '@/lib/products'
import { wa } from '@/lib/site'

export default function CartDrawer() {
  const { drawer, setDrawer, items, updateQty, remove, subtotal, count, clear } = useCart()

  if (!drawer) return null

  const lines = items
    .map((i) => `• ${i.name} (${i.brand}) x${i.quantity} — ${formatNaira(i.price * i.quantity)}`)
    .join('\n')
  const msg = `Hello Jessy Luxury! I'd like to order:\n\n${lines}\n\nSubtotal: ${formatNaira(
    subtotal
  )} · Items: ${count}\n\nPlease confirm availability and delivery options.`

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDrawer(false)} />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-stone-800 bg-stone-950 shadow-2xl">
        <div className="flex items-center justify-between border-b border-stone-800 px-6 py-5">
          <h2 className="font-display text-xl text-stone-100">
            Your Cart <span className="text-amber-400">({count})</span>
          </h2>
          <button onClick={() => setDrawer(false)} className="p-1 text-stone-400 hover:text-stone-100" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
            <div className="rounded-full bg-stone-900 p-5 text-stone-500">
              <ShoppingBag size={26} />
            </div>
            <p className="text-sm text-stone-400">Your cart is empty.</p>
            <button
              onClick={() => setDrawer(false)}
              className="rounded-full bg-amber-500 px-6 py-3 text-xs font-bold tracking-[0.12em] text-stone-950 transition hover:bg-amber-400"
            >
              Browse fragrances
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-6">
              {items.map((i) => (
                <div key={i.id} className="flex gap-4 rounded-2xl bg-stone-900 p-3">
                  <div className="flex h-24 w-12 shrink-0 items-center justify-center">
                    <div className="scale-[0.5] origin-center -my-4">
                      <Bottle tone={i.tone} />
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-stone-500">{i.brand}</p>
                    <p className="font-display text-base text-stone-100">{i.name}</p>
                    <p className="text-sm text-amber-300">{formatNaira(i.price)}</p>
                    <div className="mt-2 flex items-center gap-3">
                      <button
                        onClick={() => updateQty(i.id, i.quantity - 1)}
                        className="rounded-full bg-stone-800 p-1.5 text-stone-300 hover:text-white"
                        aria-label="Decrease"
                      >
                        <Minus size={13} />
                      </button>
                      <span className="w-5 text-center text-sm text-stone-100">{i.quantity}</span>
                      <button
                        onClick={() => updateQty(i.id, i.quantity + 1)}
                        className="rounded-full bg-stone-800 p-1.5 text-stone-300 hover:text-white"
                        aria-label="Increase"
                      >
                        <Plus size={13} />
                      </button>
                      <button
                        onClick={() => remove(i.id)}
                        className="ml-auto p-1 text-stone-500 hover:text-red-400"
                        aria-label="Remove"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              <button onClick={clear} className="text-xs text-stone-500 underline hover:text-red-400">
                Clear cart
              </button>
            </div>

            <div className="border-t border-stone-800 px-6 py-6">
              <div className="flex items-center justify-between">
                <span className="text-xs tracking-[0.12em] text-stone-400">SUBTOTAL</span>
                <span className="font-display text-2xl text-stone-100">{formatNaira(subtotal)}</span>
              </div>
              <p className="mt-1 text-[10px] text-stone-500">Delivery calculated after you confirm on WhatsApp.</p>
              <a
                href={wa(msg)}
                target="_blank"
                rel="noreferrer"
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-4 text-sm font-bold text-white transition hover:bg-green-500"
              >
                <MessageCircle size={18} /> ORDER VIA WHATSAPP
              </a>
              <p className="mt-3 text-center text-[11px] text-stone-500">We confirm availability &amp; delivery personally.</p>
            </div>
          </>
        )}
      </aside>
    </div>
  )
}
