'use client'

import React, { useState, useEffect } from 'react'
import { 
  Settings, 
  Shield, 
  Cpu, 
  Webhook, 
  Database, 
  Globe, 
  Lock, 
  Save, 
  RefreshCw,
  Server,
  Cloud,
  CheckCircle2,
  AlertTriangle,
  Zap,
  LayoutGrid,
  Bot
} from 'lucide-react'
import { Button } from '@repo/ui/components/button'
import { Input } from '@repo/ui/components/input'
import { Badge } from '@repo/ui/components/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@repo/ui/components/tabs'
import { Switch } from '@repo/ui/components/switch'
import api from '../../../lib/api'
import { toast } from 'sonner'

export default function SettingsPage() {
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('general')
  const [platformName, setPlatformName] = useState('Dyad AI')
  const [supportEmail, setSupportEmail] = useState('')

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const res = await api.get('/admin/system-config')
        const data = res.data?.data || res.data || {}
        if (data.platformName) setPlatformName(data.platformName)
        if (data.smtpFromEmail) setSupportEmail(data.smtpFromEmail)
      } catch { /* first load */ }
    }
    loadConfig()
  }, [])

  const handleSave = async () => {
    setLoading(true)
    try {
      await api.put('/admin/system-config', {
        platformName,
        smtpFromEmail: supportEmail,
      })
      toast.success('System configuration updated successfully')
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save settings')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">System Settings</h1>
          <p className="text-zinc-500 text-sm mt-1">Global platform configuration and infrastructure management.</p>
        </div>
        <Button onClick={handleSave} disabled={loading} className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl gap-2 h-12 px-8 shadow-xl shadow-blue-600/20">
          {loading ? <RefreshCw className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
          Save All Changes
        </Button>
      </div>

      <Tabs defaultValue="general" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="bg-[#111113] border border-white/5 p-1 rounded-2xl h-14 mb-8">
          <TabsTrigger value="general" className="rounded-xl data-[state=active]:bg-white/5 data-[state=active]:text-white gap-2 px-6">
            <LayoutGrid className="w-4 h-4" /> General
          </TabsTrigger>
          <TabsTrigger value="ai" className="rounded-xl data-[state=active]:bg-white/5 data-[state=active]:text-white gap-2 px-6">
            <Bot className="w-4 h-4" /> Neural Engine
          </TabsTrigger>
          <TabsTrigger value="infrastructure" className="rounded-xl data-[state=active]:bg-white/5 data-[state=active]:text-white gap-2 px-6">
            <Server className="w-4 h-4" /> Infrastructure
          </TabsTrigger>
          <TabsTrigger value="security" className="rounded-xl data-[state=active]:bg-white/5 data-[state=active]:text-white gap-2 px-6">
            <Shield className="w-4 h-4" /> Security
          </TabsTrigger>
        </TabsList>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <TabsContent value="general" className="m-0 space-y-8">
              <SettingsSection title="Branding & Identity" icon={Globe}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-zinc-500 uppercase tracking-widest px-1">Platform Name</label>
                    <Input defaultValue="Dyad AI" className="bg-white/5 border-white/10 rounded-xl h-12" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-zinc-500 uppercase tracking-widest px-1">Support Email</label>
                    <Input defaultValue="ops@dyad.ai" className="bg-white/5 border-white/10 rounded-xl h-12" />
                  </div>
                </div>
              </SettingsSection>

              <SettingsSection title="Meta Webhook Configuration" icon={Webhook}>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-zinc-500 uppercase tracking-widest px-1">Verify Token</label>
                    <div className="relative">
                      <Input defaultValue="dyad_nexus_2024_secure_token" type="password" className="bg-white/5 border-white/10 rounded-xl h-12 pr-12" />
                      <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-zinc-500 uppercase tracking-widest px-1">Callback URL (Auto-generated)</label>
                    <Input defaultValue="https://api.dyad.ai/v1/whatsapp/webhook" readOnly className="bg-white/5 border-white/5 text-zinc-500 rounded-xl h-12 italic" />
                  </div>
                </div>
              </SettingsSection>
            </TabsContent>

            <TabsContent value="ai" className="m-0 space-y-8">
              <SettingsSection title="Neural Orchestration" icon={Cpu}>
                <div className="space-y-8">
                   <div className="flex items-center justify-between p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl">
                      <div className="flex items-center gap-4">
                         <div className="h-10 w-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400">
                            <Zap size={20} />
                         </div>
                         <div>
                            <p className="text-sm font-bold text-white">Auto-Heal Neural Connections</p>
                            <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Automatic provider switching on failure</p>
                         </div>
                      </div>
                      <Switch defaultChecked />
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-zinc-500 uppercase tracking-widest px-1">Default Multi-Provider</label>
                        <select className="w-full bg-white/5 border border-white/10 rounded-xl h-12 px-4 text-white outline-none focus:border-blue-500/50">
                           <option>OpenRouter</option>
                           <option>Direct OpenAI</option>
                           <option>Direct Anthropic</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-zinc-500 uppercase tracking-widest px-1">Primary Logic Model</label>
                        <Input defaultValue="openai/gpt-4o" className="bg-white/5 border-white/10 rounded-xl h-12" />
                      </div>
                   </div>

                   <div className="space-y-2">
                    <label className="text-xs font-black text-zinc-500 uppercase tracking-widest px-1">Shared Provider API Key</label>
                    <div className="relative">
                      <Input defaultValue="sk-or-v1-xxxxxxxxxxxxxxxxxxxx" type="password" className="bg-white/5 border-white/10 rounded-xl h-12 pr-12" />
                      <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                    </div>
                    <p className="text-[10px] text-zinc-600 italic">This key is used for tenants on "Starter" plans without their own API keys.</p>
                  </div>
                </div>
              </SettingsSection>
            </TabsContent>

            <TabsContent value="infrastructure" className="m-0 space-y-8">
               <SettingsSection title="Node Health & Cluster" icon={Database}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <StatusItem label="Postgres Primary" status="Healthy" latency="12ms" />
                     <StatusItem label="Redis Cache Cluster" status="Healthy" latency="2ms" />
                     <StatusItem label="BullMQ Worker Pool" status="Scaling" latency="0ms" />
                     <StatusItem label="S3 Media Storage" status="Healthy" latency="45ms" />
                  </div>
               </SettingsSection>
            </TabsContent>
          </div>

          <div className="space-y-8">
            <div className="bg-[#111113] border border-white/5 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
               <div className="absolute -top-10 -right-10 h-32 w-32 bg-emerald-500/10 blur-3xl rounded-full" />
               <h3 className="text-lg font-black text-white mb-6 uppercase tracking-tight flex items-center gap-3">
                  <Activity className="text-emerald-500" size={20} /> System Pulse
               </h3>
               <div className="space-y-6">
                  <PulseItem label="Core API" uptime="99.99%" status="online" />
                  <PulseItem label="Real-time WS" uptime="99.98%" status="online" />
                  <PulseItem label="AI Processor" uptime="99.95%" status="online" />
                  <PulseItem label="WhatsApp Webhook" uptime="100%" status="online" />
               </div>
               <Button variant="ghost" className="w-full mt-8 border border-white/5 text-zinc-500 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest">
                  View Full Status Page
               </Button>
            </div>

            <div className="bg-[#111113] border border-white/5 rounded-3xl p-8 shadow-2xl">
               <h3 className="text-lg font-black text-white mb-4 uppercase tracking-tight flex items-center gap-3">
                  <RefreshCw className="text-blue-500" size={20} /> Maintenance
               </h3>
               <p className="text-xs text-zinc-500 mb-6 leading-relaxed">Perform critical system operations. Warning: These actions may cause brief service interruptions.</p>
               <div className="space-y-3">
                  <MaintenanceAction label="Clear Global Cache" />
                  <MaintenanceAction label="Recalculate Usage Quotas" />
                  <MaintenanceAction label="Force Cluster Sync" />
                  <MaintenanceAction label="Rotate Secret Keys" danger />
               </div>
            </div>
          </div>
        </div>
      </Tabs>
    </div>
  )
}

function SettingsSection({ title, icon: Icon, children }: any) {
  return (
    <div className="bg-[#111113] border border-white/5 rounded-3xl overflow-hidden shadow-2xl transition-all hover:border-white/10">
      <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center gap-4">
        <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center text-zinc-400">
          <Icon size={20} />
        </div>
        <h3 className="text-lg font-bold text-white tracking-tight">{title}</h3>
      </div>
      <div className="p-8">
        {children}
      </div>
    </div>
  )
}

function StatusItem({ label, status, latency }: any) {
  return (
    <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
       <span className="text-xs font-bold text-zinc-400">{label}</span>
       <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono text-zinc-600">{latency}</span>
          <Badge className="bg-emerald-500/10 text-emerald-500 border-none rounded-lg text-[9px] font-black">{status}</Badge>
       </div>
    </div>
  )
}

function PulseItem({ label, uptime, status }: any) {
  return (
    <div className="flex items-center justify-between">
       <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
          <span className="text-sm font-medium text-zinc-300">{label}</span>
       </div>
       <span className="text-xs font-bold text-white">{uptime}</span>
    </div>
  )
}

function MaintenanceAction({ label, danger }: any) {
  return (
    <button className={cn(
      "w-full flex items-center justify-between p-4 rounded-2xl transition-all border",
      danger ? "bg-red-500/5 border-red-500/10 text-red-400 hover:bg-red-500/10" : "bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10 hover:text-white"
    )}>
       <span className="text-xs font-black uppercase tracking-widest">{label}</span>
       <ChevronRight size={16} />
    </button>
  )
}

function Activity(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  )
}

function ChevronRight(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ")
}
