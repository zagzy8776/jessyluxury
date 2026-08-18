// Central site configuration for Jessy Luxury.
const rawWa =
  process.env.NEXT_PUBLIC_WHATSAPP ||
  process.env.WHATSAPP_NUMBER ||
  '2347032672097'

export const site = {
  brand: 'Jessy Luxury',
  brandUpper: 'JESSY LUXURY',
  tagline: 'Smell expensive. Feel unforgettable.',
  whatsapp: rawWa.replace(/\D/g, ''), // Ensure clean numbers only
  instagram: 'https://www.instagram.com/jessyluxuryfragrance.ng?igsh=MWd5M2c0ZGFtYmQwaA%3D%3D&utm_source=qr',
  instagramHandle: '@jessyluxuryfragrance.ng',
  tiktok: 'https://www.tiktok.com/@officialjessysfragrance?_r=1&_t=ZS-98p5O93tey8',
  tiktokHandle: '@officialjessysfragrance',
  location: '57 MCC Road, Opposite Ihechiuwa Junction, Owerri, Imo State, Nigeria',
  locationShort: 'Owerri, Imo State',
  phone: '+234 703 267 2097',
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