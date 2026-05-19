'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card'
import { Button } from '@repo/ui/components/button'
import { Key, Plus, Copy, Eye, EyeOff, Trash2, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

const mockKeys = [
  { id: 'k_1', name: 'Production API Key', prefix: 'sk_live_...8a2d', created: '2024-04-15', lastUsed: '2 min ago', status: 'ACTIVE' },
  { id: 'k_2', name: 'Staging Key', prefix: 'sk_test_...f4e1', created: '2024-03-20', lastUsed: '1h ago', status: 'ACTIVE' },
  { id: 'k_3', name: 'Legacy Key (deprecated)', prefix: 'sk_live_...9b3c', created: '2023-12-01', lastUsed: '30d ago', status: 'REVOKED' },
]

export default function ApiKeysPage() {
  const [showCreate, setShowCreate] = useState(false)
  const [keyName, setKeyName] = useState('')

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">API Keys</h1>
          <p className="text-zinc-500 mt-1">Manage platform-level API keys.</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl gap-2">
          <Plus className="w-4 h-4" /> Generate Key
        </Button>
      </div>

      {showCreate && (
        <Card className="bg-[#111113] border-indigo-500/20 rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-end gap-4">
              <div className="flex-1 space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Key Name</label>
                <input type="text" value={keyName} onChange={(e) => setKeyName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500/50"
                  placeholder="e.g. Production API Key" />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowCreate(false)} className="border-white/10 rounded-xl">Cancel</Button>
                <Button onClick={() => { setShowCreate(false); toast.success('API key generated'); }}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl">Generate</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-[#111113] border-white/5 rounded-2xl overflow-hidden">
        <CardContent className="p-0 divide-y divide-white/5">
          {mockKeys.map((key) => (
            <div key={key.id} className="flex items-center gap-4 p-5 hover:bg-white/[0.02] transition-colors group">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                key.status === 'ACTIVE' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-zinc-500/10 text-zinc-500'
              }`}>
                <Key className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-semibold text-white">{key.name}</p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                    key.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                  }`}>
                    {key.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-zinc-500">
                  <code className="font-mono">{key.prefix}</code>
                  <span>•</span>
                  <span>Created: {key.created}</span>
                  <span>•</span>
                  <span>Last used: {key.lastUsed}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-zinc-400 hover:text-white"
                  onClick={() => { navigator.clipboard.writeText(key.prefix); toast.success('Copied'); }}>
                  <Copy className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-zinc-400 hover:text-red-400">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
