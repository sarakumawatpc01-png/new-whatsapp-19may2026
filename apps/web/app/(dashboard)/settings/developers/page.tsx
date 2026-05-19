"use client";

import { useState } from "react";
import { 
  Key, 
  Webhook, 
  FileText, 
  ExternalLink, 
  Code2, 
  Terminal, 
  Copy, 
  Check, 
  Zap, 
  Globe, 
  ShieldCheck, 
  Cpu, 
  ChevronRight,
  Database,
  Layers,
  ArrowRight
} from "lucide-react";
import { 
  Button, 
  Input, 
  Card, 
  Badge, 
  Tabs, 
  TabsList, 
  TabsTrigger, 
  TabsContent,
  Avatar
} from "@repo/ui";
import { cn } from "@repo/ui";
import { toast } from "sonner";
import Link from "next/link";

export default function DevelopersPage() {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Protocol copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const codeSnippets: any = {
    javascript: `const Dyad = require('@dyad/sdk');
const client = new Dyad.Client('your_api_key');

async function sendNeuralMessage() {
  const response = await client.messages.send({
    to: '1234567890',
    body: 'Neural dispatch initialized.',
    aiMode: true
  });
  console.log(response.id);
}`,
    python: `import dyad

client = dyad.Client(api_key='your_api_key')

response = client.messages.send(
    to='1234567890',
    body='Neural dispatch initialized.',
    ai_mode=True
)
print(response.id)`
  };

  return (
    <div className="p-12 max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700">
      {/* Dev Header */}
      <div className="flex items-center justify-between bg-black/40 p-10 rounded-[3rem] border border-white/5 relative overflow-hidden backdrop-blur-3xl shadow-2xl">
        <div className="absolute top-0 left-0 h-full w-full bg-[radial-gradient(circle_at_50%_-50%,rgba(var(--primary-rgb),0.15),transparent)] opacity-50" />
        <div className="relative z-10 flex items-center gap-8">
           <div className="h-20 w-20 bg-primary/10 rounded-[2.5rem] border-2 border-primary/20 flex items-center justify-center text-primary shadow-2xl shadow-primary/20">
              <Terminal size={40} />
           </div>
           <div>
              <h1 className="text-4xl font-black text-white tracking-tight">Developer Nexus</h1>
              <div className="flex items-center gap-4 mt-1">
                 <Badge className="bg-emerald-500/10 text-emerald-500 border-none px-3 py-1 text-[10px] font-black uppercase tracking-widest">Protocol v1.0.4-LTS</Badge>
                 <div className="h-1.5 w-1.5 rounded-full bg-gray-800" />
                 <p className="text-gray-500 text-sm font-medium italic">Programmable access to the neural matrix and WhatsApp orchestration nodes.</p>
              </div>
           </div>
        </div>
        <div className="relative z-10">
           <Button className="h-16 px-10 rounded-2xl gap-3 bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-black uppercase tracking-widest text-white transition-all">
              <FileText size={20} className="text-primary" /> Full API Specs
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-10">
        {/* Main Content */}
        <div className="col-span-8 space-y-10">
           <div className="grid grid-cols-2 gap-8">
              <LinkCard 
                href="/settings/api" 
                icon={Key} 
                title="API Access Nodes" 
                desc="Manage master keys and session tokens for secure integration." 
                color="primary"
              />
              <LinkCard 
                href="/settings/webhooks" 
                icon={Webhook} 
                title="Neural Webhooks" 
                desc="Real-time event streams for message delivery and AI actions." 
                color="purple"
              />
           </div>

           <Card className="bg-black/40 border-white/5 rounded-[3rem] overflow-hidden shadow-2xl">
              <Tabs defaultValue="javascript" className="w-full">
                 <div className="p-8 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                       <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-500">
                          <Code2 size={20} />
                       </div>
                       <h3 className="text-xl font-black text-white uppercase tracking-tight">Integration SDKs</h3>
                    </div>
                    <TabsList className="bg-white/5 border border-white/10 p-1 rounded-xl h-12">
                       <TabsTrigger value="javascript" className="text-[10px] font-black uppercase tracking-widest px-6 data-[state=active]:bg-primary data-[state=active]:text-white">Node.js</TabsTrigger>
                       <TabsTrigger value="python" className="text-[10px] font-black uppercase tracking-widest px-6 data-[state=active]:bg-primary data-[state=active]:text-white">Python</TabsTrigger>
                    </TabsList>
                 </div>
                 
                 {["javascript", "python"].map((lang) => (
                   <TabsContent key={lang} value={lang} className="p-0 m-0 animate-in fade-in duration-500">
                      <div className="relative">
                         <pre className="p-10 text-sm font-mono bg-black/60 text-gray-400 overflow-x-auto leading-relaxed h-[350px] custom-scrollbar">
                            <code>{codeSnippets[lang]}</code>
                         </pre>
                         <Button 
                            variant="ghost" 
                            size="icon" 
                            className="absolute top-6 right-6 h-12 w-12 rounded-xl bg-white/5 hover:bg-white/10 text-gray-500 hover:text-white border border-white/10"
                            onClick={() => copyToClipboard(codeSnippets[lang])}
                         >
                            {copied ? <Check size={20} className="text-emerald-500" /> : <Copy size={20} />}
                         </Button>
                      </div>
                   </TabsContent>
                 ))}
              </Tabs>
              <div className="p-8 bg-black/40 border-t border-white/5 flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Stable Release</p>
                    <Badge className="bg-emerald-500/10 text-emerald-500 border-none px-2 h-4 flex items-center text-[8px] font-black">v2.4.1</Badge>
                 </div>
                 <p className="text-[9px] text-gray-700 font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                    <ShieldCheck size={12} /> SHA-256 Verified
                 </p>
              </div>
           </Card>

           <div className="space-y-6">
              <h3 className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] px-2">Endpoint Registry</h3>
              <div className="grid grid-cols-1 gap-4">
                 {[
                   { method: "GET", path: "/v1/contacts", desc: "List all subscriber identities." },
                   { method: "POST", path: "/v1/messages/send", desc: "Dispatch a WhatsApp transmission." },
                   { method: "GET", path: "/v1/ai/context", desc: "Retrieve active RAG knowledge nodes." },
                   { method: "PUT", path: "/v1/tenants/config", desc: "Update neural environment settings." },
                 ].map((e, i) => (
                   <div key={i} className="p-6 bg-black/40 border border-white/5 rounded-[2rem] flex items-center justify-between group hover:border-primary/20 transition-all shadow-xl">
                      <div className="flex items-center gap-8">
                         <Badge className={cn(
                           "h-10 w-20 border-none flex items-center justify-center font-black text-[10px] tracking-widest",
                           e.method === 'GET' ? "bg-emerald-500/10 text-emerald-500" : "bg-sky-500/10 text-sky-500"
                         )}>{e.method}</Badge>
                         <div>
                            <p className="text-sm font-black text-white font-mono tracking-tight">{e.path}</p>
                            <p className="text-[10px] text-gray-600 font-medium italic">{e.desc}</p>
                         </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-10 w-10 text-gray-800 hover:text-white transition-colors">
                         <ChevronRight size={20} />
                      </Button>
                   </div>
                 ))}
              </div>
           </div>
        </div>

        {/* Sidebar Info */}
        <div className="col-span-4 space-y-10">
           <Card className="p-10 bg-black/40 border-white/5 rounded-[3rem] shadow-2xl space-y-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 h-full w-full bg-[radial-gradient(circle_at_100%_0%,rgba(var(--primary-rgb),0.1),transparent)] opacity-20" />
              <div className="space-y-4 relative z-10">
                 <h3 className="text-xl font-black text-white uppercase tracking-tight">Security Protocol</h3>
                 <p className="text-xs text-gray-500 font-medium italic leading-relaxed">All API requests must be authenticated using the Bearer scheme with your master secret key.</p>
              </div>
              <div className="p-6 bg-black/60 rounded-2xl border border-white/5 font-mono text-[11px] text-gray-500 space-y-2 relative z-10">
                 <p>Authorization: <span className="text-primary">Bearer wsa_live_...</span></p>
                 <p>Content-Type: <span className="text-sky-400">application/json</span></p>
              </div>
              <Button className="w-full h-14 rounded-2xl bg-primary text-white font-black uppercase tracking-widest shadow-2xl shadow-primary/30 gap-2 relative z-10">
                 Manage Auth Keys <ArrowRight size={16} />
              </Button>
           </Card>

           <Card className="p-10 bg-black/40 border-white/5 rounded-[3rem] shadow-2xl space-y-8">
              <h3 className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] px-1">Platform Status</h3>
              <div className="space-y-6">
                 {[
                   { label: "API Cluster", status: "Operational", color: "bg-emerald-500" },
                   { label: "Neural Engine", status: "Operational", color: "bg-emerald-500" },
                   { label: "WhatsApp Gateway", status: "Operational", color: "bg-emerald-500" },
                   { label: "Webhook Dispatcher", status: "Operational", color: "bg-emerald-500" },
                 ].map((s, i) => (
                   <div key={i} className="flex items-center justify-between">
                      <p className="text-xs font-black text-gray-400 uppercase tracking-tight">{s.label}</p>
                      <div className="flex items-center gap-3">
                         <span className="text-[9px] font-black text-white uppercase tracking-widest">{s.status}</span>
                         <div className={cn("h-2 w-2 rounded-full animate-pulse shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]", s.color)} />
                      </div>
                   </div>
                 ))}
              </div>
              <div className="pt-6 border-t border-white/5">
                 <p className="text-[9px] text-gray-700 font-bold uppercase tracking-[0.2em] text-center italic">Uptime: 99.998% (30d)</p>
              </div>
           </Card>

           <Card className="p-10 bg-primary/5 border border-primary/20 rounded-[3rem] shadow-2xl space-y-4 relative group">
              <Cpu className="text-primary opacity-10 absolute -bottom-6 -left-6" size={140} />
              <div className="relative z-10 space-y-4 text-center">
                 <h4 className="text-xl font-black text-white tracking-tight">Neural SDK v2</h4>
                 <p className="text-xs text-gray-500 font-medium italic">Automate complex RAG workflows and context management programmatically.</p>
                 <Button variant="ghost" className="w-full h-12 rounded-xl bg-primary/10 text-primary font-black uppercase text-[10px] tracking-widest hover:bg-primary/20">
                    Explore SDK Library
                 </Button>
              </div>
           </Card>
        </div>
      </div>
    </div>
  );
}

function LinkCard({ href, icon: Icon, title, desc, color }: any) {
  const colorClass = color === 'primary' ? 'text-primary bg-primary/10 border-primary/20' : 'text-purple-500 bg-purple-500/10 border-purple-500/20';
  
  return (
    <Link href={href}>
      <Card className="p-8 bg-black/40 border-white/5 rounded-[2.5rem] group hover:border-white/20 hover:bg-black/60 transition-all cursor-pointer shadow-2xl relative overflow-hidden">
        <div className="flex items-center gap-6 relative z-10">
          <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center border transition-all group-hover:scale-110", colorClass)}>
            <Icon size={28} />
          </div>
          <div>
            <h4 className="text-lg font-black text-white uppercase tracking-tight group-hover:text-primary transition-colors">{title}</h4>
            <p className="text-xs text-gray-500 font-medium italic leading-relaxed mt-1">{desc}</p>
          </div>
        </div>
        <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
           <ExternalLink size={20} className="text-primary" />
        </div>
      </Card>
    </Link>
  );
}
