import { redirect } from 'next/navigation'

export default function AdminLayoutRedirect({ children }: { children: React.ReactNode }) {
  redirect('/')
}
