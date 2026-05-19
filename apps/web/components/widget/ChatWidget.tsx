"use client";

import { useState, useEffect, useRef } from "react";
import { 
  MessageSquare, 
  X, 
  Send, 
  Sparkles, 
  Paperclip, 
  MoreHorizontal,
  ChevronDown,
  User,
  ShieldCheck,
  BrainCircuit,
  Zap
} from "lucide-react";
import { Button, Input, Avatar, Badge } from "@repo/ui";
import { io, Socket } from "socket.io-client";
import { cn } from "@repo/ui";
import { format } from "date-fns";

interface Message {
  id: string;
  body: string;
  senderType: 'CONTACT' | 'AI' | 'AGENT';
  createdAt: string;
}

export default function ChatWidget({ tenantId, config }: { tenantId: string, config: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && !socket) {
      const s = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001", {
        auth: { tenantId, role: 'customer' }
      });

      s.on("connect", () => console.log("Neural link established"));
      s.on("message:new", (msg: Message) => {
        setMessages(prev => [...prev, msg]);
      });
      s.on("agent:typing", ({ typing }) => setIsTyping(typing));
      s.on("ai:typing", ({ typing }) => setIsTyping(typing));

      setSocket(s);
    }

    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [isOpen, socket, messages]);

  const handleSendMessage = () => {
    if (!input.trim() || !socket) return;
    
    const msg = {
      id: Math.random().toString(),
      body: input,
      senderType: 'CONTACT',
      createdAt: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, msg as any]);
    socket.emit("message:send", { body: input });
    setInput("");
  };

  return (
    <div className="fixed bottom-8 right-8 z-[9999] font-sans">
      {/* Trigger Button */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="h-16 w-16 bg-primary rounded-[1.5rem] flex items-center justify-center text-white shadow-[0_20px_50px_rgba(var(--primary-rgb),0.4)] hover:scale-110 active:scale-95 transition-all duration-300 group"
        >
          <div className="absolute inset-0 bg-primary/40 rounded-[1.5rem] animate-ping opacity-20" />
          <MessageSquare size={32} className="relative z-10 group-hover:rotate-12 transition-transform" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="w-[420px] h-[700px] bg-[#0A0A0A] border border-white/10 rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-12 duration-500 backdrop-blur-3xl">
          {/* Header */}
          <div className="p-8 bg-black/40 border-b border-white/5 flex items-center justify-between relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_0%_0%,rgba(var(--primary-rgb),0.1),transparent)]" />
            <div className="flex items-center gap-4 relative z-10">
               <div className="relative">
                  <div className="h-14 w-14 rounded-2xl bg-primary/20 border border-primary/20 flex items-center justify-center text-primary">
                    <BrainCircuit size={28} />
                  </div>
                  <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-emerald-500 border-4 border-black rounded-full" />
               </div>
               <div>
                  <h4 className="text-lg font-black text-white tracking-tight uppercase tracking-[0.05em]">{config.businessName || "AI Assistant"}</h4>
                  <div className="flex items-center gap-2">
                     <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Active Orchestration</span>
                  </div>
               </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="h-10 w-10 bg-white/5 rounded-xl flex items-center justify-center text-gray-500 hover:text-white transition-colors relative z-10"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages Area */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar bg-black/20"
          >
            <div className="text-center py-4 space-y-2 opacity-40">
               <ShieldCheck size={24} className="mx-auto text-primary" />
               <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.3em]">End-to-End Neural Encryption</p>
            </div>

            {messages.map((m) => (
              <div key={m.id} className={cn(
                "flex flex-col max-w-[85%] animate-in fade-in slide-in-from-bottom-2 duration-400",
                m.senderType === 'CONTACT' ? "ml-auto items-end" : "mr-auto items-start"
              )}>
                <div className={cn(
                  "p-5 rounded-[1.5rem] text-sm font-bold leading-relaxed shadow-2xl",
                  m.senderType === 'CONTACT' 
                    ? "bg-primary text-white rounded-tr-none" 
                    : "bg-white/5 text-gray-300 border border-white/5 rounded-tl-none italic"
                )}>
                   {m.body}
                </div>
                <div className="flex items-center gap-2 mt-2 px-1">
                   <span className="text-[8px] font-black text-gray-700 uppercase tracking-widest">{format(new Date(m.createdAt), "HH:mm")}</span>
                   {m.senderType === 'AI' && (
                     <Badge className="bg-purple-500/10 text-purple-500 border-none text-[7px] font-black px-1.5 h-3.5">AI NODE</Badge>
                   )}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-2 text-primary animate-pulse ml-1">
                 <div className="h-1 w-1 rounded-full bg-primary" />
                 <div className="h-1 w-1 rounded-full bg-primary delay-75" />
                 <div className="h-1 w-1 rounded-full bg-primary delay-150" />
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-8 bg-black/40 border-t border-white/5 relative overflow-hidden">
             <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-primary/5 to-transparent blur-3xl opacity-20" />
             <div className="relative z-10 flex gap-4 items-center">
                <div className="relative flex-1 group">
                   <Input 
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Neural input dispatch..."
                      className="h-14 pl-6 pr-12 bg-black border-white/10 rounded-2xl text-sm font-bold placeholder:text-gray-700 group-hover:border-primary/40 transition-all"
                   />
                   <Button 
                      onClick={handleSendMessage}
                      className="absolute right-1 top-1 h-12 w-12 rounded-xl p-0 shadow-2xl shadow-primary/20"
                   >
                      <Send size={20} />
                   </Button>
                </div>
                <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl bg-white/5 border border-white/5 text-gray-500 hover:text-white transition-all">
                   <Paperclip size={20} />
                </Button>
             </div>
             <div className="mt-4 flex items-center justify-center gap-4">
                <p className="text-[9px] font-black text-gray-700 uppercase tracking-widest flex items-center gap-1.5">
                   Powered by <Sparkles size={10} className="text-primary" /> Dyad Neural
                </p>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
