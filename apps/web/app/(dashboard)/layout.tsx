'use client'
import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { Topbar } from '@/components/dashboard/Topbar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { isAuthenticated, accessToken } = useAuthStore()
  const socketRef = useRef<any>(null)

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login')
    }
  }, [isAuthenticated, router])

  // Initialize Socket.IO connection for real-time updates
  useEffect(() => {
    if (!isAuthenticated || !accessToken) return

    let socket: any = null

    const initSocket = async () => {
      try {
        const { io } = await import('socket.io-client')
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
        const baseUrl = apiUrl.replace('/api', '')

        socket = io(`${baseUrl}/inbox`, {
          auth: { token: accessToken },
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: 10,
          reconnectionDelay: 2000,
        })

        socket.on('connect', () => {
          console.log('[WS] Connected to inbox namespace')
        })

        socket.on('disconnect', (reason: string) => {
          console.log('[WS] Disconnected:', reason)
        })

        socket.on('error', (err: any) => {
          console.error('[WS] Error:', err)
        })

        // Listen for real-time events
        socket.on('message:new', (data: any) => {
          // Could dispatch to a global store or show a toast
          console.log('[WS] New message:', data)
        })

        socket.on('message:update', (data: any) => {
          console.log('[WS] Message updated:', data)
        })

        socket.on('conversation:update', (data: any) => {
          console.log('[WS] Conversation updated:', data)
        })

        socket.on('notification', (data: any) => {
          console.log('[WS] Notification:', data)
        })

        socketRef.current = socket
      } catch (err) {
        console.warn('[WS] Socket.IO client not available:', err)
      }
    }

    initSocket()

    return () => {
      if (socket) {
        socket.disconnect()
        socketRef.current = null
      }
    }
  }, [isAuthenticated, accessToken])

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
