'use client'

import React, { useState } from 'react'
import { Card, CardContent } from '@repo/ui/components/card'
import { Button } from '@repo/ui/components/button'
import { Badge } from '@repo/ui/components/badge'
import { 
  Receipt, 
  Search, 
  Download, 
  Filter,
  ChevronLeft,
  ChevronRight,
  ExternalLink
} from 'lucide-react'

const mockInvoices = [
  { id: 'INV-2024-001', tenant: 'Acme Corp', amount: '₹4,999', status: 'PAID', gateway: 'Stripe', date: '2024-05-01' },
  { id: 'INV-2024-002', tenant: 'TechStart Inc', amount: '₹9,999', status: 'PAID', gateway: 'Razorpay', date: '2024-05-01' },
  { id: 'INV-2024-003', tenant: 'ShopEasy', amount: '₹2,499', status: 'PENDING', gateway: 'Stripe', date: '2024-05-02' },
  { id: 'INV-2024-004', tenant: 'FoodHub', amount: '₹4,999', status: 'OVERDUE', gateway: 'Razorpay', date: '2024-04-28' },
  { id: 'INV-2024-005', tenant: 'RetailMax', amount: '₹19,999', status: 'PAID', gateway: 'Stripe', date: '2024-05-03' },
  { id: 'INV-2024-006', tenant: 'DesignPro', amount: '₹4,999', status: 'PAID', gateway: 'PayPal', date: '2024-05-03' },
  { id: 'INV-2024-007', tenant: 'MediaBuzz', amount: '₹9,999', status: 'REFUNDED', gateway: 'Stripe', date: '2024-04-25' },
]

const statusColors: Record<string, string> = {
  PAID: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  PENDING: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  OVERDUE: 'bg-red-500/10 text-red-400 border-red-500/20',
  REFUNDED: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
}

export default function InvoicesPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = mockInvoices.filter(inv => {
    const matchesSearch = inv.tenant.toLowerCase().includes(search.toLowerCase()) || inv.id.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Invoices</h1>
          <p className="text-zinc-500 mt-1">Manage and track all platform invoices.</p>
        </div>
        <Button variant="outline" className="bg-white/5 border-white/10 hover:bg-white/10 rounded-xl gap-2">
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoices..."
            className="w-full bg-[#111113] border border-white/5 rounded-xl pl-10 pr-4 py-3 text-white outline-none focus:border-indigo-500/50 text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[#111113] border border-white/5 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500/50 text-sm appearance-none min-w-[140px]"
        >
          <option value="all" className="bg-[#111113]">All Status</option>
          <option value="PAID" className="bg-[#111113]">Paid</option>
          <option value="PENDING" className="bg-[#111113]">Pending</option>
          <option value="OVERDUE" className="bg-[#111113]">Overdue</option>
          <option value="REFUNDED" className="bg-[#111113]">Refunded</option>
        </select>
      </div>

      <Card className="bg-[#111113] border-white/5 rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-[10px] font-bold uppercase tracking-wider text-zinc-500 p-4">Invoice ID</th>
                <th className="text-left text-[10px] font-bold uppercase tracking-wider text-zinc-500 p-4">Tenant</th>
                <th className="text-left text-[10px] font-bold uppercase tracking-wider text-zinc-500 p-4">Amount</th>
                <th className="text-left text-[10px] font-bold uppercase tracking-wider text-zinc-500 p-4">Status</th>
                <th className="text-left text-[10px] font-bold uppercase tracking-wider text-zinc-500 p-4">Gateway</th>
                <th className="text-left text-[10px] font-bold uppercase tracking-wider text-zinc-500 p-4">Date</th>
                <th className="text-left text-[10px] font-bold uppercase tracking-wider text-zinc-500 p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((inv) => (
                <tr key={inv.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-4 text-sm font-mono text-indigo-400">{inv.id}</td>
                  <td className="p-4 text-sm text-white font-medium">{inv.tenant}</td>
                  <td className="p-4 text-sm text-white font-semibold tabular-nums">{inv.amount}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${statusColors[inv.status]}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-zinc-400">{inv.gateway}</td>
                  <td className="p-4 text-sm text-zinc-400 tabular-nums">{inv.date}</td>
                  <td className="p-4">
                    <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white h-8 px-2">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Receipt className="w-12 h-12 text-zinc-600 mb-4" />
              <p className="text-zinc-400 font-medium">No invoices found</p>
              <p className="text-zinc-600 text-sm mt-1">Try adjusting your search or filters</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
