// Central site configuration for Jessy Luxury.
// IMPORTANT: Set WHATSAPP_NUMBER in Vercel env vars (country code + number, no +)
// e.g. WHATSAPP_NUMBER=2348123456789
export const site = {
  brand: 'Jessy Luxury',
  brandUpper: 'JESSY LUXURY',
  tagline: 'Smell expensive. Feel unforgettable.',
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP || '2348000000000', // set in Vercel env
  instagram: 'https://instagram.com/jessyluxury',
  location: '57 MCC Road, Opposite Ihechiuwa Junction, Owerri, Imo State, Nigeria',
  locationShort: 'Owerri, Imo State',
  phone: '+234 800 000 0000', // update with real phone number
  email: 'ijeomaasiegbu963@gmail.com',
  hours: 'Mon – Sat, 9am – 7pm',
  googleMaps: 'https://maps.google.com/?q=57+MCC+Road+Owerri+Imo+State+Nigeria',
  describers: [
    'Original designer & Arabian fragrances',
    'Oil perfumes, body mists & home scents',
    'Gift-ready sets with WhatsApp ordering',
  ],
}

export const wa = (text: string) =>
  `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(text)}`