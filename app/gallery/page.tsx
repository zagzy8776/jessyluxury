import Bottle from '@/components/Bottle'

const tiles: { label: string; tone: string; note: string }[] = [
  { label: 'Oud collection', tone: 'oud', note: 'Deep & resinous' },
  { label: 'Fresh daily picks', tone: 'fresh', note: 'Crisp & clean' },
  { label: 'Sweet moments', tone: 'sweet', note: 'Warm & playful' },
  { label: 'Signature amber', tone: 'amber', note: 'Golden & iconic' },
  { label: 'Perfume oils', tone: 'rose', note: 'Intimate luxury' },
  { label: 'Musk & soft', tone: 'musk', note: 'Velvety finish' },
  { label: 'Pistachio dream', tone: 'pistachio', note: 'Creamy gourmand' },
  { label: 'Smoke & leather', tone: 'smoke', note: 'Bold character' },
]

export default function GalleryPage() {
  return (
    <main className="bg-stone-950">
      <section className="relative overflow-hidden border-b border-stone-800">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(201,163,93,0.14),transparent_60%)]" />
        <div className="grain absolute inset-0" />
        <div className="relative mx-auto max-w-7xl px-6 py-16 text-center lg:px-8 lg:py-20">
          <p className="text-[10px] font-bold tracking-[0.26em] text-amber-400">THE WORLD OF JESSY</p>
          <h1 className="mt-3 font-display text-5xl text-stone-50 sm:text-6xl">Gallery</h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-stone-400">
            Every bottle we carry is chosen to look as good as it smells. This is a preview of
            the world you are stepping into. Product photography coming soon.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {tiles.map((t, i) => (
            <div
              key={t.label}
              className={`group relative flex aspect-[4/5] flex-col items-center justify-center overflow-hidden rounded-2xl border border-stone-800 bg-gradient-to-b from-stone-800/70 to-stone-950 transition hover:border-amber-500/50 ${
                i % 3 === 1 ? 'md:translate-y-6' : ''
              }`}
            >
              <div className="grain absolute inset-0" />
              <Bottle tone={t.tone} className="scale-90 transition duration-700 group-hover:scale-100" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-stone-950/95 to-transparent p-4">
                <p className="font-display text-lg text-stone-100">{t.label}</p>
                <p className="text-[10px] tracking-[0.14em] text-stone-500">{t.note}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 flex items-center justify-center">
          <div className="relative flex h-64 w-full max-w-3xl items-center justify-center overflow-hidden rounded-3xl border border-stone-800 bg-gradient-to-br from-stone-800 via-stone-900 to-stone-950">
            <div className="grain absolute inset-0" />
            <div className="absolute h-56 w-56 rounded-full bg-amber-500/10 blur-3xl" />
            <img src="/logo.png.jpeg" alt="Jessy Luxury" className="relative h-32 w-auto object-contain drop-shadow-2xl" />
          </div>
        </div>
      </section>
    </main>
  )
}