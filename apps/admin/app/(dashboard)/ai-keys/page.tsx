'use client'

import React, { useState, useEffect } from 'react'
import { 
  Brain, 
  Plus, 
  Settings, 
  Trash2, 
  Key, 
  ShieldCheck, 
  Activity, 
  Cpu, 
  Database, 
  ChevronRight, 
  Loader2,
  RefreshCw,
  Lock,
  Zap,
  Globe,
  Bot
} from 'lucide-react'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@repo/ui/components/table'
import { Button } from '@repo/ui/components/button'
import { Input } from '@repo/ui/components/input'
import { Badge } from '@repo/ui/components/badge'
import api from '../../../lib/api'
import { toast } from 'sonner'

export default function AIKeysPage() {
  const [keys, setKeys] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchKeys = async () => {
    setLoading(true)
    try {
      const res: any = await api.get('/admin/ai-config')
      if (res.items) {
        setKeys(res.items)
      }
    } catch (error) {
      // Mock data
      setKeys([
        {
          id: 'k1',
          provider: 'OPENROUTER',
          model: 'openai/gpt-4o',
          isDefault: true,
          status: 'ACTIVE',
          usage24h: '4.2M tokens',
          latency: '1.2s'
        },
        {
          id: 'k2',
          provider: 'ANTHROPIC',
          model: 'claude-3-5-sonnet',
          isDefault: false,
          status: 'ACTIVE',
          usage24h: '1.1M tokens',
          latency: '1.8s'
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchKeys()
  }, [])

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
             <Bot className="text-primary" /> Global AI Orchestration
          </h1>
          <p className="text-zinc-500 text-sm mt-1">Manage upstream AI provider keys and neural routing configurations.</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl gap-2 h-12 px-6 shadow-xl shadow-blue-600/20">
          <Plus className="w-4 h-4" /> Provision New Provider
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <AIStat label="Global Tokens (24h)" value="12.4M" sub="Growth: +22%" icon={Zap} color="blue" />
         <AIStat label="Active Providers" value="4" sub="Health: Optimal" icon={Cpu} color="purple" />
         <AIStat label="Avg. Latency" value="1.34s" sub="P99: 2.1s" icon={Activity} color="emerald" />
      </div>

      <div className="bg-[#111113] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
         <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
            <h3 className="text-lg font-bold text-white tracking-tight">Neural Registry</h3>
            <Badge className="bg-emerald-500/10 text-emerald-500 border-none rounded-lg text-[9px] font-black uppercase tracking-widest px-3 py-1">
               System Routing: Active
            </Badge>
         </div>
         
         <div className="overflow-x-auto">
            <Table>
               <TableHeader className="bg-white/[0.01]">
                  <TableRow className="border-white/5 hover:bg-transparent">
                     <TableHead className="text-zinc-500 font-semibold py-5">Provider</TableHead>
                     <TableHead className="text-zinc-500 font-semibold">Primary Model</TableHead>
                     <TableHead className="text-zinc-500 font-semibold">Status</TableHead>
                     <TableHead className="text-zinc-500 font-semibold">Usage (24h)</TableHead>
                     <TableHead className="text-zinc-500 font-semibold">Latency</TableHead>
                     <TableHead className="text-zinc-500 font-semibold text-right">Actions</TableHead>
                  </TableRow>
               </TableHeader>
               <TableBody>
                  {keys.map((k) => (
                     <TableRow key={k.id} className="border-white/5 hover:bg-white/[0.02] transition-colors group">
                        <TableCell className="py-5">
                           <div className="flex items-center gap-3">
                              <div className="h-10 w-10 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center text-zinc-400 group-hover:text-primary transition-colors">
                                 <Globe size={20} />
                              </div>
                              <div>
                                 <p className="text-sm font-bold text-white">{k.provider}</p>
                                 {k.isDefault && (
                                    <span className="text-[8px] font-black text-primary uppercase tracking-[0.2em]">Default Provider</span>
                                 )}
                              </div>
                           </div>
                        </TableCell>
                        <TableCell>
                           <Badge className="bg-blue-500/10 text-blue-400 border-none rounded-lg text-[10px] font-mono">
                              {k.model}
                           </Badge>
                        </TableCell>
                        <TableCell>
                           <div className="flex items-center gap-2">
                              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                              <span className="text-xs font-medium text-zinc-300">{k.status}</span>
                           </div>
                        </TableCell>
                        <TableCell className="text-sm font-bold text-white">
                           {k.usage24h}
                        </TableCell>
                        <TableCell className="text-sm font-mono text-zinc-500">
                           {k.latency}
                        </TableCell>
                        <TableCell className="text-right">
                           <div className="flex items-center justify-end gap-2">
                              <Button variant="ghost" size="icon" className="h-10 w-10 text-zinc-500 hover:text-white rounded-xl">
                                 <Settings size={18} />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-10 w-10 text-zinc-500 hover:text-rose-500 rounded-xl">
                                 <Trash2 size={18} />
                              </Button>
                           </div>
                        </TableCell>
                     </TableRow>
                  ))}
               </TableBody>
            </Table>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <div className="bg-[#111113] border border-white/5 rounded-3xl p-8 shadow-2xl space-y-6">
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-3">
               <ShieldCheck className="text-blue-500" /> Key Rotation Protocol
            </h3>
            <p className="text-sm text-zinc-500 leading-relaxed italic">Enable automatic rotation for provider keys to ensure maximum security and avoid rate-limit exhaustion.</p>
            <div className="flex items-center justify-between p-5 bg-white/5 border border-white/5 rounded-2xl">
               <div>
                  <p className="text-sm font-bold text-white">Auto-Rotation</p>
                  <p className="text-[10px] text-zinc-600 font-black uppercase tracking-widest">Rotates every 30 days</p>
               </div>
               <div className="h-6 w-11 bg-zinc-800 rounded-full relative p-1 cursor-pointer">
                  <div className="h-4 w-4 bg-zinc-500 rounded-full translate-x-0 transition-transform" />
               </div>
            </div>
         </div>

         <div className="bg-[#111113] border border-white/5 rounded-3xl p-8 shadow-2xl space-y-6">
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-3">
               <Lock className="text-amber-500" /> Vault Security
            </h3>
            <p className="text-sm text-zinc-500 leading-relaxed italic">All provider keys are encrypted using AES-256-GCM before being stored in the neural registry.</p>
            <Button variant="ghost" className="w-full border border-white/5 text-zinc-500 hover:text-white h-12 rounded-xl text-[10px] font-black uppercase tracking-widest gap-2">
               <RefreshCw size={14} /> Re-encrypt Entire Vault
            </Button>
         </div>
      </div>
    </div>
  )
}

function AIStat({ label, value, sub, icon: Icon, color }: any) {
  const colors: any = {
    blue: "text-blue-400 bg-blue-400/10 border-blue-400/20",
    purple: "text-purple-400 bg-purple-400/10 border-purple-400/20",
    emerald: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  }
  return (
    <div className="bg-[#111113] border border-white/5 p-6 rounded-3xl shadow-xl flex items-center justify-between">
       <div>
          <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">{label}</p>
          <h3 className="text-2xl font-black text-white tracking-tight">{value}</h3>
          <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mt-1">{sub}</p>
       </div>
       <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center border shadow-inner transition-transform hover:scale-110", colors[color])}>
          <Icon size={28} />
       </div>
    </div>
  )
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ")
}
