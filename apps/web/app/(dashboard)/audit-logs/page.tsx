"use client";

import { useState, useEffect } from "react";
import { 
  Shield, 
  Search, 
  Filter, 
  Download, 
  Clock, 
  User, 
  Globe, 
  Activity, 
  Lock, 
  Cpu, 
  AlertTriangle,
  ChevronRight,
  Database,
  History,
  FileText,
  Key,
  ShieldCheck
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
import api from "@/lib/api";

export default function AuditLogsPage() {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      // In a real app we'd fetch from API
      // Mocking high-fidelity audit data
      setLogs([
        { id: "1", action: "AI_MATRIX_COMPILE", user: "System", target: "Neural Core", status: "SUCCESS", ip: "10.0.0.1", createdAt: new Date().toISOString() },
        { id: "2", action: "API_KEY_CREATED", user: "Admin (Infinix)", target: "Main Integration", status: "SUCCESS", ip: "192.168.1.5", createdAt: new Date(Date.now() - 3600000).toISOString() },
        { id: "3", action: "TENANT_SETTING_UPDATE", user: "Agent_42", target: "Branding Config", status: "SUCCESS", ip: "45.12.3.99", createdAt: new Date(Date.now() - 7200000).toISOString() },
        { id: "4", action: "LOGIN_ATTEMPT", user: "Unknown", target: "Auth Node", status: "FAILED", ip: "185.234.1.2", createdAt: new Date(Date.now() - 86400000).toISOString() },
      ]);
    } catch (e) {
      console.error("Audit registry link failed");
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes("CREATE") || action.includes("COMPILE")) return "text-emerald-500 bg-emerald-500/10";
    if (action.includes("DELETE") || action.includes("FAILED")) return "text-rose-500 bg-rose-500/10";
    if (action.includes("UPDATE")) return "text-amber-500 bg-amber-500/10";
    return "text-blue-500 bg-blue-500/10";
  };

  return (
    <div className="p-8 max-w-full space-y-10 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex items-center justify-between bg-black/40 p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden backdrop-blur-xl shadow-2xl">
        <div className="absolute top-0 left-0 h-full w-full bg-[radial-gradient(circle_at_50%_-20%,rgba(var(--primary-rgb),0.15),transparent)] opacity-50" />
        <div className="relative z-10 flex items-center gap-6">
           <div className="h-16 w-16 bg-white/5 rounded-[1.5rem] border border-white/10 flex items-center justify-center text-primary shadow-2xl">
              <History size={32} />
           </div>
           <div>
              <h1 className="text-3xl font-black text-white tracking-tight">System Audit Registry</h1>
              <div className="flex items-center gap-3 mt-1">
                 <Badge className="bg-emerald-500/10 text-emerald-500 border-none font-black px-2 uppercase text-[9px] tracking-widest">Immutable Logs</Badge>
                 <div className="h-1.5 w-1.5 rounded-full bg-gray-800" />
                 <p className="text-xs text-gray-400 font-medium italic">Tracing every neural interaction and administrative directive.</p>
              </div>
           </div>
        </div>
        <div className="relative z-10 flex gap-4">
           <Button variant="outline" className="h-12 px-6 gap-2 border-white/10 hover:bg-white/5 text-gray-300 rounded-xl text-[10px] font-black uppercase tracking-widest">
              <Download size={18} /> Export Protocol
           </Button>
        </div>
      </div>

      {/* Triage Grid */}
      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-9 space-y-6">
           <div className="flex items-center gap-4">
              <div className="relative flex-1 group">
                 <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-primary transition-colors" size={20} />
                 <Input 
                   placeholder="Search by Action, Actor, or IP..." 
                   className="h-16 pl-16 bg-black/40 border-white/5 rounded-2xl text-base font-bold shadow-2xl focus:border-primary/40 transition-all placeholder:text-gray-800" 
                 />
              </div>
              <Button variant="outline" className="h-16 px-8 border-white/10 rounded-2xl gap-3 text-xs font-black uppercase tracking-widest">
                 <Filter size={20} /> Filters
              </Button>
           </div>

           <div className="space-y-4">
              {loading ? [1,2,3,4,5].map(i => <Skeleton key={i} className="h-24 w-full bg-white/5 rounded-[2rem]" />) : logs.map((log) => (
                <Card key={log.id} className="p-6 bg-black/40 border-white/5 rounded-[2rem] group hover:border-primary/20 hover:bg-black/60 transition-all cursor-pointer shadow-xl relative overflow-hidden">
                   <div className="flex items-center justify-between gap-8 relative z-10">
                      <div className="flex items-center gap-6">
                         <div className={cn(
                           "h-12 w-12 rounded-xl flex items-center justify-center border transition-all group-hover:scale-110",
                           getActionColor(log.action)
                         )}>
                            {log.action.includes("AI") ? <Cpu size={20} /> : log.action.includes("KEY") ? <Key size={20} /> : <Activity size={20} />}
                         </div>
                         <div>
                            <h4 className="text-sm font-black text-white tracking-widest uppercase">{log.action.replace(/_/g, ' ')}</h4>
                            <div className="flex items-center gap-3 mt-1">
                               <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
                                  <User size={10} className="text-primary" /> {log.user}
                               </p>
                               <div className="h-1 w-1 rounded-full bg-gray-800" />
                               <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
                                  <Globe size={10} className="text-blue-500" /> {log.ip}
                               </p>
                            </div>
                         </div>
                      </div>

                      <div className="flex items-center gap-10">
                         <div className="text-right">
                            <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-1">Target Resource</p>
                            <p className="text-xs font-bold text-white uppercase tracking-tight">{log.target}</p>
                         </div>
                         <div className="text-right w-32">
                            <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-1">Timestamp</p>
                            <p className="text-xs font-black text-gray-400 font-mono">{format(new Date(log.createdAt), "HH:mm:ss")}</p>
                         </div>
                         <div className={cn(
                           "px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest",
                           log.status === 'SUCCESS' ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                         )}>
                            {log.status}
                         </div>
                         <Button variant="ghost" size="icon" className="h-10 w-10 text-gray-700 hover:text-white transition-colors">
                            <ChevronRight size={20} />
                         </Button>
                      </div>
                   </div>
                </Card>
              ))}
           </div>
        </div>

        {/* Intelligence Sidebar */}
        <div className="col-span-12 lg:col-span-3 space-y-8">
           <Card className="p-8 bg-black/40 border-white/5 rounded-[2.5rem] shadow-2xl space-y-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 h-full w-full bg-[radial-gradient(circle_at_100%_0%,rgba(var(--primary-rgb),0.05),transparent)]" />
              <div className="space-y-4 relative z-10">
                 <h3 className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] px-1 flex items-center gap-2">
                    <Shield size={14} className="text-primary" /> Security Health
                 </h3>
                 <div className="space-y-4">
                    {[
                      { label: "Administrative Actions", val: "1,204", trend: "+12%", color: "text-emerald-500" },
                      { label: "Failed Auth Attempts", val: "4", trend: "-80%", color: "text-rose-500" },
                      { label: "IP Geographies", val: "3", trend: "0%", color: "text-blue-500" },
                    ].map((s, i) => (
                      <div key={i} className="p-4 bg-white/[0.02] rounded-2xl border border-white/5 space-y-1">
                         <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{s.label}</p>
                         <div className="flex items-center justify-between">
                            <h4 className="text-xl font-black text-white font-mono">{s.val}</h4>
                            <span className={cn("text-[9px] font-black", s.color)}>{s.trend}</span>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
              <Button className="w-full h-14 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 text-[10px] font-black uppercase tracking-widest text-white relative z-10 gap-3">
                 <Lock size={16} className="text-primary" /> Manage Security Nodes
              </Button>
           </Card>

           <Card className="p-8 bg-black/40 border-white/5 rounded-[2.5rem] shadow-2xl space-y-4">
              <h3 className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] px-1">Compliance Matrix</h3>
              <div className="space-y-4">
                 {[
                   { label: "SOC2 Compliance", val: "94%", color: "bg-emerald-500" },
                   { label: "GDPR Adherence", val: "100%", color: "bg-primary" },
                   { label: "Data Encryption", val: "100%", color: "bg-blue-500" },
                 ].map((c, i) => (
                   <div key={i} className="space-y-2">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                         <span className="text-gray-500">{c.label}</span>
                         <span className="text-white">{c.val}</span>
                      </div>
                      <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                         <div className={cn("h-full", c.color)} style={{ width: c.val }} />
                      </div>
                   </div>
                 ))}
              </div>
              <div className="pt-4 flex items-center justify-center">
                 <p className="text-[8px] font-black text-gray-700 uppercase tracking-[0.2em] flex items-center gap-1.5">
                    <ShieldCheck size={12} className="text-emerald-500" /> ISO/IEC 27001 Verified
                 </p>
              </div>
           </Card>
        </div>
      </div>
    </div>
  );
}
