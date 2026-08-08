import './globals.css'
import type { Metadata } from 'next'
export const metadata: Metadata={title:'Jessy Luxury Fragrance | Smell Expensive. Feel Unforgettable.',description:'Curated Arabic, designer and everyday luxury fragrances from Jessy Luxury Fragrance.',metadataBase:new URL('https://jessyluxuryfragrance.com')}
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
