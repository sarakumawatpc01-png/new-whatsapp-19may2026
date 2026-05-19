"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Send, 
  Paperclip, 
  Smile, 
  MoreVertical, 
  UserPlus, 
  CheckCircle, 
  Sparkles,
  Info,
  ChevronDown,
  Clock,
  User,
  Zap,
  RefreshCw,
  Search,
  Command,
  AtSign,
  ArrowRight,
  LayoutTemplate
} from "lucide-react";
import { Button, Input, Badge, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, Skeleton } from "@repo/ui";
import { useInboxStore } from "@/store/inboxStore";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import { format, isToday, isYesterday } from "date-fns";
import { cn } from "@repo/ui";

export default function ChatWindow() {
  const { 
    activeConversationId, 
    conversations, 
    messages, 
    sendMessage, 
    addNote,
    updateConversationStatus,
    assignConversation,
    setAIEnabled,
    typingAgents,
    aiTyping
  } = useInboxStore();
  const { user } = useAuthStore();
  
  const [inputText, setInputText] = useState("");
  const [isNote, setIsNote] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [templates, setTemplates] = useState<any[]>([]);

  useEffect(() => {
    api.get("/campaigns/templates").then((res) => {
      setTemplates(res.data.data.filter((t: any) => t.status === "APPROVED" || t.status === "APPROVED_BY_META"));
    }).catch(() => {});
  }, []);

  const activeConv = conversations.find(c => c.id === activeConversationId);
  const typing = activeConversationId ? typingAgents[activeConversationId] || [] : [];
  const isAITyping = activeConversationId ? aiTyping[activeConversationId] : false;

  useEffect(() => {
    scrollToBottom();
  }, [messages, typing, isAITyping]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;
    const text = inputText;
    setInputText(""); // Optimistic clear
    if (isNote) {
      await addNote(text);
    } else {
      await sendMessage(text, "text");
    }
  };

  const formatDateLabel = (date: string) => {
    const d = new Date(date);
    if (isToday(d)) return "Today";
    if (isYesterday(d)) return "Yesterday";
    return format(d, "MMMM d, yyyy");
  };

  if (!activeConversationId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-24 bg-[#050505] relative overflow-hidden">
        <div className="absolute top-0 left-0 h-full w-full bg-[radial-gradient(circle_at_50%_50%,rgba(var(--primary-rgb),0.05),transparent)]" />
        <div className="h-32 w-32 bg-primary/5 rounded-[3rem] flex items-center justify-center text-primary/20 mb-10 border border-white/5 rotate-6 shadow-inner relative z-10">
          <Zap size={64} fill="currentColor" className="opacity-10" />
        </div>
        <div className="space-y-4 relative z-10">
           <h2 className="text-4xl font-black text-white tracking-tighter uppercase tracking-[0.1em]">Neural Live Chat</h2>
           <p className="text-gray-600 max-w-sm text-sm font-medium italic">Select a subscriber from the registry to initiate a secure transmission. AI Co-pilot is on standby.</p>
        </div>
        <div className="mt-12 flex gap-4 relative z-10">
           <Badge className="bg-white/5 text-gray-500 border-white/10 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest">Active Sessions: 12</Badge>
           <Badge className="bg-white/5 text-gray-500 border-white/10 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest">AI Efficiency: 94%</Badge>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0A0A0A] relative">
      {/* Header */}
      <div className="h-24 border-b border-white/5 flex items-center justify-between px-10 bg-black/40 backdrop-blur-2xl shrink-0 z-30">
        <div className="flex items-center gap-6">
          <div className={cn(
            "h-14 w-14 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-2xl border border-white/10 transition-all duration-500 rotate-3 group-hover:rotate-6",
            activeConv ? "bg-gradient-to-br from-primary to-blue-600" : "bg-gray-800"
          )}>
            {activeConv?.contact.name?.[0] || "?"}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-black text-white tracking-tight">{activeConv?.contact.name || "Anonymous Subscriber"}</h3>
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse" />
              <Badge className="bg-white/5 text-gray-600 border-white/5 text-[9px] font-mono px-2 py-0.5">{activeConv?.contact.phone}</Badge>
            </div>
            <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-gray-500">
               <span className="flex items-center gap-1.5"><Clock size={12} className="text-primary" /> Active session</span>
               <div className="h-1 w-1 rounded-full bg-gray-800" />
               <span className="flex items-center gap-1.5 text-gray-700">via node: {activeConv?.number.displayPhone}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center bg-black/40 rounded-[1.25rem] p-1.5 border border-white/5 shadow-inner">
             <Button 
               variant="ghost" 
               size="sm" 
               className={cn(
                 "h-10 px-6 text-[10px] font-black uppercase tracking-widest gap-3 rounded-xl transition-all duration-500",
                 activeConv?.aiEnabled ? "bg-primary text-white shadow-xl shadow-primary/20" : "text-gray-500 hover:text-white"
               )}
               onClick={() => setAIEnabled(activeConv?.id!, !activeConv?.aiEnabled)}
             >
               <Sparkles size={14} fill={activeConv?.aiEnabled ? "currentColor" : "none"} />
               AI Co-pilot {activeConv?.aiEnabled ? "On" : "Off"}
             </Button>
          </div>

          <div className="h-10 w-px bg-white/5 mx-1" />

          <DropdownMenu>
             <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-12 px-6 gap-3 rounded-2xl border border-white/5 text-gray-400 hover:text-white hover:bg-white/5 transition-all">
                   <Badge className={cn(
                      "text-[8px] font-black uppercase px-2 py-0.5 border-none",
                      activeConv?.status === 'OPEN' ? "bg-emerald-500/10 text-emerald-500" : "bg-gray-500/10 text-gray-500"
                   )}>
                      {activeConv?.status}
                   </Badge>
                   <ChevronDown size={16} />
                </Button>
             </DropdownMenuTrigger>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-12 w-12 text-gray-500 hover:text-white hover:bg-white/5 rounded-2xl border border-white/5 transition-all">
                 <UserPlus size={20} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 glass border-white/10 rounded-2xl p-2 z-[100] bg-black/80 backdrop-blur-3xl">
               <div className="px-2 py-1.5 text-[10px] font-black uppercase tracking-widest text-gray-500">Assign Agent</div>
               <DropdownMenuItem onClick={() => assignConversation(activeConv?.id!, "1")} className="rounded-xl p-3 focus:bg-white/5 text-sm font-bold cursor-pointer">Assign to Admin</DropdownMenuItem>
               <DropdownMenuItem onClick={() => assignConversation(activeConv?.id!, "2")} className="rounded-xl p-3 focus:bg-white/5 text-sm font-bold cursor-pointer">Assign to Sales</DropdownMenuItem>
               <DropdownMenuItem onClick={() => assignConversation(activeConv?.id!, null)} className="text-red-500 rounded-xl p-3 focus:bg-red-500/10 focus:text-red-500 text-sm font-bold cursor-pointer mt-1">Unassign</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar relative flex flex-col bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.01),transparent)]">
        {messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center opacity-20 space-y-4">
            <div className="h-24 w-24 bg-white/5 rounded-[2rem] flex items-center justify-center border border-white/5">
               <MessageSquare size={48} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em]">Encrypted Session Initiated</p>
          </div>
        )}

        {messages.slice().reverse().map((msg, index, arr) => {
          const isMe = msg.direction === "OUTBOUND";
          const isAI = msg.senderType === "AI";
          const isInternal = msg.isNote;
          
          const showDate = index === 0 || formatDateLabel(arr[index-1].createdAt) !== formatDateLabel(msg.createdAt);

          return (
            <div key={msg.id} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {showDate && (
                <div className="flex items-center justify-center py-8">
                  <div className="h-px bg-white/5 flex-1" />
                  <span className="px-10 text-[10px] font-black text-gray-600 uppercase tracking-[0.3em]">
                    {formatDateLabel(msg.createdAt)}
                  </span>
                  <div className="h-px bg-white/5 flex-1" />
                </div>
              )}

              <div className={cn(
                "flex w-full group",
                isMe || isAI ? "justify-end" : "justify-start"
              )}>
                <div className={cn(
                  "max-w-[70%] space-y-2",
                  isMe || isAI ? "items-end" : "items-start"
                )}>
                  <div className={cn(
                    "p-5 rounded-[2rem] text-sm relative transition-all duration-500 shadow-2xl border-2",
                    isInternal ? "bg-amber-500/5 border-amber-500/20 text-amber-200/80 rounded-br-lg italic" :
                    isAI ? "bg-white/5 border-primary/40 text-white rounded-br-lg shadow-primary/10" :
                    isMe ? "bg-primary border-primary/20 text-white rounded-br-lg shadow-primary/20" : 
                    "bg-white/[0.03] text-gray-200 border-white/5 rounded-bl-lg"
                  )}>
                    {isInternal && (
                      <div className="flex items-center gap-2 mb-3 text-[9px] uppercase font-black tracking-widest text-amber-500">
                        <Info size={12} /> Internal Memory Log
                      </div>
                    )}
                    {isAI && (
                      <div className="flex items-center gap-2 mb-3 text-[9px] uppercase font-black tracking-widest text-primary">
                        <Sparkles size={12} fill="currentColor" /> Neural Co-pilot Response
                      </div>
                    )}
                    <p className="leading-relaxed whitespace-pre-wrap font-medium tracking-tight">{msg.body}</p>
                  </div>

                  <div className={cn(
                    "flex items-center gap-3 px-3 text-[9px] font-black uppercase tracking-widest text-gray-600 transition-opacity",
                    isMe || isAI ? "flex-row-reverse" : "flex-row"
                  )}>
                    <span>{format(new Date(msg.createdAt), "HH:mm")}</span>
                    {isMe && !isInternal && (
                      <div className={cn(
                        "flex items-center gap-0.5",
                        msg.status === "READ" ? "text-primary" : "text-gray-700"
                      )}>
                        {msg.status === "READ" ? <CheckCircle size={10} fill="currentColor" className="text-primary" /> : "✓"}
                        <span className="text-[8px]">{msg.status}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Typing Indicators */}
        {(typing.length > 0 || isAITyping) && (
          <div className="flex justify-start items-center gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex gap-1.5 p-4 bg-white/5 border border-white/10 rounded-2xl rounded-bl-sm">
              <span className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s] shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]" />
              <span className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s] shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]" />
              <span className="h-2 w-2 bg-primary rounded-full animate-bounce shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]" />
            </div>
            <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">
              {isAITyping ? "Neural AI is synthesizing..." : `${typing[0]} is formulating response...`}
            </p>
          </div>
        )}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Input */}
      <div className="p-10 bg-black/60 backdrop-blur-3xl border-t border-white/5 shrink-0 z-30">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between px-2">
             <div className="flex gap-8">
                {[
                  { id: "msg", label: "Subscriber Transmission", color: "primary", active: !isNote },
                  { id: "note", label: "Internal Intelligence", color: "amber-500", active: isNote }
                ].map(t => (
                  <button 
                    key={t.id}
                    onClick={() => setIsNote(t.id === "note")}
                    className={cn(
                      "text-[10px] font-black uppercase tracking-[0.25em] transition-all relative pb-2",
                      t.active ? `text-${t.color}` : "text-gray-600 hover:text-gray-300"
                    )}
                  >
                    {t.label}
                    {t.active && <div className={cn("absolute bottom-0 left-0 right-0 h-1 rounded-full shadow-2xl", `bg-${t.color}`)} />}
                  </button>
                ))}
             </div>
             
             <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 px-4 py-1.5 bg-white/5 border border-white/10 rounded-xl">
                   <Command size={12} className="text-gray-500" />
                   <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Press Enter to dispatch</span>
                </div>
             </div>
          </div>

          <div className={cn(
            "relative rounded-[2.5rem] border-2 transition-all duration-700 group shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden",
            isNote ? "bg-amber-500/5 border-amber-500/20" : "bg-white/[0.02] border-white/5 focus-within:border-primary/40 focus-within:bg-white/[0.04]"
          )}>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={isNote ? "Add a private observation to this contact's history..." : "Compose a message to the subscriber..."}
              className="w-full bg-transparent border-none focus:ring-0 text-base text-white p-8 pr-16 resize-none h-auto min-h-[80px] max-h-60 custom-scrollbar outline-none font-bold tracking-tight placeholder:text-gray-700 placeholder:italic"
              rows={1}
            />
            
            <div className="flex items-center justify-between px-8 pb-6">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" className="h-12 w-12 text-gray-600 hover:text-white hover:bg-white/5 rounded-2xl border border-white/5 transition-all">
                  <Paperclip size={22} />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-12 w-12 text-gray-600 hover:text-white hover:bg-white/5 rounded-2xl border border-white/5 transition-all">
                      <LayoutTemplate size={22} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-72 glass border-white/10 rounded-2xl p-2 z-[100] bg-black/90 backdrop-blur-3xl mb-4" side="top" align="start">
                     <div className="px-2 py-2 text-[10px] font-black uppercase tracking-widest text-gray-500">Approved Templates</div>
                     {templates.map(t => (
                       <DropdownMenuItem 
                         key={t.id} 
                         onClick={() => setInputText(t.components?.find((c: any) => c.type === "BODY")?.text || "Template Content")} 
                         className="rounded-xl p-3 focus:bg-white/5 cursor-pointer flex flex-col items-start gap-1"
                       >
                         <span className="font-bold text-sm text-white">{t.displayName || t.name}</span>
                         <span className="text-[10px] text-gray-500 font-mono truncate w-full">{t.category} • {t.language}</span>
                       </DropdownMenuItem>
                     ))}
                     {templates.length === 0 && <div className="p-3 text-xs text-gray-500 italic">No approved templates found</div>}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button variant="ghost" size="icon" className="h-12 w-12 text-gray-600 hover:text-white hover:bg-white/5 rounded-2xl border border-white/5 transition-all">
                  <Smile size={22} />
                </Button>
                {!isNote && (
                  <Button variant="ghost" size="icon" className="h-12 w-12 text-primary/40 hover:text-primary hover:bg-primary/10 rounded-2xl border border-primary/10 transition-all">
                    <Sparkles size={22} />
                  </Button>
                )}
              </div>
              
              <div className="flex items-center gap-6">
                <div className="h-8 w-px bg-white/5" />
                <span className="text-[10px] text-gray-700 font-black font-mono tracking-[0.2em]">
                  {inputText.length} / 4096
                </span>
                <Button 
                  disabled={!inputText.trim()}
                  onClick={handleSend}
                  className={cn(
                    "rounded-[1.25rem] gap-4 h-14 px-10 font-black uppercase tracking-[0.2em] text-xs shadow-2xl transition-all active:scale-95 group",
                    isNote ? "bg-amber-500 hover:bg-amber-600 text-black" : "bg-primary hover:bg-primary-hover shadow-primary/20"
                  )}
                >
                  {isNote ? "Append Note" : "Dispatch"}
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageSquare(props: any) {
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
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
