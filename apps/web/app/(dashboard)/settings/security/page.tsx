"use client";

import { useState } from "react";
import { 
  Lock, 
  ShieldCheck, 
  Smartphone, 
  Key, 
  Globe, 
  Activity, 
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  Eye,
  EyeOff,
  RefreshCw,
  Zap,
  Clock,
  Shield,
  X
} from "lucide-react";
import { 
  Button, 
  Input, 
  Card, 
  Badge, 
  Skeleton,
  Tabs,
  TabsList,
  TabsTrigger,
  Progress
} from "@repo/ui";
import { cn } from "@repo/ui";

export default function SecuritySettingsPage() {
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [showKey, setShowKey] = useState(false);

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-12 animate-in fade-in duration-700">
      {/* Security Header */}
      <div className="text-center space-y-4">
         <div className="h-20 w-20 bg-primary/10 rounded-[2.5rem] border-2 border-primary/20 flex items-center justify-center text-primary mx-auto shadow-2xl shadow-primary/20">
            <Lock size={40} />
         </div>
         <div className="space-y-2">
            <h1 className="text-4xl font-black text-white tracking-tighter">Security Orchestrator</h1>
            <p className="text-gray-500 font-medium italic">Hardening your neural environment with multi-layer encryption and access protocols.</p>
         </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
         {/* MFA Section */}
         <Card className="p-10 bg-black/40 border-white/5 rounded-[3rem] shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 h-full w-1/3 bg-[radial-gradient(circle_at_100%_0%,rgba(var(--primary-rgb),0.1),transparent)]" />
            <div className="flex items-center justify-between relative z-10">
               <div className="flex items-center gap-8">
                  <div className="h-16 w-16 bg-white/5 rounded-2xl flex items-center justify-center text-emerald-500 border border-white/5">
                     <Smartphone size={32} />
                  </div>
                  <div className="space-y-1">
                     <h3 className="text-xl font-black text-white tracking-tight">Multi-Factor Authentication (MFA)</h3>
                     <p className="text-sm text-gray-500 font-medium italic">Secure your account with an additional biometric or authenticator layer.</p>
                  </div>
               </div>
               <Button 
                  className={cn(
                    "h-14 px-10 rounded-2xl font-black uppercase tracking-widest transition-all active:scale-95",
                    mfaEnabled ? "bg-emerald-500 text-black hover:bg-emerald-600" : "bg-primary text-white shadow-2xl shadow-primary/30"
                  )}
                  onClick={() => setMfaEnabled(!mfaEnabled)}
               >
                  {mfaEnabled ? "Protocol Active" : "Initialize MFA"}
               </Button>
            </div>
         </Card>

         <div className="grid grid-cols-2 gap-8">
            {/* Session Management */}
            <Card className="p-10 bg-black/40 border-white/5 rounded-[3rem] shadow-2xl space-y-8">
               <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-3">
                     <Activity className="text-primary" size={20} />
                     Active Sessions
                  </h3>
                  <Badge className="bg-white/5 text-gray-600 border-none font-black text-[9px] px-2">3 ACTIVE</Badge>
               </div>
               <div className="space-y-4">
                  {[
                    { device: "MacBook Pro - Chrome", ip: "192.168.1.5", loc: "USA, NY", current: true },
                    { device: "iPhone 15 - Safari", ip: "45.12.3.99", loc: "UK, LDN", current: false },
                  ].map((s, i) => (
                    <div key={i} className="flex items-center justify-between p-5 bg-white/[0.02] rounded-2xl border border-white/5 group hover:bg-white/5 transition-all">
                       <div className="flex items-center gap-4">
                          <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center border", s.current ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-white/5 text-gray-600 border-white/5")}>
                             {s.current ? <ShieldCheck size={20} /> : <Globe size={20} />}
                          </div>
                          <div>
                             <p className="text-xs font-black text-white">{s.device}</p>
                             <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{s.ip} • {s.loc}</p>
                          </div>
                       </div>
                       <Button variant="ghost" size="icon" className="h-10 w-10 text-gray-700 hover:text-rose-500"><X size={18} /></Button>
                    </div>
                  ))}
               </div>
               <Button variant="ghost" className="w-full h-12 rounded-xl text-xs font-black uppercase tracking-widest text-rose-500 hover:bg-rose-500/10">
                  Terminate All Sessions
               </Button>
            </Card>

            {/* API Security */}
            <Card className="p-10 bg-black/40 border-white/5 rounded-[3rem] shadow-2xl space-y-8">
               <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-3">
                     <Key className="text-primary" size={20} />
                     Neural Access Keys
                  </h3>
                  <Button variant="ghost" className="h-8 w-8 p-0 text-gray-500 hover:text-white"><RefreshCw size={18} /></Button>
               </div>
               <div className="p-6 bg-black rounded-2xl border border-white/5 space-y-4">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Master Integration Key</label>
                     <div className="relative">
                        <Input 
                          type={showKey ? "text" : "password"} 
                          value="platform_live_sk_4589230582305982305" 
                          readOnly 
                          className="h-14 bg-white/[0.02] border-white/10 rounded-xl font-mono text-xs pr-12"
                        />
                        <button 
                          onClick={() => setShowKey(!showKey)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white"
                        >
                           {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                     </div>
                  </div>
                  <p className="text-[10px] text-gray-600 italic">This key grants root-level access to the neural matrix. Protect it as you would your master password.</p>
               </div>
               <div className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                     <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Key Scopes</span>
                     <span className="text-[10px] font-black text-primary uppercase tracking-widest">Full Read/Write</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                     <div className="h-full bg-primary w-full" />
                  </div>
               </div>
            </Card>
         </div>

         {/* Advanced Directives */}
         <Card className="p-10 bg-black/40 border-white/5 rounded-[3rem] shadow-2xl space-y-10">
            <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-4">
               <ShieldAlert className="text-rose-500" size={24} />
               Advanced Security Directives
            </h3>
            <div className="grid grid-cols-2 gap-10">
               <div className="space-y-6">
                  <div className="flex items-center justify-between">
                     <div>
                        <h4 className="text-sm font-black text-white uppercase tracking-widest">IP Whitelisting</h4>
                        <p className="text-[11px] text-gray-500 font-medium italic mt-1">Restrict dashboard access to specific IP ranges.</p>
                     </div>
                     <Badge className="bg-white/5 text-gray-600 border-none px-3 py-1 font-black text-[9px]">OFF</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                     <div>
                        <h4 className="text-sm font-black text-white uppercase tracking-widest">Neural Anomaly Detection</h4>
                        <p className="text-[11px] text-gray-500 font-medium italic mt-1">AI-powered monitoring for suspicious login patterns.</p>
                     </div>
                     <Badge className="bg-emerald-500/10 text-emerald-500 border-none px-3 py-1 font-black text-[9px]">ACTIVE</Badge>
                  </div>
               </div>
               <div className="space-y-6">
                  <div className="flex items-center justify-between">
                     <div>
                        <h4 className="text-sm font-black text-white uppercase tracking-widest">Session Auto-Timeout</h4>
                        <p className="text-[11px] text-gray-500 font-medium italic mt-1">Automatically log out after 4 hours of inactivity.</p>
                     </div>
                     <Badge className="bg-emerald-500/10 text-emerald-500 border-none px-3 py-1 font-black text-[9px]">ACTIVE</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                     <div>
                        <h4 className="text-sm font-black text-white uppercase tracking-widest">Hardware Security Keys</h4>
                        <p className="text-[11px] text-gray-500 font-medium italic mt-1">Require Yubikey or Titan for administrative actions.</p>
                     </div>
                     <Button variant="ghost" className="h-10 px-4 rounded-xl bg-white/5 text-[9px] font-black uppercase tracking-widest text-primary hover:bg-primary/10">Configure</Button>
                  </div>
               </div>
            </div>
         </Card>

         {/* Danger Zone */}
         <Card className="p-10 border-2 border-rose-500/20 bg-rose-500/[0.02] rounded-[3rem] shadow-2xl flex items-center justify-between group">
            <div className="space-y-2">
               <h3 className="text-xl font-black text-rose-500 tracking-tight">Decommission Environment</h3>
               <p className="text-sm text-gray-600 font-medium italic">Irreversibly wipe all neural configurations, messages, and contact nodes from the matrix.</p>
            </div>
            <Button className="h-16 px-10 rounded-2xl bg-rose-500 text-white font-black uppercase tracking-widest shadow-2xl shadow-rose-500/20 group-hover:scale-105 transition-all">
               Self-Destruct Protocol
            </Button>
         </Card>
      </div>
    </div>
  );
}
