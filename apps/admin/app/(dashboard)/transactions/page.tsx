'use client'

import React, { useState } from 'react'
import { Card, CardContent } from '@repo/ui/components/card'
import { Button } from '@repo/ui/components/button'
import { ArrowLeftRight, Search, Download, ArrowUpRight, ArrowDownRight } from 'lucide-react'

const mockTransactions = [
  { id: 'txn_001', tenant: 'Acme Corp', type: 'SUBSCRIPTION', amount: '+₹4,999', status: 'SUCCESS', gateway: 'Stripe', date: '2024-05-03 14:22' },
  { id: 'txn_002', tenant: 'TechStart', type: 'SUBSCRIPTION', amount: '+₹9,999', status: 'SUCCESS', gateway: 'Razorpay', date: '2024-05-03 10:15' },
  { id: 'txn_003', tenant: 'ShopEasy', type: 'REFUND', amount: '-₹2,499', status: 'PROCESSED', gateway: 'Stripe', date: '2024-05-02 16:44' },
  { id: 'txn_004', tenant: 'FoodHub', type: 'ADD_ON', amount: '+₹1,999', status: 'FAILED', gateway: 'Razorpay', date: '2024-05-02 09:30' },
  { id: 'txn_005', tenant: 'RetailMax', type: 'SUBSCRIPTION', amount: '+₹19,999', status: 'SUCCESS', gateway: 'Stripe', date: '2024-05-01 11:00' },
]

const statusColors: Record<string, string> = {
  SUCCESS: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  PROCESSED: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  FAILED: 'bg-red-500/10 text-red-400 border-red-500/20',
  PENDING: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
}

export default function TransactionsPage() {
  const [search, setSearch] = useState('')

  const filtered = mockTransactions.filter(t =>
    t.tenant.toLowerCase().includes(search.toLowerCase()) ||
    t.id.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Transactions</h1>
          <p className="text-zinc-500 mt-1">All payment transactions across the platform.</p>
        </div>
        <Button variant="outline" className="bg-white/5 border-white/10 hover:bg-white/10 rounded-xl gap-2">
          <Download className="w-4 h-4" /> Export
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search transactions..."
          className="w-full bg-[#111113] border border-white/5 rounded-xl pl-10 pr-4 py-3 text-white outline-none focus:border-indigo-500/50 text-sm" />
      </div>

      <Card className="bg-[#111113] border-white/5 rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-[10px] font-bold uppercase tracking-wider text-zinc-500 p-4">ID</th>
                <th className="text-left text-[10px] font-bold uppercase tracking-wider text-zinc-500 p-4">Tenant</th>
                <th className="text-left text-[10px] font-bold uppercase tracking-wider text-zinc-500 p-4">Type</th>
                <th className="text-left text-[10px] font-bold uppercase tracking-wider text-zinc-500 p-4">Amount</th>
                <th className="text-left text-[10px] font-bold uppercase tracking-wider text-zinc-500 p-4">Status</th>
                <th className="text-left text-[10px] font-bold uppercase tracking-wider text-zinc-500 p-4">Gateway</th>
                <th className="text-left text-[10px] font-bold uppercase tracking-wider text-zinc-500 p-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((txn) => (
                <tr key={txn.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-4 text-sm font-mono text-indigo-400">{txn.id}</td>
                  <td className="p-4 text-sm text-white font-medium">{txn.tenant}</td>
                  <td className="p-4 text-xs text-zinc-400 uppercase tracking-wider">{txn.type}</td>
                  <td className="p-4 text-sm font-semibold tabular-nums">
                    <span className={txn.amount.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}>{txn.amount}</span>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${statusColors[txn.status]}`}>
                      {txn.status}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-zinc-400">{txn.gateway}</td>
                  <td className="p-4 text-sm text-zinc-500 tabular-nums">{txn.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
