import { createFAQSchema } from '@/lib/seo-metadata'

const deliveryFAQs = [
  { question: 'How fast is delivery?', answer: 'Owerri deliveries usually arrive the same day. Waybill dispatch goes out the same day for morning orders, and other cities typically arrive within 1–3 days depending on the park route.' },
  { question: 'Do you deliver outside Nigeria?', answer: 'We currently deliver within Nigeria only. For international orders, send us a message and we will check what is possible.' },
  { question: 'What if my perfume is damaged in transit?', answer: 'Send us photos within 24 hours of delivery and we will make it right — replacement or refund.' },
]

const faqSchema = createFAQSchema(deliveryFAQs)

export default function DeliveryLayout({
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
