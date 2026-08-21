'use client'

import { useState, Suspense, lazy } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import dynamic from 'next/dynamic'

// Dynamically import components with fallbacks
const BusinessProfileForm = dynamic(() => import('./components/BusinessProfileForm').then(m => m.default || m), {
  loading: () => <div className="text-gray-400">Loading Business Profile...</div>,
  ssr: false
})

const LocationsManager = dynamic(() => import('./components/LocationsManager').then(m => m.default || m), {
  loading: () => <div className="text-gray-400">Loading Locations...</div>,
  ssr: false
})

const StaffAccountsManager = dynamic(() => import('./components/StaffAccountsManager').then(m => m.default || m), {
  loading: () => <div className="text-gray-400">Loading Staff Accounts...</div>,
  ssr: false
})

const PaymentSettingsForm = dynamic(() => import('./components/PaymentSettingsForm').then(m => m.default || m), {
  loading: () => <div className="text-gray-400">Loading Payment Settings...</div>,
  ssr: false
})

const NotificationSettingsForm = dynamic(() => import('./components/NotificationSettingsForm').then(m => m.default || m), {
  loading: () => <div className="text-gray-400">Loading Notification Settings...</div>,
  ssr: false
})

const SystemDefaultsForm = dynamic(() => import('./components/SystemDefaultsForm').then(m => m.default || m), {
  loading: () => <div className="text-gray-400">Loading System Defaults...</div>,
  ssr: false
})

const ExpensesManager = dynamic(() => import('./components/ExpensesManager').then(m => m.default || m), {
  loading: () => <div className="text-gray-400">Loading Expenses...</div>,
  ssr: false
})

const PasswordChangeModal = dynamic(() => import('./components/PasswordChangeModal').then(m => m.default || m), {
  loading: () => null,
  ssr: false
})

interface AdminUser {
  id: number
  role: string
  email: string
}

export default function SettingsPage() {
  // The settings shell uses react-query but no app-level QueryClientProvider
  // exists, so provide one scoped to this page.
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <SettingsPageContent />
    </QueryClientProvider>
  )
}

function SettingsPageContent() {
  const [activeTab, setActiveTab] = useState('profile')
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  
  // Check if user is Owner
  const { data: adminUser, isLoading: isLoadingUser } = useQuery<AdminUser>({
    queryKey: ['admin-user'],
    queryFn: async () => {
      const res = await fetch('/api/admin-auth/me')
      if (!res.ok) throw new Error('Failed to fetch admin')
      return res.json()
    }
  })

  const isOwner = adminUser?.role === 'Owner'

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-950 to-black">
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Settings</h1>
            <p className="text-gray-400">Manage your business configuration and preferences</p>
          </div>
          {isOwner && (
            <Button
              onClick={() => setShowPasswordModal(true)}
              variant="outline"
              className="text-white border-gray-600 hover:bg-gray-900"
            >
              Change Password
            </Button>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-7 bg-gray-900 border border-gray-800 p-1 mb-8">
            <TabsTrigger value="profile" className="data-[state=active]:bg-purple-600">
              Profile
            </TabsTrigger>
            <TabsTrigger value="locations" className="data-[state=active]:bg-purple-600">
              Locations
            </TabsTrigger>
            <TabsTrigger value="staff" className="data-[state=active]:bg-purple-600">
              Staff
            </TabsTrigger>
            <TabsTrigger value="payment" className="data-[state=active]:bg-purple-600">
              Payment
            </TabsTrigger>
            <TabsTrigger value="notifications" className="data-[state=active]:bg-purple-600">
              Notifications
            </TabsTrigger>
            <TabsTrigger value="system" className="data-[state=active]:bg-purple-600">
              System
            </TabsTrigger>
            <TabsTrigger value="expenses" className="data-[state=active]:bg-purple-600">
              Expenses
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="bg-gray-900 border border-gray-800 rounded-lg p-8">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-bold text-white mb-6">Business Profile</h2>
              <Suspense fallback={<div className="text-gray-400">Loading...</div>}>
                <BusinessProfileForm />
              </Suspense>
            </div>
          </TabsContent>

          <TabsContent value="locations" className="bg-gray-900 border border-gray-800 rounded-lg p-8">
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Store Locations</h2>
              <Suspense fallback={<div className="text-gray-400">Loading...</div>}>
                <LocationsManager />
              </Suspense>
            </div>
          </TabsContent>

          <TabsContent value="staff" className="bg-gray-900 border border-gray-800 rounded-lg p-8">
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Staff Accounts</h2>
              <Suspense fallback={<div className="text-gray-400">Loading...</div>}>
                <StaffAccountsManager />
              </Suspense>
            </div>
          </TabsContent>

          <TabsContent value="payment" className="bg-gray-900 border border-gray-800 rounded-lg p-8">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-bold text-white mb-6">Payment Settings</h2>
              <Suspense fallback={<div className="text-gray-400">Loading...</div>}>
                <PaymentSettingsForm />
              </Suspense>
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="bg-gray-900 border border-gray-800 rounded-lg p-8">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-bold text-white mb-6">Notification Settings</h2>
              <Suspense fallback={<div className="text-gray-400">Loading...</div>}>
                <NotificationSettingsForm />
              </Suspense>
            </div>
          </TabsContent>

          <TabsContent value="system" className="bg-gray-900 border border-gray-800 rounded-lg p-8">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-bold text-white mb-6">System Defaults</h2>
              <Suspense fallback={<div className="text-gray-400">Loading...</div>}>
                <SystemDefaultsForm />
              </Suspense>
            </div>
          </TabsContent>

          <TabsContent value="expenses" className="bg-gray-900 border border-gray-800 rounded-lg p-8">
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Expenses</h2>
              <Suspense fallback={<div className="text-gray-400">Loading...</div>}>
                <ExpensesManager />
              </Suspense>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {isOwner && (
        <PasswordChangeModal
          isOpen={showPasswordModal}
          onClose={() => setShowPasswordModal(false)}
        />
      )}
    </div>
  )
}
