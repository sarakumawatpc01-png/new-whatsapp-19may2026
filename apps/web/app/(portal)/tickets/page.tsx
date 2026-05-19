"use client";

import { useState, useEffect } from "react";
import { 
  Ticket, 
  Search, 
  Filter, 
  Plus, 
  ChevronRight, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  MessageSquare,
  ShieldCheck,
  Zap,
  ArrowRight,
  User,
  Settings,
  BrainCircuit
} from "lucide-react";
import { 
  Button, 
  Input, 
  Card, 
  Badge, 
  Avatar, 
  Skeleton,
  Tabs,
  TabsList,
  TabsTrigger
} from "@repo/ui";
import { cn } from "@repo/ui";
import { format } from "date-fns";

export default function CustomerTicketsPage() {
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<any[]>([]);

  useEffect(() => {
    // Mock load
    setTimeout(() => {
      setTickets([
        { id: "T-1024", title: "API Integration Error", status: "OPEN", priority: "HIGH", createdAt: new Date().toISOString() },
        { id: "T-1023", title: "Billing Cycle Inquiry", status: "RESOLVED", priority: "MEDIUM", createdAt: new Date(Date.now() - 86400000).toISOString() },
        { id: "T-1021", title: "Neural Sync Latency", status: "CLOSED", priority: "LOW", createdAt: new Date(Date.now() - 259200000).toISOString() },
      ]);
      setLoading(false);
    }, 1200);
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-12 space-y-12 animate-in fade-in duration-700">
      {/* Portal Header */}
      <div className="flex items-center justify-between bg-black/40 p-10 rounded-[3rem] border border-white/5 relative overflow-hidden backdrop-blur-3xl shadow-2xl">
        <div className="absolute top-0 right-0 h-full w-1/3 bg-[radial-gradient(circle_at_100%_0%,rgba(var(--primary-rgb),0.1),transparent)]" />
        <div className="relative z-10 flex items-center gap-8">
           <div className="h-20 w-20 bg-primary/10 rounded-[2.5rem] border-2 border-primary/20 flex items-center justify-center text-primary shadow-2xl shadow-primary/20">
              <ShieldCheck size={40} />
           </div>
           <div>
              <h1 className="text-4xl font-black text-white tracking-tight">Customer Service Vault</h1>
              <p className="text-gray-500 text-sm font-medium italic mt-1">Manage your support nodes and communication history.</p>
           </div>
        </div>
        <div className="relative z-10">
           <Button className="h-16 px-10 rounded-2xl gap-3 bg-primary text-white font-black uppercase tracking-widest shadow-2xl shadow-primary/30">
              <Plus size={24} /> New Support Node
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-10">
         {/* Sidebar Triage */}
         <div className="col-span-3 space-y-8">
            <div className="p-8 bg-black/40 rounded-[2.5rem] border border-white/5 space-y-8 shadow-2xl">
               <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] px-2">Registry Filters</h3>
                  <div className="space-y-2">
                     {[
                       { label: "Active Nodes", count: 1, icon: Zap, color: "text-emerald-500" },
                       { label: "Resolved Nodes", count: 12, icon: CheckCircle2, color: "text-blue-500" },
                       { label: "Critical Priority", count: 0, icon: AlertCircle, color: "text-rose-500" },
                     ].map((f, i) => (
                       <button key={i} className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-white/5 transition-all group">
                          <div className="flex items-center gap-3">
                             <f.icon size={16} className={f.color} />
                             <span className="text-xs font-bold text-gray-400 group-hover:text-white">{f.label}</span>
                          </div>
                          <Badge className="bg-white/5 text-gray-600 border-none px-2 py-0.5 text-[9px]">{f.count}</Badge>
                       </button>
                     ))}
                  </div>
               </div>
            </div>

            <Card className="p-8 bg-primary/5 border-primary/20 rounded-[2.5rem] shadow-2xl space-y-4 relative overflow-hidden group">
               <div className="absolute top-0 right-0 h-full w-full bg-[radial-gradient(circle_at_100%_100%,rgba(var(--primary-rgb),0.1),transparent)]" />
               <BrainCircuit className="text-primary opacity-20 absolute -bottom-4 -right-4" size={120} />
               <div className="relative z-10 space-y-4">
                  <h4 className="text-lg font-black text-white leading-tight">Need Instant Intelligence?</h4>
                  <p className="text-xs text-gray-500 font-medium italic leading-relaxed">Our Neural Pilot is available 24/7 to resolve technical queries in real-time.</p>
                  <Button variant="ghost" className="w-full h-12 rounded-xl bg-primary/10 text-primary font-black uppercase text-[10px] tracking-widest hover:bg-primary/20 transition-all gap-2">
                     Activate Neural Chat <ArrowRight size={14} />
                  </Button>
               </div>
            </Card>
         </div>

         {/* Ticket Registry */}
         <div className="col-span-9 space-y-6">
            <div className="relative group">
               <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-primary transition-colors" size={24} />
               <Input 
                 placeholder="Search registry for ticket ID or keyword..." 
                 className="h-20 pl-20 bg-black/40 border-white/5 rounded-[2rem] text-lg font-bold shadow-2xl focus:border-primary/40 transition-all placeholder:text-gray-800" 
               />
            </div>

            <div className="space-y-4">
               {loading ? [1,2,3].map(i => <Skeleton key={i} className="h-32 w-full bg-white/5 rounded-[2.5rem]" />) : tickets.map((t) => (
                 <Card key={t.id} className="p-8 bg-black/40 border-white/5 rounded-[2.5rem] group hover:border-primary/20 hover:bg-black/60 transition-all cursor-pointer shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 h-full w-1.5 bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex items-center justify-between gap-8 relative z-10">
                       <div className="flex items-center gap-8">
                          <div className={cn(
                            "h-16 w-16 rounded-2xl flex items-center justify-center border-2 shadow-2xl transition-transform group-hover:rotate-6",
                            t.status === 'OPEN' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-white/5 text-gray-600 border-white/5"
                          )}>
                             <Ticket size={32} />
                          </div>
                          <div className="space-y-1">
                             <div className="flex items-center gap-3">
                                <span className="text-[10px] font-black text-primary font-mono uppercase tracking-widest">{t.id}</span>
                                <Badge className={cn(
                                  "border-none text-[8px] font-black px-2 uppercase tracking-widest",
                                  t.priority === 'HIGH' ? "bg-rose-500/10 text-rose-500" : "bg-white/5 text-gray-500"
                                )}>{t.priority} PRIORITY</Badge>
                             </div>
                             <h4 className="text-xl font-black text-white tracking-tight">{t.title}</h4>
                             <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest flex items-center gap-2">
                                <Clock size={12} /> Registry Synchronized: {format(new Date(t.createdAt), "MMM d, HH:mm")}
                             </p>
                          </div>
                       </div>

                       <div className="flex items-center gap-8">
                          <div className="text-right">
                             <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-1">Current Status</p>
                             <Badge className={cn(
                               "px-4 py-1.5 rounded-lg font-black text-[9px] uppercase tracking-[0.1em] border-none",
                               t.status === 'OPEN' ? "bg-emerald-500 text-black" : "bg-white/5 text-gray-500"
                             )}>{t.status}</Badge>
                          </div>
                          <Button variant="ghost" size="icon" className="h-14 w-14 rounded-2xl bg-white/5 border border-white/5 text-gray-600 group-hover:text-primary transition-all">
                             <ChevronRight size={28} />
                          </Button>
                       </div>
                    </div>
                 </Card>
               ))}
               {!loading && tickets.length === 0 && (
                 <div className="py-40 flex flex-col items-center justify-center opacity-10 grayscale">
                    <Ticket size={96} className="mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-[0.5em]">Neural Vault Empty</p>
                 </div>
               )}
            </div>
         </div>
      </div>
    </div>
  );
}
