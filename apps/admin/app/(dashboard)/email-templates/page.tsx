'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card'
import { Button } from '@repo/ui/components/button'
import { Mail, Plus, Edit, Trash2, Eye, Search } from 'lucide-react'
import { toast } from 'sonner'

const mockTemplates = [
  { id: 't_1', name: 'Welcome Email', subject: 'Welcome to {{platform_name}}', trigger: 'SIGNUP', status: 'ACTIVE', lastEdited: '2d ago' },
  { id: 't_2', name: 'Password Reset', subject: 'Reset your password', trigger: 'FORGOT_PASSWORD', status: 'ACTIVE', lastEdited: '5d ago' },
  { id: 't_3', name: 'Email Verification', subject: 'Verify your email address', trigger: 'VERIFY_EMAIL', status: 'ACTIVE', lastEdited: '1w ago' },
  { id: 't_4', name: 'Invoice Receipt', subject: 'Payment receipt for {{invoice_id}}', trigger: 'PAYMENT_SUCCESS', status: 'ACTIVE', lastEdited: '2w ago' },
  { id: 't_5', name: 'Plan Upgrade', subject: 'Congratulations on your upgrade!', trigger: 'PLAN_CHANGE', status: 'DRAFT', lastEdited: '3d ago' },
  { id: 't_6', name: 'Account Suspended', subject: 'Your account has been suspended', trigger: 'ACCOUNT_SUSPEND', status: 'ACTIVE', lastEdited: '1m ago' },
]

export default function EmailTemplatesPage() {
  const [search, setSearch] = useState('')

  const filtered = mockTemplates.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.trigger.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Email Templates</h1>
          <p className="text-zinc-500 mt-1">Manage transactional email templates.</p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl gap-2">
          <Plus className="w-4 h-4" /> New Template
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search templates..."
          className="w-full bg-[#111113] border border-white/5 rounded-xl pl-10 pr-4 py-3 text-white outline-none focus:border-indigo-500/50 text-sm" />
      </div>

      <Card className="bg-[#111113] border-white/5 rounded-2xl overflow-hidden">
        <CardContent className="p-0 divide-y divide-white/5">
          {filtered.map((tpl) => (
            <div key={tpl.id} className="flex items-center gap-4 p-5 hover:bg-white/[0.02] transition-colors group">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-semibold text-white">{tpl.name}</p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                    tpl.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                  }`}>
                    {tpl.status}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 truncate">Subject: {tpl.subject}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <code className="text-[10px] font-mono text-zinc-600 bg-white/5 px-2 py-1 rounded">{tpl.trigger}</code>
                <span className="text-xs text-zinc-600">{tpl.lastEdited}</span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-zinc-400 hover:text-white">
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-zinc-400 hover:text-white">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-zinc-400 hover:text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
