'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card'
import { Button } from '@repo/ui/components/button'
import { Badge } from '@repo/ui/components/badge'
import { Flag, Save, Plus, Search } from 'lucide-react'
import { toast } from 'sonner'

const defaultFlags = [
  { id: 'ai_enabled', name: 'AI Auto-Reply', description: 'Enable AI-powered automatic responses', enabled: true },
  { id: 'automation_enabled', name: 'Automations', description: 'Enable visual automation builder', enabled: true },
  { id: 'campaigns_enabled', name: 'Campaigns', description: 'Enable broadcast campaign system', enabled: true },
  { id: 'crm_enabled', name: 'CRM / Contacts', description: 'Enable contact management and CRM features', enabled: true },
  { id: 'api_access', name: 'API Access', description: 'Allow tenant API key generation', enabled: false },
  { id: 'webhook_access', name: 'Webhooks', description: 'Allow outbound webhook configuration', enabled: false },
  { id: 'analytics_enabled', name: 'Analytics', description: 'Enable advanced analytics dashboard', enabled: true },
  { id: 'custom_branding', name: 'Custom Branding', description: 'Allow tenant to customize branding', enabled: false },
  { id: 'white_label', name: 'White Label', description: 'Enable white-label reseller features', enabled: false },
  { id: 'multi_number', name: 'Multiple Numbers', description: 'Allow more than one WhatsApp number', enabled: false },
]

export default function FeatureFlagsPage() {
  const [flags, setFlags] = useState(defaultFlags)
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)

  const filteredFlags = flags.filter(f => 
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    f.description.toLowerCase().includes(search.toLowerCase())
  )

  const toggleFlag = (id: string) => {
    setFlags(flags.map(f => f.id === id ? { ...f, enabled: !f.enabled } : f))
  }

  const handleSave = () => {
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      toast.success('Feature flags saved')
    }, 1000)
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Feature Flags</h1>
          <p className="text-zinc-500 mt-1">Control feature availability across the platform.</p>
        </div>
        <Button 
          onClick={handleSave}
          disabled={saving}
          className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl gap-2"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search flags..."
          className="w-full bg-[#111113] border border-white/5 rounded-xl pl-10 pr-4 py-3 text-white outline-none focus:border-indigo-500/50 text-sm"
        />
      </div>

      <Card className="bg-[#111113] border-white/5 rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          <div className="divide-y divide-white/5">
            {filteredFlags.map((flag) => (
              <div key={flag.id} className="flex items-center justify-between p-5 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${flag.enabled ? 'bg-indigo-500/10 text-indigo-400' : 'bg-white/5 text-zinc-500'}`}>
                    <Flag className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-white">{flag.name}</p>
                      <code className="text-[10px] font-mono text-zinc-600 bg-white/5 px-1.5 py-0.5 rounded">{flag.id}</code>
                    </div>
                    <p className="text-xs text-zinc-500 mt-0.5">{flag.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleFlag(flag.id)}
                  className={`relative w-12 h-6 rounded-full transition-all ${flag.enabled ? 'bg-indigo-500' : 'bg-white/10'}`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${flag.enabled ? 'left-6' : 'left-0.5'}`} />
                </button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
