'use client'

import React, { useState } from 'react'
import { Card, CardContent } from '@repo/ui/components/card'
import { Button } from '@repo/ui/components/button'
import { Tag, Plus, Search, Copy, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

const mockCoupons = [
  { id: 'c_1', code: 'LAUNCH50', discount: '50%', type: 'PERCENTAGE', maxUses: 100, uses: 43, expiry: '2024-06-30', status: 'ACTIVE' },
  { id: 'c_2', code: 'WELCOME20', discount: '20%', type: 'PERCENTAGE', maxUses: 500, uses: 312, expiry: '2024-12-31', status: 'ACTIVE' },
  { id: 'c_3', code: 'FLAT1000', discount: '₹1,000', type: 'FIXED', maxUses: 50, uses: 50, expiry: '2024-04-30', status: 'EXHAUSTED' },
  { id: 'c_4', code: 'PARTNER25', discount: '25%', type: 'PERCENTAGE', maxUses: 200, uses: 18, expiry: '2024-09-30', status: 'ACTIVE' },
]

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  EXHAUSTED: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  EXPIRED: 'bg-red-500/10 text-red-400 border-red-500/20',
}

export default function CouponsPage() {
  const [search, setSearch] = useState('')

  const filtered = mockCoupons.filter(c =>
    c.code.toLowerCase().includes(search.toLowerCase())
  )

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast.success(`Copied: ${code}`)
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Coupons</h1>
          <p className="text-zinc-500 mt-1">Manage discount codes and promotions.</p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl gap-2">
          <Plus className="w-4 h-4" /> Create Coupon
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search coupons..."
          className="w-full bg-[#111113] border border-white/5 rounded-xl pl-10 pr-4 py-3 text-white outline-none focus:border-indigo-500/50 text-sm" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((coupon) => (
          <Card key={coupon.id} className="bg-[#111113] border-white/5 rounded-2xl hover:border-white/10 transition-all group">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                    <Tag className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <code className="text-lg font-bold font-mono text-white">{coupon.code}</code>
                      <button onClick={() => copyCode(coupon.code)} className="p-1 text-zinc-500 hover:text-white transition-colors">
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-xs text-zinc-500">{coupon.type === 'PERCENTAGE' ? `${coupon.discount} off` : `${coupon.discount} flat discount`}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${statusColors[coupon.status]}`}>
                  {coupon.status}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500">Usage</span>
                  <span className="text-zinc-400 tabular-nums">{coupon.uses} / {coupon.maxUses}</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${(coupon.uses / coupon.maxUses) * 100}%` }} />
                </div>
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-zinc-600">Expires: {coupon.expiry}</span>
                  <button className="text-zinc-500 hover:text-red-400 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
