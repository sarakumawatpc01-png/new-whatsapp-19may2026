'use client'

import React, { useState, useEffect } from 'react'
import { 
  Users, 
  Search, 
  Filter, 
  MoreVertical, 
  Plus, 
  ExternalLink, 
  TrendingUp,
  CreditCard,
  Building2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Trash2,
  ShieldCheck
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
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@repo/ui/components/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/components/avatar'
import api from '../../../lib/api'
import { toast } from 'sonner'

export default function ResellersPage() {
  const [resellers, setResellers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const fetchResellers = async () => {
    setLoading(true)
    try {
      // In a real app, this would be /admin/resellers
      const res: any = await api.get('/admin/resellers', {
        params: { search, page, limit: 10 }
      })
      if (res.success) {
        setResellers(res.data.items)
        setTotal(res.data.meta.total)
      }
    } catch (error) {
      // Using mock data for demonstration if endpoint doesn't exist yet
      setResellers([
        {
          id: 'res_1',
          name: 'Nexus Digital',
          email: 'admin@nexus.io',
          domain: 'nexus.platform.ai',
          status: 'ACTIVE',
          tier: 'GOLD',
          tenantCount: 42,
          mrr: 4200,
          createdAt: new Date().toISOString()
        },
        {
          id: 'res_2',
          name: 'Apex Solutions',
          email: 'contact@apex.com',
          domain: 'apex.platform.ai',
          status: 'ACTIVE',
          tier: 'SILVER',
          tenantCount: 12,
          mrr: 1200,
          createdAt: new Date().toISOString()
        }
      ])
      setTotal(2)
      // toast.error('Failed to fetch resellers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchResellers()
  }, [page, search])

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Resellers</h1>
          <p className="text-zinc-500 text-sm mt-1">Manage partner networks and white-label distributions.</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl gap-2">
          <Plus className="w-4 h-4" />
          Onboard Reseller
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard 
          label="Total Resellers" 
          value="12" 
          subValue="+2 this month" 
          icon={Users} 
          color="blue" 
        />
        <StatsCard 
          label="Partner Revenue" 
          value="$14,200" 
          subValue="MRR share" 
          icon={CreditCard} 
          color="emerald" 
        />
        <StatsCard 
          label="Avg. Tenants/Partner" 
          value="8.4" 
          subValue="Growth: 12%" 
          icon={TrendingUp} 
          color="amber" 
        />
      </div>

      <div className="bg-[#111113] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-blue-400 transition-colors" />
            <Input 
              placeholder="Search resellers..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-white/5 border-white/5 focus:border-blue-500/50 rounded-xl h-10 w-full"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-white/[0.01]">
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-zinc-500 font-semibold py-4">Reseller</TableHead>
                <TableHead className="text-zinc-500 font-semibold">Status</TableHead>
                <TableHead className="text-zinc-500 font-semibold">Tier</TableHead>
                <TableHead className="text-zinc-500 font-semibold">Network</TableHead>
                <TableHead className="text-zinc-500 font-semibold">MRR</TableHead>
                <TableHead className="text-zinc-500 font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && resellers.length === 0 ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i} className="border-white/5">
                    <TableCell colSpan={6} className="py-8 text-center">
                      <div className="flex items-center justify-center gap-3 text-zinc-500">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Loading partners...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                resellers.map((reseller) => (
                  <TableRow key={reseller.id} className="border-white/5 hover:bg-white/[0.02] transition-colors group">
                    <TableCell className="py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10 rounded-xl border border-white/10 group-hover:border-blue-500/30 transition-colors">
                          <AvatarFallback className="bg-emerald-600/10 text-emerald-400 text-xs font-bold uppercase">
                            {reseller.name.substring(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">{reseller.name}</p>
                          <p className="text-xs text-zinc-500">{reseller.domain}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-green-500/10 text-green-400 border-green-500/20 rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-wider">
                        {reseller.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <ShieldCheck className={cn(
                          "w-4 h-4",
                          reseller.tier === 'GOLD' ? "text-amber-400" : "text-zinc-400"
                        )} />
                        <span className="text-sm font-medium text-zinc-300">{reseller.tier}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-zinc-600" />
                        <span className="text-sm font-medium text-white">{reseller.tenantCount} Tenants</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-bold text-white">${reseller.mrr.toLocaleString()}</p>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-zinc-500 hover:text-white hover:bg-white/5 rounded-xl">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-[#111113] border-white/10 text-white rounded-xl shadow-2xl w-48">
                          <DropdownMenuItem className="focus:bg-white/5 focus:text-white cursor-pointer py-2.5 rounded-lg mx-1 my-0.5 gap-3">
                            <Users className="w-4 h-4 text-zinc-400" />
                            <span>View Tenants</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="focus:bg-blue-500/10 focus:text-blue-400 cursor-pointer py-2.5 rounded-lg mx-1 my-0.5 gap-3">
                            <ExternalLink className="w-4 h-4" />
                            <span>Impersonate</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-white/5" />
                          <DropdownMenuItem className="focus:bg-red-500/10 focus:text-red-400 text-red-400 cursor-pointer py-2.5 rounded-lg mx-1 my-0.5 gap-3">
                            <Trash2 className="w-4 h-4" />
                            <span>Remove Partner</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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

function StatsCard({ label, value, subValue, icon: Icon, color }: any) {
  const colors: any = {
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  }

  return (
    <div className="bg-[#111113] border border-white/5 p-6 rounded-2xl shadow-xl relative overflow-hidden group hover:border-white/10 transition-all">
      <div className={cn("absolute -top-4 -right-4 h-24 w-24 blur-3xl opacity-10 group-hover:opacity-20 transition-opacity", colors[color].split(' ')[0])} />
      <div className="flex items-center gap-4 mb-4 relative z-10">
        <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center border shadow-inner", colors[color])}>
          <Icon size={24} />
        </div>
        <div>
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{label}</p>
          <h3 className="text-2xl font-black text-white tracking-tight">{value}</h3>
        </div>
      </div>
      <p className="text-xs text-zinc-600 font-medium relative z-10">{subValue}</p>
    </div>
  )
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ")
}
