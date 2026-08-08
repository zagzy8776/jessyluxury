'use client'
import { useMemo, useState } from 'react'
import { ArrowRight, Heart, Instagram, Menu, Search, ShoppingBag, X } from 'lucide-react'

const products = [
  { id: 1, name: 'Khair Pistachio', brand: 'Paris Corner', price: 32000, tag: 'BESTSELLER', tone: 'pistachio', notes: 'Pistachio · Cream · Vanilla', desc: 'A creamy gourmand scent with a playful, luxurious finish.' },
  { id: 2, name: 'Supremacy Collector', brand: 'Afnan', price: 58000, tag: 'SIGNATURE', tone: 'amber', notes: 'Fruity · Woody · Amber', desc: 'Polished, confident and made to leave a memorable trail.' },
  { id: 3, name: 'Invicto Legend', brand: 'Fragrance World', price: 38000, tag: 'NEW', tone: 'smoke', notes: 'Fresh · Aromatic · Woody', desc: 'A bold everyday fragrance with a clean, energetic character.' },
  { id: 4, name: 'Almas Perfume Oil', brand: 'Jessy Selection', price: 12000, tag: 'OIL', tone: 'rose', notes: 'Warm · Floral · Musk', desc: 'An intimate oil blend designed for close-to-skin luxury.' },
]

function Bottle({ tone = 'amber' }: { tone?: string }) {
  return <div className={`bottle ${tone}`}><div className="cap" /><div className="neck" /><div className="glass"><div className="label">JESSY<br /><span>LUXURY</span></div></div></div>
}

function ProductCard({ p }: { p: any }) {
  const [liked, setLiked] = useState(false)
  return (
    <article className="group relative">
      <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-gradient-to-br from-zinc-100 to-zinc-200 flex items-center justify-center">
        <span className="absolute left-3 top-3 z-10 text-[9px] tracking-[0.2em] font-bold text-zinc-800 bg-white/80 backdrop-blur px-2 py-1 rounded">{p.tag}</span>
        <button onClick={() => setLiked(!liked)} className="absolute right-3 top-3 z-10 rounded-full bg-white/90 p-2 backdrop-blur shadow-sm hover:scale-110 transition">
          <Heart size={14} fill={liked ? '#0D0B0A' : 'none'} className={liked ? 'text-zinc-900' : 'text-zinc-600'} />
        </button>
        <div className="scale-[0.85] transition duration-700 group-hover:scale-[0.95]">
          <Bottle tone={p.tone} />
        </div>
        <div className="absolute inset-x-3 bottom-3 flex translate-y-2 justify-center opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100">
          <a href={`https://wa.me/?text=${encodeURIComponent('Hello Jessy Luxury, I want to order ' + p.name)}`} className="w-full bg-zinc-900 text-white text-center py-3 text-[10px] tracking-[0.15em] rounded-lg font-medium hover:bg-zinc-800 transition">
            ORDER VIA WHATSAPP
          </a>
        </div>
      </div>
      <div className="pt-4">
        <p className="text-[9px] uppercase tracking-[0.18em] text-zinc-500">{p.brand}</p>
        <h3 className="serif text-lg mt-1 text-zinc-900">{p.name}</h3>
        <p className="text-xs text-zinc-600 mt-1.5">{p.notes}</p>
        <p className="mt-2.5 font-semibold text-zinc-900">₦{p.price.toLocaleString()}</p>
      </div>
    </article>
  )
}

