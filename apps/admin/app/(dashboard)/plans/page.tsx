'use client'

import React, { useState, useEffect } from 'react'
import { 
  Package, 
  Plus, 
  Check, 
  X, 
  Edit3, 
  MoreVertical, 
  Zap, 
  Cpu, 
  MessageSquare, 
  Database,
  Trash2,
  Lock,
  Globe
} from 'lucide-react'
import { Button } from '@repo/ui/components/button'
import { Badge } from '@repo/ui/components/badge'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@repo/ui/components/dropdown-menu'
import api from '../../../lib/api'
import { toast } from 'sonner'

export default function PlansPage() {
  const [plans, setPlans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPlans = async () => {
    setLoading(true)
    try {
      const res: any = await api.get('/admin/plans')
      if (res.success) {
        setPlans(res.data)
      }
    } catch (error) {
      // Mock data
      setPlans([
        {
          id: 'p1',
          name: 'Starter',
          price: 49,
          interval: 'MONTHLY',
          status: 'ACTIVE',
          features: {
            messages: 5000,
            aiTokens: 100000,
            numbers: 1,
            agents: 2,
            support: 'Email'
          }
        },
        {
          id: 'p2',
          name: 'Growth',
          price: 149,
          interval: 'MONTHLY',
          status: 'ACTIVE',
          isPopular: true,
          features: {
            messages: 25000,
            aiTokens: 500000,
            numbers: 5,
            agents: 10,
            support: 'Priority'
          }
        },
        {
          id: 'p3',
          name: 'Enterprise',
          price: 499,
          interval: 'MONTHLY',
          status: 'ACTIVE',
          features: {
            messages: 100000,
            aiTokens: 2000000,
            numbers: 20,
            agents: 50,
            support: '24/7 Dedicated'
          }
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPlans()
  }, [])

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Subscription Plans</h1>
          <p className="text-zinc-500 text-sm mt-1">Configure pricing tiers, quotas, and feature availability.</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl gap-2 h-12 px-6">
          <Plus className="w-4 h-4" />
          Create New Plan
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <div 
            key={plan.id} 
            className={cn(
              "bg-[#111113] border rounded-3xl p-8 relative overflow-hidden transition-all duration-500 hover:translate-y-[-8px] shadow-2xl",
              plan.isPopular ? "border-blue-500/30 ring-1 ring-blue-500/20" : "border-white/5"
            )}
          >
            {plan.isPopular && (
              <div className="absolute top-0 right-0">
                <div className="bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-8 py-1.5 rotate-45 translate-x-8 translate-y-4 shadow-xl">
                  Popular
                </div>
              </div>
            )}

            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="text-2xl font-black text-white mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-white">${plan.price}</span>
                  <span className="text-zinc-500 text-sm font-bold">/ {plan.interval === 'MONTHLY' ? 'mo' : 'yr'}</span>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-zinc-500 hover:text-white hover:bg-white/5 rounded-xl">
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[#111113] border-white/10 text-white rounded-xl w-40">
                  <DropdownMenuItem className="gap-2 cursor-pointer py-2.5">
                    <Edit3 className="w-4 h-4" /> Edit Plan
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2 cursor-pointer py-2.5 text-red-400 focus:text-red-400">
                    <Trash2 className="w-4 h-4" /> Archive
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="space-y-6 mb-10">
              <FeatureItem icon={MessageSquare} label="Messages" value={`${plan.features.messages.toLocaleString()}`} color="blue" />
              <FeatureItem icon={Cpu} label="AI Tokens" value={`${(plan.features.aiTokens / 1000).toFixed(0)}k`} color="purple" />
              <FeatureItem icon={Globe} label="Phone Numbers" value={plan.features.numbers} color="emerald" />
              <FeatureItem icon={Package} label="Agent Seats" value={plan.features.agents} color="amber" />
            </div>

            <div className="space-y-4 mb-10">
               <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest border-b border-white/5 pb-2">Included Features</p>
               <div className="grid grid-cols-1 gap-3">
                  <IncludedFeature label="White-label Branding" />
                  <IncludedFeature label="Visual Flow Builder" />
                  <IncludedFeature label="Full API Access" />
                  <IncludedFeature label={plan.features.support + " Support"} />
               </div>
            </div>

            <Button className={cn(
              "w-full h-14 rounded-2xl font-black uppercase tracking-widest text-xs transition-all",
              plan.isPopular ? "bg-blue-600 hover:bg-blue-500 shadow-xl shadow-blue-600/20" : "bg-white/5 hover:bg-white/10 border border-white/5"
            )}>
              Manage Tier
            </Button>
          </div>
        ))}

        <button className="border-2 border-dashed border-white/5 rounded-3xl p-8 flex flex-col items-center justify-center text-zinc-600 hover:text-zinc-400 hover:border-white/10 hover:bg-white/[0.01] transition-all group min-h-[500px]">
           <div className="h-16 w-16 bg-white/5 rounded-[2rem] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Plus size={32} />
           </div>
           <p className="text-lg font-black uppercase tracking-tight">Add Custom Tier</p>
           <p className="text-sm font-medium text-center mt-2 max-w-[200px]">Define a specialized plan for enterprise clients.</p>
        </button>
      </div>
    </div>
  )
}

function FeatureItem({ icon: Icon, label, value, color }: any) {
  const colors: any = {
    blue: "text-blue-400 bg-blue-400/10",
    purple: "text-purple-400 bg-purple-400/10",
    emerald: "text-emerald-400 bg-emerald-400/10",
    amber: "text-amber-400 bg-amber-400/10",
  }
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", colors[color])}>
          <Icon size={16} />
        </div>
        <span className="text-sm font-medium text-zinc-400">{label}</span>
      </div>
      <span className="text-sm font-black text-white">{value}</span>
    </div>
  )
}

function IncludedFeature({ label }: any) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-5 w-5 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
        <Check size={12} />
      </div>
      <span className="text-xs font-medium text-zinc-300">{label}</span>
    </div>
  )
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ")
}
