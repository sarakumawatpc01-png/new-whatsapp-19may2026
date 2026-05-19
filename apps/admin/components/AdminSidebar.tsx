'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  LayoutDashboard, 
  Building2, 
  CreditCard, 
  Layers, 
  Brain, 
  MessageSquare,
  Settings,
  ShieldCheck,
  ScrollText,
  Flag,
  Network,
  Receipt,
  ArrowLeftRight,
  Tag,
  FileText,
  Mail,
  Key,
  LifeBuoy,
  LogOut
} from 'lucide-react'
import { cn } from '@repo/ui/utils'
import { useAuthStore } from '@/store/authStore'

const navSections = [
  {
    title: 'OVERVIEW',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    ]
  },
  {
    title: 'TENANTS',
    items: [
      { name: 'All Tenants', href: '/tenants', icon: Building2 },
      { name: 'Resellers', href: '/resellers', icon: Network },
    ]
  },
  {
    title: 'PLATFORM',
    items: [
      { name: 'Plans & Pricing', href: '/plans', icon: CreditCard },
      { name: 'Feature Flags', href: '/feature-flags', icon: Flag },
      { name: 'AI Config', href: '/ai-config', icon: Brain },
    ]
  },
  {
    title: 'CONTENT',
    items: [
      { name: 'Pages / CMS', href: '/cms', icon: FileText },
      { name: 'Email Templates', href: '/email-templates', icon: Mail },
    ]
  },
  {
    title: 'FINANCE',
    items: [
      { name: 'Invoices', href: '/invoices', icon: Receipt },
      { name: 'Transactions', href: '/transactions', icon: ArrowLeftRight },
      { name: 'Coupons', href: '/coupons', icon: Tag },
    ]
  },
  {
    title: 'SYSTEM',
    items: [
      { name: 'Settings', href: '/settings', icon: Settings },
      { name: 'WhatsApp Config', href: '/whatsapp-config', icon: MessageSquare },
      { name: 'API Keys', href: '/api-keys', icon: Key },
      { name: 'Audit Logs', href: '/audit-logs', icon: ScrollText },
    ]
  },
  {
    title: 'SUPPORT',
    items: [
      { name: 'Tickets', href: '/tickets', icon: LifeBuoy },
    ]
  },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  return (
    <div className="w-64 flex flex-col bg-[#0a0a0f] border-r border-white/5 h-full">
      <div className="p-5">
        <div className="flex items-center gap-3 px-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
            SuperAdmin
          </span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-6 overflow-y-auto custom-scrollbar">
        {navSections.map((section) => (
          <div key={section.title}>
            <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-600">
              {section.title}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "group flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                      isActive 
                        ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" 
                        : "text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent"
                    )}
                  >
                    <item.icon className={cn(
                      "w-4 h-4 transition-colors shrink-0",
                      isActive ? "text-indigo-400" : "text-zinc-500 group-hover:text-zinc-300"
                    )} />
                    <span className="truncate">{item.name}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-white/5 space-y-3">
        {/* System Status */}
        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">System Online</span>
          </div>
        </div>
        
        {/* Admin Info + Logout */}
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 text-xs font-bold">
            {user?.name?.[0]?.toUpperCase() || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name || 'Admin'}</p>
            <p className="text-[10px] text-zinc-500 truncate">{user?.email}</p>
          </div>
          <button 
            onClick={handleLogout}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-400/5 transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
