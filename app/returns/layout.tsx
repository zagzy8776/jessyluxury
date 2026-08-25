import { createFAQSchema } from '@/lib/seo-metadata'

const returnsFAQs = [
  { question: 'Can I return an opened perfume?', answer: 'Due to hygiene and fragrance integrity standards, opened or sprayed perfume bottles cannot be returned for change of mind. Unopened, sealed boxes may be exchanged within 48 hours of delivery.' },
  { question: 'What if my perfume arrives damaged?', answer: 'If your perfume arrives broken or damaged during transit, please take unboxing photos or video within 24 hours of delivery and send them to us on WhatsApp. We will immediately issue a replacement or full refund.' },
  { question: 'How do I request an exchange?', answer: 'Message our WhatsApp support team with your Order # (e.g. JL-849201) and item photo to start an exchange. We process exchanges within 48 hours.' },
]

const faqSchema = createFAQSchema(returnsFAQs)

export default function ReturnsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqSchema),
        }}
      />
      {children}
    </>
  )
}
