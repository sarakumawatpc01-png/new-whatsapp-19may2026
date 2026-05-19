'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card'
import { Button } from '@repo/ui/components/button'
import { 
  MessageSquare, 
  Save, 
  Eye, 
  EyeOff, 
  RefreshCw, 
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/api'

export default function WhatsAppConfigPage() {
  const [appId, setAppId] = useState('')
  const [appSecret, setAppSecret] = useState('')
  const [systemToken, setSystemToken] = useState('')
  const [configId, setConfigId] = useState('')
  const [apiVersion, setApiVersion] = useState('v19.0')
  const [verifyToken, setVerifyToken] = useState('')
  const [showSecret, setShowSecret] = useState(false)
  const [showToken, setShowToken] = useState(false)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null)

  // Load existing config on mount
  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      const res = await api.get('/admin/system-config')
      const data = res.data?.data || res.data || {}
      setAppId(data.metaAppId || '')
      setAppSecret(data.metaAppSecret || '')
      setSystemToken(data.metaSystemUserToken || '')
      setConfigId(data.metaConfigId || '')
      setApiVersion(data.apiVersion || 'v19.0')
      setVerifyToken(data.verifyToken || '')
    } catch (e) {
      toast.error('Failed to load WhatsApp configuration')
    } finally {
      setLoading(false)
    }
  }

  const generateVerifyToken = () => {
    const token = Array.from(crypto.getRandomValues(new Uint8Array(24)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
    setVerifyToken(token)
    toast.success('Verify token generated')
  }

  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)
    
    if (!appId || !appSecret) {
      setTesting(false)
      setTestResult('error')
      toast.error('Please fill in App ID and App Secret')
      return
    }

    try {
      // Save first, then test connection via backend
      await handleSave()
      // Test the Meta API connection  
      const res = await api.post('/admin/system-config/test-meta')
      setTestResult('success')
      toast.success('Connection test passed — Meta API is reachable')
    } catch (e: any) {
      setTestResult('error')
      toast.error(e?.message || 'Connection test failed — Please verify your credentials')
    } finally {
      setTesting(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.put('/admin/system-config', {
        metaAppId: appId,
        metaAppSecret: appSecret,
        metaSystemUserToken: systemToken,
        metaConfigId: configId,
        apiVersion,
        verifyToken,
      })
      toast.success('WhatsApp configuration saved')
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save configuration')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">WhatsApp Configuration</h1>
          <p className="text-zinc-500 mt-1">Configure Meta Business Platform credentials for WhatsApp Cloud API.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={handleTest}
            disabled={testing}
            variant="outline"
            className="bg-white/5 border-white/10 hover:bg-white/10 rounded-xl gap-2"
          >
            {testing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
            Test Connection
          </Button>
          <Button 
            onClick={handleSave}
            disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {testResult && (
        <div className={`flex items-center gap-3 p-4 rounded-xl border ${
          testResult === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
            : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          {testResult === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="text-sm font-medium">
            {testResult === 'success' ? 'Connection test passed — Meta API is reachable' : 'Connection test failed — Please verify your credentials'}
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-[#111113] border-white/5 rounded-2xl">
          <CardHeader className="border-b border-white/5 p-6">
            <CardTitle className="text-lg font-semibold text-white">Meta App Credentials</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Meta App ID</label>
              <input
                type="text"
                value={appId}
                onChange={(e) => setAppId(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500/50"
                placeholder="Enter your Meta App ID"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">App Secret</label>
              <div className="relative">
                <input
                  type={showSecret ? 'text' : 'password'}
                  value={appSecret}
                  onChange={(e) => setAppSecret(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-12 text-white outline-none focus:border-indigo-500/50"
                  placeholder="••••••••••••••••"
                />
                <button
                  onClick={() => setShowSecret(!showSecret)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                >
                  {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">System User Token</label>
              <div className="relative">
                <input
                  type={showToken ? 'text' : 'password'}
                  value={systemToken}
                  onChange={(e) => setSystemToken(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-12 text-white outline-none focus:border-indigo-500/50"
                  placeholder="••••••••••••••••"
                />
                <button
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                >
                  {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#111113] border-white/5 rounded-2xl">
          <CardHeader className="border-b border-white/5 p-6">
            <CardTitle className="text-lg font-semibold text-white">Webhook Settings</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Meta Config ID</label>
              <input
                type="text"
                value={configId}
                onChange={(e) => setConfigId(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500/50"
                placeholder="Enter Config ID"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">API Version</label>
              <select
                value={apiVersion}
                onChange={(e) => setApiVersion(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500/50 appearance-none"
              >
                <option value="v21.0" className="bg-[#111113]">v21.0</option>
                <option value="v20.0" className="bg-[#111113]">v20.0</option>
                <option value="v19.0" className="bg-[#111113]">v19.0</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Verify Token</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={verifyToken}
                  onChange={(e) => setVerifyToken(e.target.value)}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500/50 font-mono text-sm"
                  placeholder="Generate or enter verify token"
                />
                <Button 
                  onClick={generateVerifyToken}
                  variant="outline"
                  className="bg-white/5 border-white/10 hover:bg-white/10 rounded-xl px-4"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
