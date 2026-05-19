'use client'

import React, { useState } from 'react'
import { Card, CardContent } from '@repo/ui/components/card'
import { Button } from '@repo/ui/components/button'
import { Badge } from '@repo/ui/components/badge'
import { 
  LifeBuoy, 
  Search, 
  Plus,
  MessageSquare,
  Clock,
  AlertCircle,
  CheckCircle2
} from 'lucide-react'

const mockTickets = [
  { id: 'TK-001', tenant: 'Acme Corp', subject: 'WhatsApp connection failing', status: 'OPEN', priority: 'HIGH', created: '2h ago' },
  { id: 'TK-002', tenant: 'TechStart', subject: 'Billing discrepancy on invoice', status: 'IN_PROGRESS', priority: 'MEDIUM', created: '5h ago' },
  { id: 'TK-003', tenant: 'ShopEasy', subject: 'AI replies not working correctly', status: 'OPEN', priority: 'HIGH', created: '1d ago' },
  { id: 'TK-004', tenant: 'FoodHub', subject: 'Need help with campaign setup', status: 'RESOLVED', priority: 'LOW', created: '2d ago' },
  { id: 'TK-005', tenant: 'RetailMax', subject: 'Team invitation emails not sending', status: 'IN_PROGRESS', priority: 'MEDIUM', created: '3d ago' },
]

const statusConfig: Record<string, { color: string; icon: any }> = {
  OPEN: { color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', icon: AlertCircle },
  IN_PROGRESS: { color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: Clock },
  RESOLVED: { color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: CheckCircle2 },
}

const priorityColors: Record<string, string> = {
  LOW: 'text-zinc-400',
  MEDIUM: 'text-yellow-400',
  HIGH: 'text-red-400',
  CRITICAL: 'text-red-500',
}

export default function TicketsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = mockTickets.filter(t => {
    const matchesSearch = t.subject.toLowerCase().includes(search.toLowerCase()) || t.tenant.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Support Tickets</h1>
          <p className="text-zinc-500 mt-1">Manage tenant support requests.</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tickets..."
            className="w-full bg-[#111113] border border-white/5 rounded-xl pl-10 pr-4 py-3 text-white outline-none focus:border-indigo-500/50 text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[#111113] border border-white/5 rounded-xl px-4 py-3 text-white outline-none text-sm appearance-none min-w-[140px]"
        >
          <option value="all" className="bg-[#111113]">All Status</option>
          <option value="OPEN" className="bg-[#111113]">Open</option>
          <option value="IN_PROGRESS" className="bg-[#111113]">In Progress</option>
          <option value="RESOLVED" className="bg-[#111113]">Resolved</option>
        </select>
      </div>

      <Card className="bg-[#111113] border-white/5 rounded-2xl overflow-hidden">
        <CardContent className="p-0 divide-y divide-white/5">
          {filtered.map((ticket) => {
            const status = statusConfig[ticket.status] || statusConfig.OPEN
            const StatusIcon = status.icon
            return (
              <div key={ticket.id} className="flex items-center gap-4 p-5 hover:bg-white/[0.02] transition-colors cursor-pointer group">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-zinc-400 group-hover:text-white transition-colors">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-mono text-zinc-600">{ticket.id}</span>
                    <span className="text-[10px] text-zinc-600">•</span>
                    <span className="text-xs text-zinc-400">{ticket.tenant}</span>
                  </div>
                  <p className="text-sm font-medium text-white truncate">{ticket.subject}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${priorityColors[ticket.priority]}`}>
                    {ticket.priority}
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${status.color}`}>
                    <StatusIcon className="w-3 h-3" />
                    {ticket.status.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-zinc-500 min-w-[60px] text-right">{ticket.created}</span>
                </div>
              </div>
            )
          })}
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <LifeBuoy className="w-12 h-12 text-zinc-600 mb-4" />
              <p className="text-zinc-400 font-medium">No tickets found</p>
              <p className="text-zinc-600 text-sm mt-1">All clear!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
