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
    <main className="relative bg-stone-950">
      <div className="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_at_top,rgba(201,163,93,0.14),transparent_60%)]" />
      <section className="relative mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center px-6 py-16 lg:px-8">
        <p className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-[10px] font-semibold tracking-[0.2em] text-amber-300">
          <Sparkles size={12} /> PERFUME FINDER
        </p>
        <h1 className="mt-5 text-center font-display text-5xl text-stone-50 sm:text-6xl">Find your signature scent.</h1>

        <div className="mt-8 flex w-full items-center gap-2">
          {STEPS.map((s, i) => (
            <span
              key={s.key}
              className={`h-1 flex-1 rounded-full transition ${i <= step ? 'bg-amber-500' : 'bg-stone-800'}`}
            />
          ))}
        </div>
        <p className="mt-3 w-full text-right text-[11px] tracking-[0.14em] text-stone-500">
          STEP {step + 1} / {STEPS.length}
        </p>

        <div className="mt-6 w-full">
          <h2 className="text-center font-display text-2xl text-stone-100 sm:text-3xl">{current.title}</h2>
          <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {current.options.map((opt) => (
              <button
                key={opt}
                onClick={() => {
                  setAnswers({ ...answers, [current.key]: opt })
                  next()
                }}
                className={`rounded-2xl border px-5 py-5 text-sm font-medium transition ${
                  chosen === opt
                    ? 'border-amber-500 bg-amber-500/10 text-amber-300'
                    : 'border-stone-700 text-stone-300 hover:border-amber-500/50 hover:text-amber-200'
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
            className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.1em] text-stone-400 transition enabled:hover:text-stone-100 disabled:opacity-30"
          >
            <ArrowLeft size={14} /> BACK
          </button>
          <button onClick={reset} className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.1em] text-stone-500 transition hover:text-amber-300">
            <RotateCcw size={13} /> START OVER
          </button>
        </div>

        {step === STEPS.length - 1 && chosen && (
          <div className="mt-8 w-full rounded-3xl border border-green-600/30 bg-green-600/5 p-8 text-center">
            <p className="text-xs leading-6 text-stone-300">
              Your scent profile is ready. Send it to us on WhatsApp and we will recommend the
              perfect bottle for you personally.
            </p>
            <a
              href={wa(msg)}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-green-600 px-8 py-4 text-xs font-bold tracking-[0.14em] text-white transition hover:bg-green-500"
            >
              <MessageCircle size={16} /> SEND MY SCENT PROFILE
            </a>
          </div>
        )}

        <a
          href={wa('Hello! I need help choosing a perfume.')}
          target="_blank"
          rel="noreferrer"
          className="mt-10 inline-flex items-center gap-2 text-xs font-semibold tracking-[0.1em] text-stone-400 transition hover:text-green-400"
        >
          Prefer to chat directly? Message us <ArrowRight size={14} />
        </a>
      </section>
    </main>
  )
}