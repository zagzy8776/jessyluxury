import type { Config } from 'tailwindcss'
const config: Config = {content:['./app/**/*.{js,ts,jsx,tsx,mdx}','./components/**/*.{js,ts,jsx,tsx,mdx}'],theme:{extend:{fontFamily:{display:['Georgia','serif'],sans:['Arial','sans-serif']},colors:{ink:'#0D0B0A',ivory:'#F7F3EA',champagne:'#C9A35D',taupe:'#B9AA98'}}},plugins:[]}
export default config
