'use client'
import Link from 'next/link'
import React, { useState, useEffect } from 'react'
import { 
  Search, 
  Filter, 
  MoreVertical, 
  Eye, 
  UserPlus, 
  PauseCircle, 
  PlayCircle,
  Trash2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Loader2
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@repo/ui/components/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/components/avatar'
import api from '../../../lib/api'
import { toast } from 'sonner'

export default function TenantsPage() {
  const [tenants, setTenants] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  
  const [createOpen, setCreateOpen] = useState(false)
  const [newTenant, setNewTenant] = useState({ name: '', slug: '', email: '' })
  const [createLoading, setCreateLoading] = useState(false)

  const fetchTenants = async () => {
    setLoading(true)
    try {
      const res: any = await api.get('/admin/tenants', {
        params: { search, page, limit: 10 }
      })
      if (res.success) {
        setTenants(res.data.items)
        setTotal(res.data.meta.total)
      }
    } catch (error) {
      toast.error('Failed to fetch tenants')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateLoading(true)
    try {
      const res: any = await api.post('/admin/tenants', newTenant)
      if (res.success) {
        toast.success('Tenant created successfully')
        setCreateOpen(false)
        setNewTenant({ name: '', slug: '', email: '' })
        fetchTenants()
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create tenant')
    } finally {
      setCreateLoading(false)
    }
  }

  useEffect(() => {
    fetchTenants()
  }, [page, search])

  const handleImpersonate = async (tenantId: string) => {
    try {
      const res: any = await api.post(`/admin/tenants/${tenantId}/impersonate`)
      if (res.success) {
        toast.success('Redirecting to tenant dashboard...')
        // In a real app, you'd set the token and redirect to the tenant domain
        window.open(`${process.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:3000'}/login?token=${res.data.token}`, '_blank')
      }
    } catch (error) {
      toast.error('Impersonation failed')
    }
  }

  const handleToggleStatus = async (tenant: any) => {
    const action = tenant.status === 'SUSPENDED' ? 'activate' : 'suspend'
    try {
      const res: any = await api.post(`/admin/tenants/${tenant.id}/${action}`)
      if (res.success) {
        toast.success(`Tenant ${action}d successfully`)
        fetchTenants()
      }
    } catch (error) {
      toast.error(`Failed to ${action} tenant`)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Tenants</h1>
          <p className="text-zinc-500 text-sm mt-1">Manage all platform instances and subscriptions.</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl gap-2">
              <UserPlus className="w-4 h-4" />
              Create Tenant
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#111113] border-white/10 sm:max-w-[425px] rounded-[2rem]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-white">Create New Tenant</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateTenant} className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 uppercase">Tenant Name</label>
                <Input required value={newTenant.name} onChange={e => setNewTenant({...newTenant, name: e.target.value})} className="bg-white/5 border-white/10 text-white rounded-xl" placeholder="Acme Corp" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 uppercase">Tenant Slug (Domain)</label>
                <Input required value={newTenant.slug} onChange={e => setNewTenant({...newTenant, slug: e.target.value})} className="bg-white/5 border-white/10 text-white rounded-xl" placeholder="acme" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 uppercase">Owner Email</label>
                <Input type="email" required value={newTenant.email} onChange={e => setNewTenant({...newTenant, email: e.target.value})} className="bg-white/5 border-white/10 text-white rounded-xl" placeholder="founder@acme.com" />
              </div>
              <Button type="submit" disabled={createLoading} className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold mt-4">
                {createLoading ? 'Creating...' : 'Provision Tenant'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-[#111113] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-blue-400 transition-colors" />
            <Input 
              placeholder="Search by name, email or slug..." 
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
                <TableHead className="text-zinc-500 font-semibold py-4">Tenant</TableHead>
                <TableHead className="text-zinc-500 font-semibold">Status</TableHead>
                <TableHead className="text-zinc-500 font-semibold">Plan</TableHead>
                <TableHead className="text-zinc-500 font-semibold">Usage</TableHead>
                <TableHead className="text-zinc-500 font-semibold">Created</TableHead>
                <TableHead className="text-zinc-500 font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-white/5">
                    <TableCell colSpan={6} className="py-8 text-center">
                      <div className="flex items-center justify-center gap-3 text-zinc-500">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Loading tenants...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : tenants.length === 0 ? (
                <TableRow className="border-white/5">
                  <TableCell colSpan={6} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-zinc-600">
                        <Building2 className="w-6 h-6" />
                      </div>
                      <p className="text-zinc-400 font-medium">No tenants found</p>
                      <p className="text-zinc-600 text-sm">Try adjusting your search or filters.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                tenants.map((tenant) => (
                  <TableRow key={tenant.id} className="border-white/5 hover:bg-white/[0.02] transition-colors group">
                    <TableCell className="py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10 rounded-xl border border-white/10 group-hover:border-blue-500/30 transition-colors">
                          <AvatarFallback className="bg-blue-600/10 text-blue-400 text-xs font-bold uppercase">
                            {tenant.name.substring(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">{tenant.name}</p>
                          <p className="text-xs text-zinc-500">{tenant.slug}.platform.ai</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn(
                        "rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-wider",
                        tenant.status === 'ACTIVE' ? "bg-green-500/10 text-green-400 border-green-500/20" :
                        tenant.status === 'TRIAL' ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                        "bg-red-500/10 text-red-400 border-red-500/20"
                      )}>
                        {tenant.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-medium text-zinc-300">{tenant.subscription?.plan?.name || 'No Plan'}</p>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Monthly</p>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1.5 w-32">
                        <div className="flex justify-between text-[10px] font-bold uppercase text-zinc-500">
                          <span>Usage</span>
                          <span>65%</span>
                        </div>
                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full w-[65%]" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-zinc-400">{new Date(tenant.createdAt).toLocaleDateString()}</p>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-zinc-500 hover:text-white hover:bg-white/5 rounded-xl">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-[#111113] border-white/10 text-white rounded-xl shadow-2xl w-48">
                          <DropdownMenuItem asChild className="focus:bg-white/5 focus:text-white cursor-pointer py-2.5 rounded-lg mx-1 my-0.5 gap-3">
                            <Link href={`/tenants/${tenant.id}`} className="flex items-center w-full">
                              <Eye className="w-4 h-4 text-zinc-400 mr-2" />
                              <span>View Details</span>
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleImpersonate(tenant.id)}
                            className="focus:bg-blue-500/10 focus:text-blue-400 cursor-pointer py-2.5 rounded-lg mx-1 my-0.5 gap-3"
                          >
                            <ExternalLink className="w-4 h-4" />
                            <span>Impersonate</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-white/5" />
                          <DropdownMenuItem 
                            onClick={() => handleToggleStatus(tenant)}
                            className={cn(
                              "focus:bg-white/5 cursor-pointer py-2.5 rounded-lg mx-1 my-0.5 gap-3",
                              tenant.status === 'SUSPENDED' ? "text-green-400 focus:text-green-400" : "text-yellow-400 focus:text-yellow-400"
                            )}
                          >
                            {tenant.status === 'SUSPENDED' ? <PlayCircle className="w-4 h-4" /> : <PauseCircle className="w-4 h-4" />}
                            <span>{tenant.status === 'SUSPENDED' ? 'Activate' : 'Suspend'}</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="focus:bg-red-500/10 focus:text-red-400 text-red-400 cursor-pointer py-2.5 rounded-lg mx-1 my-0.5 gap-3">
                            <Trash2 className="w-4 h-4" />
                            <span>Delete</span>
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

        <div className="p-4 border-t border-white/5 bg-white/[0.01] flex items-center justify-between">
          <p className="text-xs text-zinc-500 font-medium">
            Showing <span className="text-white">{(page - 1) * 10 + 1}</span> to <span className="text-white">{Math.min(page * 10, total)}</span> of <span className="text-white">{total}</span> tenants
          </p>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon" 
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="bg-white/5 border-white/5 hover:bg-white/10 rounded-xl disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon"
              disabled={page * 10 >= total}
              onClick={() => setPage(page + 1)}
              className="bg-white/5 border-white/5 hover:bg-white/10 rounded-xl disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ")
}

function Building2(props: any) {
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
      <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
      <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
      <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
      <path d="M10 6h4" />
      <path d="M10 10h4" />
      <path d="M10 14h4" />
      <path d="M10 18h4" />
    </svg>
  )
}
