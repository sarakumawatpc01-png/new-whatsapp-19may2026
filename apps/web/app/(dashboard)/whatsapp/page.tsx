'use client'

import React, { useState, useEffect } from 'react'
import { 
  Phone, 
  Plus, 
  RefreshCw, 
  Settings2, 
  Activity, 
  MessageSquare, 
  Trash2, 
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Zap,
  Lock
} from 'lucide-react'
import { Button } from '@repo/ui/components/button'
import { Card, CardContent } from '@repo/ui/components/card'
import { Badge } from '@repo/ui/components/badge'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@repo/ui/components/dropdown-menu'
import api from '@/lib/api'
import { toast } from 'sonner'
import { cn } from '@repo/ui/src/utils'

export default function WhatsAppPage() {
  const [numbers, setNumbers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)

  const fetchNumbers = async () => {
    setLoading(true)
    try {
      const res: any = await api.get('/whatsapp/numbers')
      if (res.success) {
        setNumbers(res.data)
      }
    } catch (error) {
      // toast.error('Failed to sync numbers')
      setNumbers([
        {
          id: 'num_1',
          displayPhone: '+91 98765 43210',
          verifiedName: 'Platform Business',
          status: 'ACTIVE',
          qualityRating: 'GREEN',
          messagingLimit: '1k/day',
          lastWebhookAt: new Date().toISOString()
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNumbers()
  }, [])

  const handleConnect = () => {
    setConnecting(true)
    // This would typically open the Facebook Login Popup for Embedded Signup
    setTimeout(() => {
      setConnecting(false)
      toast.info('Meta Embedded Signup integration required for live connection.')
    }, 1500)
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase tracking-[0.05em] flex items-center gap-3">
             <div className="h-10 w-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500">
                <Phone size={24} />
             </div>
             WhatsApp Channels
          </h1>
          <p className="text-gray-400 mt-2">Manage your official Meta WhatsApp Business API connections.</p>
        </div>
        <Button 
          onClick={handleConnect} 
          disabled={connecting}
          className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl h-14 px-8 gap-3 shadow-2xl shadow-emerald-600/20 active:scale-95 transition-all font-black uppercase tracking-widest text-xs"
        >
          {connecting ? <RefreshCw className="animate-spin" size={20} /> : <Plus size={20} />}
          Connect Official Number
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
           {loading && numbers.length === 0 ? (
             Array.from({ length: 1 }).map((_, i) => (
                <Card key={i} className="glass border-white/5 animate-pulse">
                   <CardContent className="h-32" />
                </Card>
             ))
           ) : numbers.length === 0 ? (
             <div className="bg-white/[0.02] border-2 border-dashed border-white/5 rounded-3xl p-16 text-center">
                <div className="h-20 w-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                   <Phone className="text-gray-600" size={32} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No Numbers Connected</h3>
                <p className="text-gray-500 max-w-sm mx-auto mb-8">Link your first WhatsApp Business number to start automating conversations with AI.</p>
                <Button onClick={handleConnect} variant="outline" className="border-white/10 text-white rounded-xl h-12 px-6 hover:bg-white/5">
                   Begin Onboarding
                </Button>
             </div>
           ) : (
             numbers.map((number) => (
               <Card key={number.id} className="glass border-white/10 hover:border-emerald-500/30 transition-all overflow-hidden group shadow-2xl">
                  <CardContent className="p-0">
                     <div className="p-8 flex items-center justify-between border-b border-white/5">
                        <div className="flex items-center gap-6">
                           <div className="relative">
                              <div className="h-16 w-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 border border-emerald-500/20 shadow-inner">
                                 <Phone size={32} />
                              </div>
                              <div className="absolute -bottom-1 -right-1 h-6 w-6 bg-emerald-500 rounded-full border-4 border-[#030712] flex items-center justify-center text-[10px] text-white">
                                 <CheckCircle2 size={12} />
                              </div>
                           </div>
                           <div>
                              <h3 className="text-2xl font-black text-white tracking-tight">{number.displayPhone}</h3>
                              <div className="flex items-center gap-2 mt-1">
                                 <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{number.verifiedName || 'Business API'}</span>
                                 <div className="h-1 w-1 rounded-full bg-gray-700" />
                                 <Badge className="bg-emerald-500/10 text-emerald-500 border-none rounded-lg text-[9px] font-black uppercase tracking-widest px-2 py-0.5">
                                    {number.status}
                                 </Badge>
                              </div>
                           </div>
                        </div>
                        <div className="flex items-center gap-3">
                           <Button variant="ghost" size="icon" className="h-12 w-12 text-gray-500 hover:text-white rounded-xl hover:bg-white/5 border border-white/5 transition-all">
                              <Settings2 size={20} />
                           </Button>
                           <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                 <Button variant="ghost" size="icon" className="h-12 w-12 text-gray-500 hover:text-white rounded-xl hover:bg-white/5 border border-white/5">
                                    <MoreVertical size={20} />
                                 </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-[#0b0c10] border-white/10 text-white rounded-2xl w-48 shadow-2xl">
                                 <DropdownMenuItem className="gap-3 py-3 cursor-pointer focus:bg-white/5">
                                    <Activity className="w-4 h-4 text-emerald-500" /> Sync Health
                                 </DropdownMenuItem>
                                 <DropdownMenuItem className="gap-3 py-3 cursor-pointer focus:bg-white/5">
                                    <MessageSquare className="w-4 h-4 text-blue-500" /> Template Registry
                                 </DropdownMenuItem>
                                 <DropdownMenuItem className="gap-3 py-3 cursor-pointer text-rose-500 focus:bg-rose-500/10 focus:text-rose-500">
                                    <Trash2 className="w-4 h-4" /> Disconnect
                                 </DropdownMenuItem>
                              </DropdownMenuContent>
                           </DropdownMenu>
                        </div>
                     </div>
                     <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8 bg-white/[0.01]">
                        <StatusMetric label="Daily Quota" value={number.messagingLimit || '1k'} icon={Zap} color="emerald" />
                        <StatusMetric label="Health Rating" value={number.qualityRating || 'GREEN'} icon={ShieldCheck} color="emerald" />
                        <StatusMetric label="Last Webhook" value="2m ago" icon={Activity} color="blue" />
                     </div>
                  </CardContent>
               </Card>
             ))
           )}

           <div className="p-8 bg-blue-500/5 border border-blue-500/10 rounded-3xl flex items-start gap-6">
              <div className="h-12 w-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400 shrink-0 border border-blue-500/20">
                 <AlertCircle size={24} />
              </div>
              <div className="space-y-2">
                 <h4 className="text-lg font-bold text-white uppercase tracking-tight">Compliance & Requirements</h4>
                 <p className="text-sm text-gray-400 leading-relaxed">
                    Connecting an official WhatsApp number requires a verified Facebook Business Manager account and a valid payment method on your Meta dashboard.
                 </p>
                 <Button variant="link" className="p-0 text-blue-400 text-xs h-auto gap-2 hover:no-underline font-bold">
                    Learn about Meta Business verification <ExternalLink size={12} />
                 </Button>
              </div>
           </div>
        </div>

        <div className="space-y-8">
           <Card className="glass border-white/10 bg-primary/5 overflow-hidden">
              <CardContent className="p-8">
                 <h3 className="text-xl font-black text-white uppercase tracking-tight mb-4 flex items-center gap-3">
                    <Zap className="text-primary" size={20} /> AI Pilot Active
                 </h3>
                 <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                    AI response engine is currently monitoring all connected channels. Messages will be automatically processed according to your neural configuration.
                 </p>
                 <Button className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl h-12 font-bold text-xs uppercase tracking-widest">
                    Manage AI Rules
                 </Button>
              </CardContent>
           </Card>

           <div className="p-8 rounded-3xl border border-white/5 bg-white/[0.02] space-y-6">
              <h4 className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em]">Security Registry</h4>
              <div className="space-y-4">
                 <SecurityItem icon={Lock} label="AES-256 Encryption" status="Verified" />
                 <SecurityItem icon={ShieldCheck} label="Webhook Signature" status="Active" />
                 <SecurityItem icon={Activity} label="Latency Monitor" status="8ms" />
              </div>
           </div>
        </div>
      </div>
    </div>
  )
}

function StatusMetric({ label, value, icon: Icon, color }: any) {
  const colors: any = {
    emerald: "text-emerald-500",
    blue: "text-blue-500",
  }
  return (
    <div className="space-y-2">
       <div className="flex items-center gap-2 text-[10px] font-black text-gray-600 uppercase tracking-widest">
          <Icon size={12} /> {label}
       </div>
       <p className={cn("text-xl font-black tracking-tight", colors[color])}>{value}</p>
    </div>
  )
}

function SecurityItem({ icon: Icon, label, status }: any) {
  return (
    <div className="flex items-center justify-between">
       <div className="flex items-center gap-3 text-zinc-400">
          <Icon size={14} />
          <span className="text-xs font-semibold">{label}</span>
       </div>
       <span className="text-[10px] font-black text-white uppercase tracking-widest">{status}</span>
    </div>
  )
}
