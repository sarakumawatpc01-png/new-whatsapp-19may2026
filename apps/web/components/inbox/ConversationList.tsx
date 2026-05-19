"use client";

import { useState, useEffect } from "react";
import { Search, Filter, MessageSquare, User, CheckCircle2, Sparkles, MoreHorizontal, Clock, Zap } from "lucide-react";
import { Input, Badge, Skeleton, Button, DropdownMenu } from "@repo/ui";
import { useInboxStore } from "@/store/inboxStore";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@repo/ui";

export default function ConversationList() {
  const { 
    conversations, 
    activeConversationId, 
    setActiveConversation, 
    loading, 
    error, 
    fetchConversations,
    aiTyping 
  } = useInboxStore();
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchConversations({ 
        search, 
        status: activeFilter === "resolved" ? "RESOLVED" : activeFilter === "all" ? undefined : "OPEN",
        assignedToId: activeFilter === "mine" ? "me" : activeFilter === "unassigned" ? "unassigned" : undefined
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [search, activeFilter, fetchConversations]);

  const getInitials = (name: string) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#0A0A0A]">
      {/* Header & Search */}
      <div className="p-6 space-y-6 shrink-0 border-b border-white/5 bg-black/40 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="h-8 w-8 bg-primary/20 rounded-lg flex items-center justify-center text-primary border border-primary/20">
                <MessageSquare size={16} />
             </div>
             <h2 className="text-lg font-black text-white uppercase tracking-widest">Subscriber Inbox</h2>
          </div>
          <div className="flex gap-2">
             <Button variant="ghost" size="icon" className="h-10 w-10 text-gray-500 hover:text-white rounded-xl bg-white/5 border border-white/5">
                <Plus size={18} />
             </Button>
          </div>
        </div>
        
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-primary transition-colors" size={16} />
          <Input 
            placeholder="Search identities or logs..." 
            className="pl-12 bg-white/5 border-white/10 focus:border-primary/40 text-sm h-12 rounded-2xl transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-2 gap-2">
           {[
             { id: "all", label: "Registry", icon: MessageSquare },
             { id: "unread", label: "Urgent", icon: Zap },
             { id: "mine", label: "Assigned", icon: User },
             { id: "resolved", label: "Archived", icon: CheckCircle2 }
           ].map((filter) => (
             <button
               key={filter.id}
               onClick={() => setActiveFilter(filter.id)}
               className={cn(
                 "flex items-center gap-3 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                 activeFilter === filter.id 
                   ? "bg-primary/10 text-primary border-primary/20 shadow-[0_0_20px_rgba(var(--primary-rgb),0.1)]" 
                   : "text-gray-600 border-white/5 hover:text-gray-300 hover:bg-white/5"
               )}
             >
               <filter.icon size={14} />
               {filter.label}
             </button>
           ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-black/20">
        {loading && conversations.length === 0 ? (
          <div className="p-6 space-y-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex gap-4 animate-pulse">
                <Skeleton className="h-14 w-14 rounded-2xl bg-white/5" />
                <div className="flex-1 space-y-3 py-1">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-32 bg-white/5 rounded-lg" />
                    <Skeleton className="h-3 w-12 bg-white/5 rounded-lg" />
                  </div>
                  <Skeleton className="h-3 w-full bg-white/5 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="p-6 bg-rose-500/10 rounded-[2rem] mb-6 text-rose-500 border border-rose-500/10">
              <AlertCircle size={48} />
            </div>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-6">{error}</p>
            <Button variant="outline" size="sm" onClick={() => fetchConversations()} className="h-12 px-8 rounded-2xl border-white/10 hover:bg-white/5 text-[10px] font-black uppercase tracking-widest">
              Retry Link
            </Button>
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-12 opacity-20">
            <div className="p-10 bg-white/5 rounded-[3rem] mb-6 border border-white/5 shadow-inner">
              <MessageSquare size={64} />
            </div>
            <p className="text-sm font-black uppercase tracking-[0.3em]">Neural Registry Empty</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setActiveConversation(conv.id)}
                className={cn(
                  "w-full p-6 flex gap-4 text-left transition-all relative group border-l-4",
                  activeConversationId === conv.id 
                    ? "bg-white/[0.03] border-primary" 
                    : "hover:bg-white/[0.01] border-transparent"
                )}
              >
                {/* Active Indicator */}
                {activeConversationId === conv.id && (
                   <div className="absolute top-0 right-0 h-full w-1/3 bg-gradient-to-l from-primary/5 to-transparent blur-3xl opacity-50" />
                )}

                {/* Avatar */}
                <div className="relative shrink-0">
                  <div className={cn(
                    "h-14 w-14 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-2xl border border-white/10 transition-all duration-500 group-hover:rotate-6",
                    activeConversationId === conv.id ? "bg-gradient-to-br from-primary to-blue-600" : "bg-gradient-to-br from-white/10 to-white/5"
                  )}>
                    {getInitials(conv.contact.name || conv.contact.phone)}
                  </div>
                  {conv.aiEnabled && !conv.aiPaused && (
                    <div className="absolute -top-1.5 -right-1.5 h-6 w-6 bg-primary rounded-xl flex items-center justify-center text-white border-2 border-[#0A0A0A] shadow-xl animate-in zoom-in">
                      <Sparkles size={12} fill="currentColor" />
                    </div>
                  )}
                  {aiTyping[conv.id] && (
                     <div className="absolute -bottom-1 -right-1 flex gap-0.5 p-1 bg-primary rounded-lg border-2 border-black animate-bounce">
                        <div className="h-1 w-1 bg-white rounded-full animate-pulse" />
                        <div className="h-1 w-1 bg-white rounded-full animate-pulse [animation-delay:0.2s]" />
                        <div className="h-1 w-1 bg-white rounded-full animate-pulse [animation-delay:0.4s]" />
                     </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 relative z-10">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className={cn(
                      "text-sm font-black tracking-tight truncate pr-4 transition-colors",
                      activeConversationId === conv.id ? "text-white" : "text-gray-400 group-hover:text-white"
                    )}>
                      {conv.contact.name || "Anonymous Subscriber"}
                    </h3>
                    <span className="text-[9px] text-gray-600 font-black uppercase tracking-widest whitespace-nowrap pt-1">
                      {formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: false })}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-2">
                     <p className="text-[10px] text-gray-500 font-mono font-bold tracking-tighter">
                       {conv.contact.phone}
                     </p>
                     {conv.status === "RESOLVED" && <Badge className="bg-emerald-500/10 text-emerald-500 border-none text-[8px] font-black h-4 px-1.5">ARCHIVED</Badge>}
                  </div>

                  <div className="flex items-center gap-1.5 overflow-hidden">
                    {conv.contact.tags?.slice(0, 2).map((t: any) => (
                      <span 
                        key={t.tag.id} 
                        className="text-[8px] px-1.5 py-0.5 rounded-lg bg-white/5 text-gray-500 border border-white/5 font-black uppercase tracking-widest"
                      >
                        {t.tag.name}
                      </span>
                    ))}
                    {conv.contact.tags?.length > 2 && (
                       <span className="text-[9px] text-gray-700 font-black">+{conv.contact.tags.length - 2}</span>
                    )}
                  </div>
                </div>

                {/* Unread & Assignee */}
                <div className="flex flex-col items-end justify-between shrink-0 py-1 relative z-10">
                  {conv._count?.messages ? (
                    <div className="h-6 min-w-[24px] px-1.5 bg-primary rounded-xl flex items-center justify-center text-white text-[10px] font-black shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)] animate-in zoom-in">
                      {conv._count.messages}
                    </div>
                  ) : <div className="h-6" />}
                  
                  {conv.assignedTo && (
                    <div className="h-7 w-7 rounded-xl bg-white/5 flex items-center justify-center overflow-hidden border border-white/5 transition-transform group-hover:scale-110" title={`Linked: ${conv.assignedTo.name}`}>
                       {conv.assignedTo.avatar ? (
                         <img src={conv.assignedTo.avatar} alt="" className="h-full w-full object-cover" />
                       ) : (
                         <User size={14} className="text-gray-600" />
                       )}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Plus(props: any) {
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
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}

function AlertCircle(props: any) {
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
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}
