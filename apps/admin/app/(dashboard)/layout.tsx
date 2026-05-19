'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AdminSidebar } from '../../components/AdminSidebar'
import { AdminTopbar } from '../../components/AdminTopbar'
import { useAuthStore } from '../../store/authStore'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login')
    }
  }, [isAuthenticated, router])

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0a0b] text-white">
      {/* Animated Background Decor */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] opacity-50" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-violet-500/10 rounded-full blur-[100px] opacity-30" />
      </div>

      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
        <AdminTopbar />
        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
