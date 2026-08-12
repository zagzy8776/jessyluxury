import { redirect } from 'next/navigation'

export default function OldOrdersRedirect() {
  redirect('/store-portal-jl/dashboard/orders')
}
