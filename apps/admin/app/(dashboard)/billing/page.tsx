'use client'

import React, { useState, useEffect } from 'react'
import { 
  DollarSign, 
  TrendingUp, 
  CreditCard, 
  ArrowUpRight, 
  ArrowDownRight, 
  Calendar, 
  Download, 
  Filter,
  Users,
  Building2,
  PieChart as PieChartIcon,
  Activity,
  History,
  Lock,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle
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
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  BarChart,
  Bar
} from 'recharts'

const mockData = [
  { name: 'Jan', revenue: 4500, users: 120 },
  { name: 'Feb', revenue: 5200, users: 145 },
  { name: 'Mar', revenue: 6100, users: 170 },
  { name: 'Apr', revenue: 5900, users: 165 },
  { name: 'May', revenue: 7800, users: 210 },
  { name: 'Jun', revenue: 9200, users: 250 },
]

export default function GlobalBillingPage() {
  const [loading, setLoading] = useState(false)

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
             <DollarSign className="text-emerald-500" /> Revenue & Financial Control
          </h1>
          <p className="text-zinc-500 text-sm mt-1">Platform-wide MRR, Reseller settlements, and payment health.</p>
        </div>
        <div className="flex items-center gap-4">
           <Button variant="outline" className="border-white/5 bg-white/5 text-zinc-400 hover:text-white rounded-xl gap-2 h-12 px-6">
              <Download size={18} /> Financial Report
           </Button>
           <Button className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl gap-2 h-12 px-6 shadow-xl shadow-emerald-600/20">
              <RefreshCw size={18} /> Process Settlements
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         <FinancialStat label="Platform MRR" value="$142,400" trend="+12.4%" icon={TrendingUp} color="emerald" />
         <FinancialStat label="Pending Payouts" value="$12,100" trend="Next: 24h" icon={History} color="blue" />
         <FinancialStat label="Active Subscribers" value="842" trend="+5.2%" icon={Users} color="purple" />
         <FinancialStat label="Churn Rate" value="1.84%" trend="-0.2%" icon={Activity} color="rose" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 bg-[#111113] border border-white/5 rounded-3xl p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-10">
               <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">Revenue Stream</h3>
                  <p className="text-xs text-zinc-500 mt-1">Net revenue after reseller commissions.</p>
               </div>
               <div className="flex gap-2">
                  <Badge className="bg-white/5 text-zinc-500 border-none px-3 py-1 font-black text-[10px]">6 MONTHS</Badge>
               </div>
            </div>
            <div className="h-[350px]">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mockData}>
                     <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                           <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                     <XAxis dataKey="name" stroke="#ffffff20" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} />
                     <YAxis stroke="#ffffff20" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} />
                     <Tooltip 
                        contentStyle={{ backgroundColor: '#111113', border: '1px solid #ffffff10', borderRadius: '16px' }}
                        itemStyle={{ fontSize: '10px', fontWeight: 'bold' }}
                     />
                     <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
         </div>

         <div className="bg-[#111113] border border-white/5 rounded-3xl p-8 shadow-2xl flex flex-col justify-between">
            <div className="space-y-2">
               <h3 className="text-lg font-bold text-white tracking-tight">Payment Gateways</h3>
               <p className="text-xs text-zinc-500 italic">Global health of integrated payment nodes.</p>
            </div>
            <div className="space-y-4 py-8">
               <GatewayStatus name="Stripe Connect" status="Active" health="100%" />
               <GatewayStatus name="Razorpay" status="Active" health="99.8%" />
               <GatewayStatus name="PayPal" status="Active" health="100%" />
               <GatewayStatus name="Manual Bank" status="Limited" health="84%" />
            </div>
            <Button variant="ghost" className="w-full border border-white/5 text-zinc-500 hover:text-white h-12 rounded-xl text-[10px] font-black uppercase tracking-widest gap-2">
               <Lock size={14} /> Configure Gateways
            </Button>
         </div>
      </div>

      <div className="bg-[#111113] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
         <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
            <h3 className="text-lg font-bold text-white tracking-tight">Recent Transactions</h3>
            <div className="flex items-center gap-3">
               <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <Input placeholder="Search records..." className="pl-10 bg-white/5 border-white/5 h-10 w-64 rounded-xl" />
               </div>
            </div>
         </div>
         <Table>
            <TableHeader className="bg-white/[0.01]">
               <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="text-zinc-500 font-semibold py-4">Transaction ID</TableHead>
                  <TableHead className="text-zinc-500 font-semibold">Entity</TableHead>
                  <TableHead className="text-zinc-500 font-semibold">Plan</TableHead>
                  <TableHead className="text-zinc-500 font-semibold">Amount</TableHead>
                  <TableHead className="text-zinc-500 font-semibold">Status</TableHead>
                  <TableHead className="text-zinc-500 font-semibold text-right">Date</TableHead>
               </TableRow>
            </TableHeader>
            <TableBody>
               {[
                 { id: 'TX_9921', name: 'Acme Corp', slug: 'acme', plan: 'Enterprise', amount: '$499.00', status: 'SUCCESS', date: '2m ago' },
                 { id: 'TX_9920', name: 'Nexus Digital', slug: 'nexus', plan: 'Growth', amount: '$149.00', status: 'SUCCESS', date: '1h ago' },
                 { id: 'TX_9919', name: 'Sarah Wilson', slug: 'sarah', plan: 'Starter', amount: '$49.00', status: 'PENDING', date: '3h ago' },
               ].map((tx) => (
                  <TableRow key={tx.id} className="border-white/5 hover:bg-white/[0.02] transition-colors group">
                     <TableCell className="py-4 font-mono text-xs text-zinc-400">{tx.id}</TableCell>
                     <TableCell>
                        <div>
                           <p className="text-sm font-bold text-white">{tx.name}</p>
                           <p className="text-[10px] text-zinc-600 uppercase font-black">{tx.slug}</p>
                        </div>
                     </TableCell>
                     <TableCell>
                        <Badge className="bg-white/5 text-zinc-500 border-none rounded-lg text-[10px] font-black uppercase tracking-widest px-2 py-0.5">
                           {tx.plan}
                        </Badge>
                     </TableCell>
                     <TableCell className="text-sm font-black text-white">{tx.amount}</TableCell>
                     <TableCell>
                        <Badge className={cn(
                           "rounded-lg px-2 py-1 text-[9px] font-black uppercase tracking-widest border-none",
                           tx.status === 'SUCCESS' ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                        )}>
                           {tx.status}
                        </Badge>
                     </TableCell>
                     <TableCell className="text-right text-xs text-zinc-500">{tx.date}</TableCell>
                  </TableRow>
               ))}
            </TableBody>
         </Table>
      </div>
    </div>
  )
}

