const GLASS: Record<string, string> = {
  amber: 'linear-gradient(115deg,#241a0e,#8a5a13 38%,#d9a441 55%,#241a0e)',
  pistachio: 'linear-gradient(115deg,#1c2417,#8a9a5f 45%,#3f5030)',
  smoke: 'linear-gradient(115deg,#141414,#5a5a5a 45%,#151515)',
  rose: 'linear-gradient(115deg,#2a1218,#a05a5a 45%,#4a1620)',
  oud: 'linear-gradient(115deg,#1a1208,#6b3d12 45%,#241405)',
  fresh: 'linear-gradient(115deg,#123b44,#5aa0a0 45%,#123038)',
  sweet: 'linear-gradient(115deg,#2e1a0e,#c98a3d 45%,#3a2412)',
  musk: 'linear-gradient(115deg,#241d2e,#8a7aa0 45%,#2e2540)',
}

export default function Bottle({ tone = 'amber', className = '' }: { tone?: string; className?: string }) {
  return (
    <div className={`relative select-none ${className}`} style={{ width: 96, height: 200 }} aria-hidden>
      <div
        className="absolute left-[32px] top-0 z-20 h-8 w-9 rounded-[4px_4px_2px_2px]"
        style={{ background: 'linear-gradient(90deg,#1a1a1a,#45403a,#1a1a1a)', boxShadow: '0 4px 10px rgba(0,0,0,0.5)' }}
      />
      <div className="absolute left-[40px] top-[26px] z-10 h-6 w-5" style={{ background: 'linear-gradient(90deg,#555,#999,#555)' }} />
      <div
        className="absolute left-[6px] top-[48px] h-[140px] w-[84px] rounded-[14px_14px_18px_18px]"
        style={{
          background: GLASS[tone] || GLASS.amber,
          boxShadow: 'inset 8px 0 12px rgba(255,255,255,0.14), inset -10px 0 16px rgba(0,0,0,0.5), 0 18px 26px -12px rgba(0,0,0,0.6)',
        }}
      />
      <div
        className="absolute left-[16px] right-[16px] top-[92px] border border-brand-gold/50 py-1.5 text-center"
        style={{ color: '#d9a441', fontFamily: 'var(--font-display), Georgia, serif', fontSize: 9, letterSpacing: '0.14em' }}
      >
        JESSY
        <span style={{ display: 'block', fontSize: 5.5, letterSpacing: '0.24em' }}>LUXURY</span>
      </div>
    </div>
  )
}
