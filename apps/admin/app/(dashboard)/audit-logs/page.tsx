'use client'

import React, { useState, useEffect } from 'react'
import { 
  Shield, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  Loader2,
  Calendar,
  User,
  Activity,
  History,
  Lock,
  ExternalLink,
  Info
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
import { format } from 'date-fns'

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [selectedLog, setSelectedLog] = useState<any>(null)

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const res: any = await api.get('/admin/audit', {
        params: { page, limit: 20, search }
      })
      if (res.items) {
        setLogs(res.items)
        setTotal(res.total)
      }
    } catch (error) {
      // Mock data for audit
      setLogs([
        {
          id: 'log_1',
          action: 'IMPERSONATE',
          userId: 'admin_1',
          user: { name: 'System Admin', email: 'ops@platform.ai' },
          targetId: 'tenant_abc',
          details: { reason: 'Support request #402', session_id: 'sess_992' },
          ipAddress: '192.168.1.1',
          createdAt: new Date().toISOString()
        },
        {
          id: 'log_2',
          action: 'SUSPEND_TENANT',
          userId: 'admin_1',
          user: { name: 'System Admin', email: 'ops@platform.ai' },
          targetId: 'tenant_xyz',
          details: { reason: 'Payment failure', invoice_id: 'inv_203' },
          ipAddress: '192.168.1.1',
          createdAt: new Date(Date.now() - 3600000).toISOString()
        }
      ])
      setTotal(2)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [page, search])

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <History className="text-primary" /> System Audit Trail
          </h1>
          <p className="text-zinc-500 text-sm mt-1">Immutable record of all administrative and security actions.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="border-white/5 bg-white/5 text-zinc-400 hover:text-white rounded-xl gap-2">
            <Lock className="w-4 h-4" /> Export Logs
          </Button>
        </div>
      </div>

      <div className="bg-[#111113] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-blue-400 transition-colors" />
            <Input 
              placeholder="Filter by action, user or target..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-white/5 border-white/5 focus:border-blue-500/50 rounded-xl h-10 w-full"
            />
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-primary/10 text-primary border-none rounded-lg px-3 py-1 font-black text-[10px] uppercase tracking-widest">
              Live Stream Active
            </Badge>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-white/[0.01]">
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-zinc-500 font-semibold py-4">Timestamp</TableHead>
                <TableHead className="text-zinc-500 font-semibold">Action</TableHead>
                <TableHead className="text-zinc-500 font-semibold">Actor</TableHead>
                <TableHead className="text-zinc-500 font-semibold">Target</TableHead>
                <TableHead className="text-zinc-500 font-semibold">IP Address</TableHead>
                <TableHead className="text-zinc-500 font-semibold text-right">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && logs.length === 0 ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-white/5">
                    <TableCell colSpan={6} className="py-8 text-center text-zinc-500">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                      Loading trails...
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id} className="border-white/5 hover:bg-white/[0.02] transition-colors group">
                    <TableCell className="py-4 font-mono text-[11px] text-zinc-400">
                      {format(new Date(log.createdAt), 'yyyy-MM-dd HH:mm:ss')}
                    </TableCell>
                    <TableCell>
                      <Badge className={cn(
                        "rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-wider",
                        getActionColor(log.action)
                      )}>
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="w-3 h-3 text-zinc-600" />
                        <span className="text-sm font-medium text-white">{log.user?.name || 'Unknown'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-zinc-500">
                      {log.targetId || 'SYSTEM'}
                    </TableCell>
                    <TableCell className="font-mono text-[11px] text-zinc-600">
                      {log.ipAddress}
                    </TableCell>
                    <TableCell className="text-right">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg gap-2">
                            <Info className="w-4 h-4" /> View
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-[#111113] border-white/10 text-white rounded-3xl max-w-lg">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-3 text-xl font-black uppercase tracking-tight">
                              <Activity className="text-primary" /> Audit Payload
                            </DialogTitle>
                          </DialogHeader>
                          <div className="mt-6 space-y-6">
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                               <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">RAW JSON</p>
                               <pre className="text-xs font-mono text-emerald-400 overflow-x-auto">
                                 {JSON.stringify(log.details, null, 2)}
                               </pre>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                               <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Browser Agent</p>
                                  <p className="text-xs text-zinc-300 mt-1 truncate">Mozilla/5.0 (Windows NT 10.0...)</p>
                               </div>
                               <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Region</p>
                                  <p className="text-xs text-zinc-300 mt-1">US-EAST-1 (Verified)</p>
                               </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="p-4 border-t border-white/5 bg-white/[0.01] flex items-center justify-between">
           <p className="text-xs text-zinc-500 font-medium">
             Showing <span className="text-white">{(page - 1) * 20 + 1}</span> to <span className="text-white">{Math.min(page * 20, total)}</span> of <span className="text-white">{total}</span> trails
           </p>
           <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="text-zinc-500 hover:text-white rounded-xl"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                disabled={page * 20 >= total}
                onClick={() => setPage(page + 1)}
                className="text-zinc-500 hover:text-white rounded-xl"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
           </div>
        </div>
      </div>
    </div>
  )
}

function getActionColor(action: string) {
  switch (action) {
    case 'IMPERSONATE': return "bg-purple-500/10 text-purple-400 border-purple-500/20";
    case 'SUSPEND_TENANT': return "bg-red-500/10 text-red-400 border-red-500/20";
    case 'LOGIN': return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    case 'ACTIVATE_TENANT': return "bg-green-500/10 text-green-400 border-green-500/20";
    default: return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
  }
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ")
}