function FinancialStat({ label, value, trend, icon: Icon, color }: any) {
  const colors: any = {
    emerald: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
    blue: "text-blue-400 bg-blue-400/10 border-blue-400/20",
    purple: "text-purple-400 bg-purple-400/10 border-purple-400/20",
    rose: "text-rose-400 bg-rose-400/10 border-rose-400/20",
  }
  return (
    <div className="bg-[#111113] border border-white/5 p-6 rounded-3xl shadow-xl space-y-4">
       <div className="flex items-center justify-between">
          <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center border", colors[color])}>
             <Icon size={20} />
          </div>
          <Badge className="bg-white/5 text-zinc-500 border-none text-[10px] font-black">{trend}</Badge>
       </div>
       <div>
          <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{label}</p>
          <h3 className="text-2xl font-black text-white tracking-tight">{value}</h3>
       </div>
    </div>
  )
}

function GatewayStatus({ name, status, health }: any) {
  return (
    <div className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl">
       <div className="flex items-center gap-3">
          <CreditCard className="w-4 h-4 text-zinc-500" />
          <span className="text-sm font-bold text-white">{name}</span>
       </div>
       <div className="flex items-center gap-3">
          <span className="text-[10px] font-black text-zinc-600 uppercase">{health} health</span>
          <Badge className={cn(
             "rounded-lg px-2 py-0.5 text-[8px] font-black uppercase tracking-widest border-none",
             status === 'Active' ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
          )}>
             {status}
          </Badge>
       </div>
    </div>
  )
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ")
}