export default function Home() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const filtered = useMemo(() => products.filter(p => (p.name + p.brand + p.notes).toLowerCase().includes(query.toLowerCase())), [query])

  return (
    <main className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="fixed top-0 z-50 w-full border-b border-zinc-200 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 lg:px-8">
          <button className="lg:hidden p-2" onClick={() => setOpen(!open)}>
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
          <a href="#" className="flex items-center gap-2">
            <img src="/logo.png.jpeg" alt="Jessy Luxury" className="h-8 w-auto" />
          </a>
          <nav className="hidden items-center gap-8 lg:flex text-[10px] tracking-[0.15em] font-medium text-zinc-700">
            <a href="#shop" className="hover:text-zinc-900 transition">SHOP</a>
            <a href="#collections" className="hover:text-zinc-900 transition">COLLECTIONS</a>
            <a href="#story" className="hover:text-zinc-900 transition">ABOUT</a>
            <a href="#finder" className="hover:text-zinc-900 transition">FIND YOUR SCENT</a>
          </nav>
          <div className="flex items-center gap-3">
            <button onClick={() => document.getElementById('search')?.focus()} className="p-2 hover:bg-zinc-100 rounded-full transition">
              <Search size={18} className="text-zinc-700" />
            </button>
            <a href="#shop" className="p-2 hover:bg-zinc-100 rounded-full transition relative">
              <ShoppingBag size={18} className="text-zinc-700" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-amber-600 rounded-full"></span>
            </a>
          </div>
        </div>
        {open && (
          <div className="lg:hidden border-t border-zinc-200 px-6 py-6 space-y-4 text-sm">
            <a className="block py-2 text-zinc-700 hover:text-zinc-900" href="#shop" onClick={() => setOpen(false)}>SHOP</a>
            <a className="block py-2 text-zinc-700 hover:text-zinc-900" href="#collections" onClick={() => setOpen(false)}>COLLECTIONS</a>
            <a className="block py-2 text-zinc-700 hover:text-zinc-900" href="#story" onClick={() => setOpen(false)}>ABOUT</a>
            <a className="block py-2 text-zinc-700 hover:text-zinc-900" href="#finder" onClick={() => setOpen(false)}>FIND YOUR SCENT</a>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative min-h-[700px] overflow-hidden pt-[72px] bg-zinc-900 text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-800 to-amber-950/30" />
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        <div className="absolute -right-20 top-20 h-[500px] w-[500px] rounded-full bg-amber-600/20 blur-3xl" />
        <div className="relative mx-auto grid min-h-[620px] max-w-7xl items-center px-6 lg:grid-cols-2 lg:px-8">
          <div className="max-w-xl py-16 lg:py-24">
            <p className="mb-5 text-[9px] tracking-[0.35em] text-amber-400 font-semibold">JESSY LUXURY FRAGRANCE</p>
            <h1 className="serif text-5xl leading-[0.95] sm:text-6xl lg:text-[88px] text-white">
              SMELL<br /><em className="font-normal text-amber-200">EXPENSIVE.</em>
            </h1>
            <p className="mt-6 max-w-md text-sm leading-7 text-zinc-300">
              Curated Arabic, designer and everyday luxury fragrances for the moments you want to be remembered.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#shop" className="bg-amber-600 hover:bg-amber-700 px-6 py-3.5 text-[10px] font-bold tracking-[0.2em] text-white rounded-lg transition">
                SHOP THE COLLECTION
              </a>
              <a href="#finder" className="border border-white/20 hover:border-white/40 px-6 py-3.5 text-[10px] tracking-[0.2em] rounded-lg transition">
                FIND YOUR SCENT
              </a>
            </div>
          </div>
          <div className="flex justify-center lg:justify-end py-12 lg:py-0">
            <div className="relative flex h-[450px] w-[380px] items-center justify-center">
              <div className="absolute h-[340px] w-[340px] rounded-full border border-amber-500/20" />
              <div className="absolute h-[280px] w-[280px] rounded-full border border-white/10" />
              <div className="scale-[1.35]">
                <Bottle tone="amber" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Collections Section */}
      <section id="collections" className="border-b border-zinc-200 bg-white py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-[9px] tracking-[0.25em] text-amber-600 font-semibold">DISCOVER</p>
              <h2 className="serif mt-2 text-3xl sm:text-4xl text-zinc-900">Your signature scent.</h2>
            </div>
            <a href="#shop" className="hidden items-center gap-2 text-[10px] tracking-[0.18em] text-zinc-600 hover:text-zinc-900 sm:flex">
              VIEW ALL <ArrowRight size={14} />
            </a>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {['ARABIC', 'DESIGNER', 'PERFUME OILS', 'GIFT SETS'].map((x, i) => (
              <a href="#shop" key={x} className="group relative aspect-[3/4] overflow-hidden rounded-lg bg-gradient-to-br from-zinc-100 to-zinc-200">
                <div className="absolute inset-0 transition duration-700 group-hover:scale-105" style={{ background: `radial-gradient(circle at ${30 + i * 18}% ${25 + i * 10}%, rgba(217, 119, 6, 0.2), transparent 40%), linear-gradient(145deg, #fafafa, #e4e4e7)` }} />
                <div className="absolute inset-0 flex items-end p-4">
                  <span className="text-xs tracking-[0.18em] font-medium text-zinc-800">{x}</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Shop Section */}
      <section id="shop" className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end mb-12">
          <div>
            <p className="text-[9px] tracking-[0.25em] text-amber-600 font-semibold">THE EDIT</p>
            <h2 className="serif mt-2 text-3xl sm:text-4xl text-zinc-900">Customer favourites</h2>
          </div>
          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-0 top-3 text-zinc-400" />
            <input
              id="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search fragrances"
              className="w-full border-b border-zinc-300 bg-transparent py-2 pl-7 text-xs outline-none focus:border-amber-600 transition"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-4 md:gap-x-6">
          {filtered.map(p => <ProductCard key={p.id} p={p} />)}
        </div>
      </section>

      {/* Story Section */}
      <section id="story" className="bg-zinc-100 py-20">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-2 lg:px-8">
          <div className="flex items-center justify-center min-h-[380px] bg-zinc-900 rounded-2xl">
            <div className="text-center text-white px-8">
              <p className="text-[9px] tracking-[0.3em] text-amber-400 font-semibold">THE JESSY STANDARD</p>
              <p className="serif mt-5 text-4xl">Luxury is how<br /><em className="font-normal text-amber-200">you show up.</em></p>
            </div>
          </div>
          <div className="flex flex-col justify-center">
            <p className="text-[9px] tracking-[0.25em] text-amber-600 font-semibold">ABOUT JESSY LUXURY</p>
            <h2 className="serif mt-3 text-3xl leading-tight sm:text-4xl text-zinc-900">A fragrance should feel like part of your identity.</h2>
            <p className="mt-5 max-w-lg text-sm leading-7 text-zinc-600">
              From carefully selected Arabic and designer fragrances to oils and gift sets, Jessy Luxury helps you choose a scent that fits your personality, occasion and lifestyle.
            </p>
            <div className="mt-6 flex gap-6 text-[10px] tracking-[0.15em] text-zinc-500">
              <span className="font-medium text-zinc-700">AUTHENTIC SELECTION</span>
              <span className="font-medium text-zinc-700">WHATSAPP SUPPORT</span>
            </div>
          </div>
        </div>
      </section>

      {/* Finder Section */}
      <section id="finder" className="bg-zinc-900 py-20 text-white">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <p className="text-[9px] tracking-[0.3em] text-amber-400 font-semibold">NOT SURE WHAT TO CHOOSE?</p>
          <h2 className="serif mt-4 text-4xl sm:text-5xl">Find your scent.</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-zinc-400">
            Choose the mood and we'll point you toward the right part of the collection.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {['ROMANTIC', 'BOLD', 'FRESH', 'SWEET', 'ELEGANT', 'EVERYDAY'].map(x => (
              <a key={x} href="#shop" className="border border-white/10 hover:border-amber-600 hover:text-amber-400 px-5 py-3 text-[10px] tracking-[0.18em] rounded-lg transition">
                {x}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white px-6 py-14 border-t border-zinc-200">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 md:grid-cols-4">
            <div>
              <a className="serif text-lg tracking-[0.15em] text-zinc-900">JESSY LUXURY</a>
              <p className="mt-3 max-w-xs text-xs leading-6 text-zinc-500">Smell expensive. Feel unforgettable.</p>
            </div>
            <div>
              <p className="text-[10px] tracking-[0.18em] font-bold text-zinc-900">SHOP</p>
              <div className="mt-4 space-y-3 text-xs text-zinc-600">
                <a className="block hover:text-zinc-900 transition" href="#shop">All fragrances</a>
                <a className="block hover:text-zinc-900 transition" href="#collections">Collections</a>
                <a className="block hover:text-zinc-900 transition" href="#finder">Find your scent</a>
              </div>
            </div>
            <div>
              <p className="text-[10px] tracking-[0.18em] font-bold text-zinc-900">HELP</p>
              <div className="mt-4 space-y-3 text-xs text-zinc-600">
                <a className="block hover:text-zinc-900 transition" href="#">Delivery & pickup</a>
                <a className="block hover:text-zinc-900 transition" href="#">FAQ</a>
                <a className="block hover:text-zinc-900 transition" href="https://wa.me/">WhatsApp</a>
              </div>
            </div>
            <div>
              <p className="text-[10px] tracking-[0.18em] font-bold text-zinc-900">FOLLOW</p>
              <a href="#" className="mt-4 flex items-center gap-2 text-xs text-zinc-600 hover:text-zinc-900 transition">
                <Instagram size={14} /> Instagram
              </a>
            </div>
          </div>
          <div className="border-t border-zinc-200 my-8" />
          <div className="flex flex-col justify-between gap-3 text-[10px] tracking-[0.08em] text-zinc-400 sm:flex-row">
            <span>© 2026 Jessy Luxury Fragrance</span>
            <span>Designed for a luxury-first shopping experience.</span>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        .serif { font-family: Georgia, 'Times New Roman', serif; }
        .bottle { position: relative; width: 100px; height: 220px; }
        .cap { position: absolute; z-index: 3; left: 32px; top: 0; width: 36px; height: 32px; border-radius: 4px 4px 2px 2px; background: linear-gradient(90deg, #181818, #4a4a4a, #181818); box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
        .neck { position: absolute; z-index: 2; left: 40px; top: 28px; width: 20px; height: 28px; background: linear-gradient(90deg, #6b6b6b, #a3a3a3, #6b6b6b); }
        .glass { position: absolute; left: 8px; top: 52px; width: 84px; height: 155px; border-radius: 14px 14px 18px 18px; background: linear-gradient(90deg, #1a1a1a, #8B6914 40%, #d4a84b 55%, #1a1a1a); box-shadow: inset 6px 0 10px rgba(255,255,255,0.1), inset -8px 0 15px rgba(0,0,0,0.4), 0 15px 25px rgba(0,0,0,0.2); }
        .pistachio .glass { background: linear-gradient(90deg, #2d3a24, #8a9a5f, #4a5a34); }
        .smoke .glass { background: linear-gradient(90deg, #1a1a1a, #5a5a5a, #1a1a1a); }
        .rose .glass { background: linear-gradient(90deg, #3d1a24, #a05a5a, #5a1a2a); }
        .label { position: absolute; left: 12px; right: 12px; top: 60px; border: 1px solid rgba(212, 168, 75, 0.5); text-align: center; padding: 8px 2px; color: #d4a84b; font-family: Georgia, serif; font-size: 10px; letter-spacing: 0.18em; }
        .label span { font-size: 6px; letter-spacing: 0.25em; }
      `}</style>
    </main>
  )
}
