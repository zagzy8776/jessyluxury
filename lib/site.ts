// Central site configuration for Jessy Luxury.
// NOTE: replace the placeholder WhatsApp number with the client's real number.
export const site = {
  brand: 'Jessy Luxury',
  brandUpper: 'JESSY LUXURY',
  tagline: 'Smell expensive. Feel unforgettable.',
  whatsapp: '2340000000000', // <-- TODO: replace with the real WhatsApp number (country code + number, no +)
  instagram: 'https://instagram.com/',
  location: 'Owerri, Imo State, Nigeria',
  phone: '+234 000 000 0000', // <-- TODO
  email: 'hello@jessyluxury.com', // <-- TODO
  hours: 'Mon – Sat, 9am – 7pm',
  describers: [
    'Original designer & Arabian fragrances',
    'Oil perfumes, body mists & home scents',
    'Gift-ready sets with WhatsApp ordering',
  ],
}

export const wa = (text: string) =>
  `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(text)}`