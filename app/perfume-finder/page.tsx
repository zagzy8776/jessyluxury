'use client'
import { useState } from 'react'
import { ArrowLeft, ArrowRight, MessageCircle, RotateCcw, Sparkles } from 'lucide-react'
import { wa } from '@/lib/site'

const STEPS = [
  {
    key: 'gender',
    title: 'Who is the scent for?',
    options: ['Female', 'Male', 'Unisex'],
  },
  {
    key: 'budget',
    title: 'What is your budget?',
    options: ['Under ₦20,000', '₦20,000 – ₦50,000', '₦50,000+'],
  },
  {
    key: 'mood',
    title: 'Which mood speaks to you?',
    options: ['Sweet', 'Fresh', 'Oud', 'Floral', 'Woody', 'Musk'],
  },
  {
    key: 'occasion',
    title: 'When will you wear it most?',
    options: ['Everyday', 'Office', 'Date night', 'Gift', 'Event'],
  },
  {
    key: 'strength',
    title: 'How strong should the scent be?',
    options: ['Soft & intimate', 'Moderate', 'Strong & long-lasting'],
  },
]

export default function PerfumeFinderPage() {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})

  const current = STEPS[step]
  const chosen = answers[current.key]

  const next = () => {
    if (step < STEPS.length - 1) setStep(step + 1)
  }
  const back = () => {
    if (step > 0) setStep(step - 1)
  }
  const reset = () => {
    setStep(0)
    setAnswers({})
  }

  const msg = `Hello Jessy Luxury! I did the perfume finder quiz.\n\n• For: ${answers.gender || '—'}\n• Budget: ${answers.budget || '—'}\n• Mood: ${answers.mood || '—'}\n• Occasion: ${answers.occasion || '—'}\n• Strength: ${answers.strength || '—'}\n\nPlease recommend the perfect scent for me.`

  return (
    <main className="relative bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <div className="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_at_top,rgba(201,163,93,0.14),transparent_60%)]" />
      <section className="relative mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center px-6 py-16 lg:px-8">
        <p className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-[10px] font-bold tracking-[0.2em] text-amber-500">
          <Sparkles size={13} /> PERFUME FINDER
        </p>
        <h1 className="mt-5 text-center font-display text-5xl font-bold text-[var(--text-primary)] sm:text-6xl">Find your signature scent.</h1>

        <div className="mt-8 flex w-full items-center gap-2">
          {STEPS.map((s, i) => (
            <span
              key={s.key}
              className={`h-1.5 flex-1 rounded-full transition ${i <= step ? 'bg-amber-500' : 'bg-[var(--border)]'}`}
            />
          ))}
        </div>
        <p className="mt-3 w-full text-right text-[11px] tracking-[0.14em] text-[var(--text-muted)] font-mono font-bold">
          STEP {step + 1} / {STEPS.length}
        </p>

        <div className="mt-6 w-full">
          <h2 className="text-center font-display text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">{current.title}</h2>
          <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {current.options.map((opt) => (
              <button
                key={opt}
                onClick={() => {
                  setAnswers({ ...answers, [current.key]: opt })
                  next()
                }}
                className={`rounded-2xl border px-5 py-5 text-sm font-bold transition shadow-sm ${
                  chosen === opt
                    ? 'border-amber-500 bg-amber-500/15 text-amber-600'
                    : 'border-[var(--border)] bg-[var(--card-bg)] text-[var(--text-secondary)] hover:border-amber-500/50 hover:text-amber-500'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-10 flex w-full items-center justify-between">
          <button
            onClick={back}
            disabled={step === 0}
            className="flex items-center gap-1 text-xs font-bold text-[var(--text-secondary)] hover:text-amber-500 disabled:opacity-30"
          >
            <ArrowLeft size={16} /> Previous
          </button>
          <button
            onClick={reset}
            className="flex items-center gap-1 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <RotateCcw size={14} /> Start Over
          </button>
        </div>

        {step === STEPS.length - 1 && chosen && (
          <div className="mt-10 w-full rounded-3xl border border-amber-500/30 bg-[var(--card-bg)] p-8 text-center shadow-md">
            <h3 className="font-display text-2xl font-bold text-[var(--text-primary)]">Your Scent Profile Complete!</h3>
            <p className="mt-2 text-xs text-[var(--text-secondary)] font-medium">Send your answers to Jessy Luxury on WhatsApp for direct personal recommendations.</p>
            <a
              href={wa(msg)}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-8 py-4 text-xs font-bold tracking-widest text-white transition hover:bg-emerald-500 shadow-md"
            >
              <MessageCircle size={16} /> GET RECOMMENDATIONS ON WHATSAPP
            </a>
          </div>
        )}
      </section>
    </main>
  )
}