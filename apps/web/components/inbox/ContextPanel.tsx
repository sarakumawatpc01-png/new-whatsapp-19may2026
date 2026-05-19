"use client";

import { useState } from "react";
import { 
  User, 
  Sparkles, 
  StickyNote, 
  Activity, 
  Plus, 
  Tag as TagIcon, 
  ChevronRight,
  ShieldCheck,
  Zap,
  Clock,
  ExternalLink,
  BrainCircuit,
  TrendingUp,
  MapPin,
  Calendar,
  Star,
  Settings
} from "lucide-react";
import { Button, Avatar, Badge, Input, Skeleton } from "@repo/ui";
import { useInboxStore } from "@/store/inboxStore";
import { format } from "date-fns";
import { cn } from "@repo/ui";

export default function ContextPanel() {
  const { activeConversationId, conversations, setAIEnabled, messages } = useInboxStore();
  const [activeTab, setActiveTab] = useState("contact");
  
  const activeConv = conversations.find(c => c.id === activeConversationId);

  if (!activeConversationId || !activeConv) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 bg-[#0A0A0A] relative overflow-hidden">
        <div className="absolute top-0 right-0 h-full w-full bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.02),transparent)]" />
        <div className="h-24 w-24 bg-white/5 rounded-[2rem] flex items-center justify-center text-gray-700 mb-6 border border-white/5 shadow-inner relative z-10">
           <Activity size={40} className="opacity-20" />
        </div>
        <div className="text-center space-y-2 relative z-10">
           <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-600">Neural Context Offline</p>
           <p className="text-[9px] text-gray-700 font-medium italic">Select a session to load subscriber intelligence.</p>
        </div>
      </div>
    );
  }

  const conversationNotes = messages.filter(m => m.senderType === "SYSTEM" || m.isNote);

  const tabs = [
    { id: "contact", icon: User, label: "Identity" },
    { id: "ai", icon: BrainCircuit, label: "Neural" },
    { id: "notes", icon: StickyNote, label: "Log" },
    { id: "activity", icon: Activity, label: "Stream" }
  ];

  return (
    <div className="flex flex-col h-full bg-[#0A0A0A] border-l border-white/5">
      {/* Tabs Orchestrator */}
      <div className="flex border-b border-white/5 p-3 gap-2 shrink-0 bg-black/40 backdrop-blur-xl">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-1 flex flex-col items-center gap-2 py-4 rounded-[1.25rem] transition-all relative group overflow-hidden border",
              activeTab === tab.id 
                ? "bg-white/5 text-white border-white/10 shadow-xl" 
                : "text-gray-600 border-transparent hover:text-gray-400 hover:bg-white/[0.02]"
            )}
          >
            <tab.icon size={18} className={cn("transition-transform group-hover:scale-110", activeTab === tab.id ? "text-primary" : "text-gray-700")} />
            <span className="text-[8px] font-black uppercase tracking-[0.1em]">{tab.label}</span>
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]" />
            )}
          </button>
        ))}
      </div>

      {/* Neural Insight Hub */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-10">
        {activeTab === "contact" && (
          <div className="space-y-10 animate-in fade-in slide-in-from-right-8 duration-500">
            {/* Identity Header */}
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="relative group">
                 <div className="h-32 w-32 rounded-[2.5rem] bg-gradient-to-br from-primary to-blue-600 p-1 shadow-2xl group-hover:rotate-6 transition-all duration-700">
                   <div className="h-full w-full rounded-[2.25rem] bg-black flex items-center justify-center text-5xl font-black text-white overflow-hidden border-4 border-black">
                     {activeConv.contact.name?.[0] || activeConv.contact.phone[1]}
                   </div>
                 </div>
                 <div className="absolute -bottom-2 -right-2 h-10 w-10 bg-emerald-500 border-4 border-black rounded-2xl flex items-center justify-center text-white shadow-xl">
                    <ShieldCheck size={20} />
                 </div>
              </div>
              <div>
                 <h3 className="text-xl font-black text-white tracking-tight">{activeConv.contact.name || "Anonymous Subscriber"}</h3>
                 <p className="text-xs text-gray-600 font-black uppercase tracking-widest mt-1 font-mono">{activeConv.contact.phone}</p>
              </div>
              <div className="flex gap-3">
                 <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
                    <Star size={12} className="text-amber-500" fill="currentColor" />
                    <span className="text-[10px] font-black text-white font-mono">85% SCORE</span>
                 </div>
                 <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
                    <Zap size={12} className="text-primary" />
                    <span className="text-[10px] font-black text-white font-mono uppercase tracking-widest">Hot Lead</span>
                 </div>
              </div>
            </div>

            {/* Classification Tags */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 flex items-center gap-2">
                  <TagIcon size={14} className="text-primary" /> Behavioral Classification
                </h4>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-white rounded-xl border border-white/5">
                  <Plus size={16} />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {activeConv.contact.tags?.map((t: any) => (
                  <Badge key={t.tag.id} className="bg-white/5 border-white/5 text-gray-400 font-black text-[9px] uppercase tracking-widest rounded-lg px-3 py-1 hover:border-primary/40 cursor-pointer transition-all">
                    {t.tag.name}
                  </Badge>
                )) || <p className="text-[9px] text-gray-700 font-black uppercase tracking-widest italic">No classification detected</p>}
              </div>
            </div>

            {/* Subscriber Parameters */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 px-1">Identity Parameters</h4>
              <div className="grid grid-cols-1 gap-3">
                 {[
                   { label: "Digital Mail", value: "Unspecified", icon: ShieldCheck },
                   { label: "Genesis Date", value: format(new Date(), "MMM d, yyyy"), icon: Clock },
                   { label: "Neural Stage", value: "Consideration", icon: TrendingUp },
                   { label: "Locale", value: "Global / US", icon: MapPin },
                 ].map((item, i) => (
                   <div key={i} className="flex items-center justify-between p-4 rounded-[1.5rem] bg-white/[0.02] border border-white/5 group hover:border-white/10 transition-all cursor-pointer shadow-inner relative overflow-hidden">
                      <div className="absolute top-0 right-0 h-full w-1/4 bg-gradient-to-l from-white/5 to-transparent blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="flex items-center gap-4 relative z-10">
                        <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-600 group-hover:text-primary transition-colors border border-white/5 shadow-inner">
                           <item.icon size={18} />
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-gray-700 uppercase tracking-[0.1em] mb-0.5">{item.label}</p>
                          <p className="text-xs text-white font-bold tracking-tight">{item.value}</p>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-gray-800 group-hover:text-primary transition-all relative z-10" />
                   </div>
                 ))}
              </div>
            </div>

            <Button className="w-full h-14 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 text-xs font-black uppercase tracking-widest text-white gap-3 group transition-all shadow-2xl">
               View Subscriber Vault <ExternalLink size={18} className="text-primary group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        )}

        {activeTab === "ai" && (
          <div className="space-y-10 animate-in fade-in slide-in-from-right-8 duration-500">
             <div className="p-8 rounded-[2.5rem] bg-primary/5 border-2 border-primary/20 relative overflow-hidden group shadow-2xl">
                <div className="absolute -top-16 -right-16 h-32 w-32 bg-primary/20 blur-3xl group-hover:bg-primary/30 transition-all duration-700" />
                <div className="flex items-center gap-4 mb-6">
                   <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center text-white shadow-[0_0_30px_rgba(var(--primary-rgb),0.5)] border-2 border-black">
                      <BrainCircuit size={28} />
                   </div>
                   <div>
                      <h4 className="text-lg font-black text-white tracking-tight uppercase tracking-[0.05em]">Neural Pilot</h4>
                      <div className="flex items-center gap-2">
                         <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                         <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest">Active Orchestration</p>
                      </div>
                   </div>
                </div>
                <p className="text-sm text-gray-400 font-medium leading-relaxed italic mb-8">
                  "Subscriber shows high engagement intent. AI is currently maintaining context memory and will execute automated replies based on the 'Standard Sales' knowledge base."
                </p>
                <Button 
                   className={cn(
                     "w-full h-14 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all active:scale-95 shadow-2xl",
                     activeConv.aiEnabled ? "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20" : "bg-primary hover:bg-primary-hover text-white shadow-primary/20"
                   )}
                   onClick={() => setAIEnabled(activeConv.id, !activeConv.aiEnabled)}
                >
                   {activeConv.aiEnabled ? "Deactivate Neural Pilot" : "Activate Neural Pilot"}
                </Button>
             </div>

             <div className="space-y-6">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 px-1">Behavioral Analytics</h4>
                <div className="p-6 rounded-[2rem] bg-white/[0.03] border border-white/5 space-y-6 shadow-inner">
                   <div className="space-y-3">
                      <div className="flex justify-between items-end">
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Interaction Propensity</span>
                        <span className="text-base font-black text-white font-mono">94%</span>
                      </div>
                      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                        <div className="h-full bg-gradient-to-r from-primary to-blue-500 w-[94%] shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]" />
                      </div>
                   </div>
                   <div className="flex justify-between items-center py-4 border-t border-white/5">
                      <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Sentiment Tone</span>
                      <Badge className="bg-emerald-500/10 text-emerald-500 border-none text-[9px] font-black uppercase tracking-widest px-3 py-1">
                        High Positive 📈
                      </Badge>
                   </div>
                   <div className="flex justify-between items-center py-4 border-t border-white/5">
                      <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Language Matrix</span>
                      <Badge className="bg-blue-500/10 text-blue-500 border-none text-[9px] font-black uppercase tracking-widest px-3 py-1">
                        English (Neural)
                      </Badge>
                   </div>
                </div>
             </div>

             <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 px-1">Suggested Next Actions</h4>
                <div className="grid grid-cols-1 gap-3">
                   {[
                     { label: "Request Verification", icon: ShieldCheck },
                     { label: "Offer Discount Node", icon: Zap },
                     { label: "Escalate to Human", icon: User }
                   ].map((action, i) => (
                     <Button key={i} variant="ghost" className="justify-between h-12 px-6 rounded-xl bg-white/[0.02] border border-white/5 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white hover:bg-white/5 group transition-all">
                        <div className="flex items-center gap-3">
                           <action.icon size={14} className="text-primary group-hover:scale-110 transition-transform" />
                           {action.label}
                        </div>
                        <Plus size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                     </Button>
                   ))}
                </div>
             </div>
          </div>
        )}

        {activeTab === "notes" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
             <div className="flex items-center justify-between px-1">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600">Intelligence Log</h4>
                <Badge className="bg-white/5 text-gray-700 border-white/5 text-[9px] font-black font-mono">{conversationNotes.length} RECORDS</Badge>
             </div>
             
             <div className="grid grid-cols-1 gap-6">
                {conversationNotes.map((note) => (
                  <div key={note.id} className="p-6 rounded-[2rem] bg-amber-500/5 border border-amber-500/20 space-y-4 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 h-full w-1.5 bg-amber-500" />
                    <p className="text-xs text-amber-100/80 leading-relaxed font-bold italic tracking-tight">
                      "{note.body}"
                    </p>
                    <div className="flex justify-between items-center pt-4 border-t border-amber-500/10">
                      <div className="flex items-center gap-2">
                         <div className="h-5 w-5 rounded-lg bg-amber-500 flex items-center justify-center text-black font-black text-[8px]">AI</div>
                         <span className="text-[9px] font-black text-amber-500/60 uppercase tracking-widest">Neural System</span>
                      </div>
                      <span className="text-[9px] text-gray-700 font-black uppercase tracking-widest">{format(new Date(note.createdAt), "MMM d, HH:mm")}</span>
                    </div>
                  </div>
                ))}
                
                {conversationNotes.length === 0 && (
                  <div className="py-24 flex flex-col items-center justify-center opacity-10 text-center border-2 border-dashed border-white/5 rounded-[3rem]">
                    <StickyNote size={64} className="mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em]">No Recorded Intelligence</p>
                  </div>
                )}
             </div>
          </div>
        )}

        {activeTab === "activity" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
             <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 px-1">Interaction Stream</h4>
             <div className="relative space-y-10 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-white/5">
                {[
                  { title: "Inbound Transmission", time: "2h ago", icon: User, color: "text-blue-500", bg: "bg-blue-500/10" },
                  { title: "Neural Pilot Sync", time: "2h ago", icon: BrainCircuit, color: "text-primary", bg: "bg-primary/10" },
                  { title: "Intelligence Logged", time: "5h ago", icon: StickyNote, color: "text-amber-500", bg: "bg-amber-500/10" },
                  { title: "Neural Stage Elevation", time: "Yesterday", icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-500/10" },
                  { title: "Registry Created", time: "3 days ago", icon: ShieldCheck, color: "text-gray-500", bg: "bg-white/5" },
                ].map((item, i) => (
                  <div key={i} className="relative flex items-center gap-8 group">
                    <div className={cn(
                      "h-10 w-10 rounded-2xl bg-black border border-white/10 flex items-center justify-center shrink-0 z-10 transition-all group-hover:scale-125 shadow-2xl",
                      item.color
                    )}>
                      <item.icon size={18} />
                    </div>
                    <div className="flex-1 p-4 rounded-2xl bg-white/[0.02] border border-white/5 group-hover:border-white/10 transition-all">
                      <p className="text-xs font-black text-white mb-1 uppercase tracking-widest">{item.title}</p>
                      <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">{item.time}</p>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
