'use client'

import React from 'react'
import { 
  Users, 
  CreditCard, 
  MessageSquare, 
  Zap, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  Activity,
  Plus
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@repo/ui/components/card'
import { Button } from '@repo/ui/components/button'
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts'

const data = [
  { name: 'May 1', tenants: 45, mrr: 4500, messages: 12000 },
  { name: 'May 2', tenants: 48, mrr: 4800, messages: 15000 },
  { name: 'May 3', tenants: 52, mrr: 5200, messages: 18000 },
  { name: 'May 4', tenants: 51, mrr: 5100, messages: 14000 },
  { name: 'May 5', tenants: 55, mrr: 5500, messages: 21000 },
  { name: 'May 6', tenants: 59, mrr: 5900, messages: 25000 },
  { name: 'May 7', tenants: 64, mrr: 6400, messages: 28000 },
]

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Platform Overview</h1>
          <p className="text-zinc-500 mt-1">Real-time health and performance metrics across all tenants.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="bg-white/5 border-white/5 hover:bg-white/10 rounded-xl">
            Export Report
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl gap-2 shadow-lg shadow-blue-600/20">
            <Plus className="w-4 h-4" />
            New Tenant
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
          title="Total Tenants" 
          value="1,284" 
          change="+12.5%" 
          trend="up" 
          icon={Users} 
          description="Active paying instances"
        />
        <StatsCard 
          title="Monthly Revenue" 
          value="₹842,500" 
          change="+8.2%" 
          trend="up" 
          icon={CreditCard} 
          description="MRR across all resellers"
          prefix="true"
        />
        <StatsCard 
          title="Daily Messages" 
          value="245.8k" 
          change="-2.4%" 
          trend="down" 
          icon={MessageSquare} 
          description="Throughput in last 24h"
        />
        <StatsCard 
          title="AI Tokens Used" 
          value="14.2M" 
          change="+24.1%" 
          trend="up" 
          icon={Zap} 
          description="Total platform consumption"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-[#111113] border-white/5 rounded-2xl overflow-hidden shadow-2xl">
          <CardHeader className="border-b border-white/5 bg-white/[0.02] p-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-white">Growth & Revenue</CardTitle>
                <CardDescription className="text-zinc-500">Subscription and MRR trend over last 7 days</CardDescription>
              </div>
              <div className="flex gap-2">
                 <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[10px] font-bold text-blue-400 uppercase tracking-widest">Tenants</div>
                 <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-[10px] font-bold text-cyan-400 uppercase tracking-widest">MRR</div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorTenants" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorMRR" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#71717a" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  dy={10}
                />
                <YAxis 
                  stroke="#71717a" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(value) => `${value}`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111113', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  itemStyle={{ fontSize: '12px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="tenants" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorTenants)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="mrr" 
                  stroke="#06b6d4" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorMRR)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-[#111113] border-white/5 rounded-2xl overflow-hidden shadow-2xl">
          <CardHeader className="border-b border-white/5 bg-white/[0.02] p-6">
            <CardTitle className="text-lg font-semibold text-white">System Health</CardTitle>
            <CardDescription className="text-zinc-500">Real-time service status</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <HealthItem name="API Server" status="Operational" latency="42ms" progress={98} color="blue" />
            <HealthItem name="Database Cluster" status="Healthy" latency="8ms" progress={100} color="cyan" />
            <HealthItem name="Redis Cache" status="Optimal" latency="2ms" progress={100} color="purple" />
            <HealthItem name="BullMQ Worker" status="Active" latency="Idle" progress={100} color="green" />
            <HealthItem name="Meta API Bridge" status="Delayed" latency="1240ms" progress={65} color="yellow" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function StatsCard({ title, value, change, trend, icon: Icon, description, prefix = "false" }: any) {
  return (
    <Card className="bg-[#111113] border-white/5 rounded-2xl hover:border-white/10 transition-all group overflow-hidden relative shadow-lg">
      <div className={cn(
        "absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full blur-3xl opacity-10 transition-opacity group-hover:opacity-20",
        trend === 'up' ? "bg-blue-500" : "bg-red-500"
      )} />
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-zinc-400 group-hover:text-white transition-colors">
            <Icon className="w-5 h-5" />
          </div>
          <div className={cn(
            "flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold tracking-wider uppercase",
            trend === 'up' ? "bg-blue-500/10 text-blue-400" : "bg-red-500/10 text-red-400"
          )}>
            {trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {change}
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-zinc-500 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-white tabular-nums tracking-tight">{value}</h3>
          <p className="text-xs text-zinc-600 mt-2 font-medium">{description}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function HealthItem({ name, status, latency, progress, color }: any) {
  const colorMap: any = {
    blue: "bg-blue-500",
    cyan: "bg-cyan-500",
    purple: "bg-purple-500",
    green: "bg-green-500",
    yellow: "bg-yellow-500"
  }
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs font-medium">
        <span className="text-zinc-300">{name}</span>
        <div className="flex items-center gap-3">
          <span className="text-zinc-500 tabular-nums">{latency}</span>
          <span className={cn(
            "px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider",
            status === 'Operational' || status === 'Healthy' || status === 'Optimal' || status === 'Active' 
              ? "bg-green-500/10 text-green-400" 
              : "bg-yellow-500/10 text-yellow-400"
          )}>{status}</span>
        </div>
      </div>
      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
        <div 
          className={cn("h-full rounded-full transition-all duration-1000", colorMap[color])} 
          style={{ width: `${progress}%` }} 
        />
      </div>
    </div>
  )
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ")
}
