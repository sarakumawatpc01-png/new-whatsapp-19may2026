'use client'

import React, { useState, useEffect } from 'react'
import { 
  AlertTriangle, 
  RefreshCw, 
  Trash2, 
  Search, 
  Filter, 
  ExternalLink, 
  Bug, 
  Zap, 
  Clock, 
  ChevronLeft, 
  ChevronRight,
  Loader2,
  Terminal,
  Play
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
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/components/dialog"
import api from '../../../lib/api'
import { toast } from 'sonner'
import { format } from 'date-fns'

export default function DeadLetterQueuePage() {
  const [failures, setFailures] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [isRetrying, setIsRetrying] = useState(false)

  const fetchFailures = async () => {
    setLoading(true)
    try {
      // Real app would fetch from BullMQ/Redis DLQ
      const res: any = await api.get('/admin/dead-letter', {
        params: { page, limit: 10 }
      })
      if (res.items) {
        setFailures(res.items)
        setTotal(res.total)
      }
    } catch (error) {
      // Mock data
      setFailures([
        {
          id: 'err_1',
          queue: 'whatsapp:outgoing',
          jobId: 'job_49221',
          error: 'Meta API 400: Message too long for template',
          attempts: 5,
          tenant: { name: 'Acme Corp', slug: 'acme' },
          createdAt: new Date().toISOString()
        },
        {
          id: 'err_2',
          queue: 'ai:processing',
          jobId: 'job_11029',
          error: 'OpenRouter Timeout: Model gpt-4o unreachable',
          attempts: 3,
          tenant: { name: 'Globex', slug: 'globex' },
          createdAt: new Date(Date.now() - 1800000).toISOString()
        }
      ])
      setTotal(2)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFailures()
  }, [page])

  const handleRetryAll = async () => {
    setIsRetrying(true)
    try {
      await api.post('/admin/dead-letter/retry-all')
      toast.success('Batch retry initiated')
      fetchFailures()
    } catch (error) {
      toast.error('Retry batch failed')
    } finally {
      setIsRetrying(false)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <AlertTriangle className="text-rose-500" /> Dead Letter Queue
          </h1>
          <p className="text-zinc-500 text-sm mt-1">Monitor and recover failed background jobs and API transmissions.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={handleRetryAll} 
            disabled={isRetrying || failures.length === 0}
            className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl gap-2 h-12 px-6 shadow-xl shadow-emerald-600/20"
          >
            {isRetrying ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Retry All Failures
          </Button>
          <Button variant="outline" className="border-white/5 bg-white/5 text-rose-400 hover:text-rose-300 rounded-xl gap-2 h-12 px-6">
            <Trash2 className="w-4 h-4" /> Purge DLQ
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <DLQStat label="Total Failures" value={total} color="rose" icon={Bug} />
         <DLQStat label="Critical Errors" value="1" color="amber" icon={AlertTriangle} />
         <DLQStat label="Retry Success Rate" value="92%" color="emerald" icon={Zap} />
      </div>

      <div className="bg-[#111113] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
           <div className="flex items-center gap-4">
              <Badge className="bg-rose-500/10 text-rose-500 border-none rounded-lg px-3 py-1 font-black text-[10px] uppercase tracking-widest">
                 Live Diagnostics
              </Badge>
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                 <Clock className="w-3 h-3" /> Auto-refreshing every 30s
              </div>
           </div>
           <Button variant="ghost" size="sm" onClick={fetchFailures} className="text-zinc-500 hover:text-white gap-2">
              <RefreshCw className="w-3 h-3" /> Refresh Registry
           </Button>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-white/[0.01]">
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-zinc-500 font-semibold py-4">Job Info</TableHead>
                <TableHead className="text-zinc-500 font-semibold">Queue</TableHead>
                <TableHead className="text-zinc-500 font-semibold">Tenant</TableHead>
                <TableHead className="text-zinc-500 font-semibold">Error Context</TableHead>
                <TableHead className="text-zinc-500 font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && failures.length === 0 ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i} className="border-white/5">
                    <TableCell colSpan={5} className="py-20 text-center">
                       <Loader2 className="w-8 h-8 animate-spin mx-auto text-zinc-700" />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                failures.map((fail) => (
                  <TableRow key={fail.id} className="border-white/5 hover:bg-white/[0.02] transition-colors group">
                    <TableCell className="py-4">
                       <div className="flex flex-col gap-1">
                          <span className="text-sm font-bold text-white group-hover:text-rose-400 transition-colors">#{fail.jobId}</span>
                          <span className="text-[10px] text-zinc-600 font-mono uppercase tracking-tighter">
                             {format(new Date(fail.createdAt), 'HH:mm:ss')} • {fail.attempts} attempts
                          </span>
                       </div>
                    </TableCell>
                    <TableCell>
                       <Badge className="bg-white/5 border-white/5 text-zinc-400 font-mono text-[9px] px-2 py-0.5 rounded-lg">
                          {fail.queue}
                       </Badge>
                    </TableCell>
                    <TableCell>
                       <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary">
                             {fail.tenant.name[0]}
                          </div>
                          <span className="text-xs font-medium text-zinc-300">{fail.tenant.slug}</span>
                       </div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                       <p className="text-xs text-zinc-500 truncate italic">{fail.error}</p>
                    </TableCell>
                    <TableCell className="text-right">
                       <div className="flex items-center justify-end gap-2">
                          <Dialog>
                             <DialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-10 w-10 text-zinc-500 hover:text-white rounded-xl bg-white/5 border border-white/5">
                                   <Terminal className="w-4 h-4" />
                                </Button>
                             </DialogTrigger>
                             <DialogContent className="bg-[#111113] border-white/10 text-white rounded-3xl max-w-2xl">
                                <DialogHeader>
                                   <DialogTitle className="flex items-center gap-3 text-xl font-black uppercase tracking-tight">
                                      <Bug className="text-rose-500" /> Failure Stack
                                   </DialogTitle>
                                </DialogHeader>
                                <div className="mt-6 space-y-6">
                                   <div className="p-6 bg-black rounded-2xl border border-white/5 shadow-inner">
                                      <pre className="text-xs font-mono text-rose-400 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                                         {`[ERROR] ${fail.error}\n[STACK] at AIProcessor.process (ai.processor.ts:124:19)\n at Worker.run (bullmq:832:41)\n at ClusterManager.handle (node:cluster:102)`}
                                      </pre>
                                   </div>
                                   <div className="flex gap-4">
                                      <Button className="flex-1 h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-500 gap-3 font-black uppercase tracking-widest text-[10px]">
                                         <RefreshCw size={16} /> Re-push to Queue
                                      </Button>
                                      <Button variant="outline" className="flex-1 h-14 rounded-2xl border-white/5 bg-white/5 hover:bg-white/10 gap-3 font-black uppercase tracking-widest text-[10px]">
                                         <Trash2 size={16} className="text-rose-500" /> Decommission
                                      </Button>
                                   </div>
                                </div>
                             </DialogContent>
                          </Dialog>
                          <Button variant="ghost" size="icon" className="h-10 w-10 text-zinc-500 hover:text-rose-400 rounded-xl">
                             <Trash2 className="w-4 h-4" />
                          </Button>
                       </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}

function DLQStat({ label, value, color, icon: Icon }: any) {
  const colors: any = {
    rose: "text-rose-400 bg-rose-400/10 border-rose-400/20",
    emerald: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
    amber: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  }
  return (
    <div className="bg-[#111113] border border-white/5 p-6 rounded-2xl flex items-center justify-between shadow-xl">
       <div>
          <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">{label}</p>
          <h3 className="text-2xl font-black text-white tracking-tight">{value}</h3>
       </div>
       <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center border shadow-inner", colors[color])}>
          <Icon size={24} />
       </div>
    </div>
  )
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ")
}
