import type { Config } from 'tailwindcss'
const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Cormorant Garamond', 'Georgia', 'serif'],
      },
      colors: {
        brand: {
          gold: '#C9A35D',
          'gold-light': '#E3C989',
          'gold-dark': '#A9823F',
          plum: '#4F2D7F',
          'plum-deep': '#3B215F',
          'plum-soft': '#F2ECF9',
          ivory: '#FAF7F1',
          charcoal: '#1C1917',
        },
      },
      boxShadow: {
        card: '0 2px 16px -6px rgba(28,25,23,0.08)',
        'card-hover': '0 18px 40px -16px rgba(28,25,23,0.18)',
        plum: '0 12px 28px -12px rgba(79,45,127,0.45)',
      },
      keyframes: {
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(22px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          from: { backgroundPosition: '-400px 0' },
          to: { backgroundPosition: '400px 0' },
        },
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        'slide-up': 'slide-up 0.25s ease-out forwards',
        'fade-up': 'fade-up 0.7s cubic-bezier(0.16,1,0.3,1) both',
        shimmer: 'shimmer 1.4s infinite linear',
        marquee: 'marquee 22s linear infinite',
      },
    },
  },
  plugins: [],
}
export default config
