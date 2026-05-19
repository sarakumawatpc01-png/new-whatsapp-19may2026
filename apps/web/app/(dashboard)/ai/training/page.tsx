"use client";

import { useState, useEffect } from "react";
import { 
  Sparkles, 
  Plus, 
  Trash2, 
  Upload, 
  FileText, 
  CheckCircle2, 
  ChevronRight, 
  MessageSquare,
  Clock,
  Shield,
  HelpCircle,
  RefreshCw,
  Search,
  ExternalLink,
  Brain,
  Database,
  BrainCircuit,
  Zap,
  Info,
  ArrowRight,
  Globe,
  Settings,
  MoreVertical
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
  Skeleton,
  Progress,
  Avatar
} from "@repo/ui";
import api from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@repo/ui";
import { format } from "date-fns";

export default function AITrainingPage() {
  const [loading, setLoading] = useState(true);
  const [wizardStep, setWizardStep] = useState(0); 
  const [isTrained, setIsTrained] = useState(false);
  const [compiling, setCompiling] = useState(false);
  
  const [config, setConfig] = useState<any>(null);
  const [faqs, setFaqs] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("faqs");

  // Chat Preview State
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<any[]>([
    { role: 'assistant', content: "Neural Context initialized. I'm trained on your business data and ready to assist subscribers. Ask me anything to test my knowledge." }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  
  // Wizard State
  const [wizardData, setWizardData] = useState({
    businessName: "",
    industry: "",
    services: "",
    tone: "Friendly"
  });
  const [wizardResults, setWizardResults] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [configRes, faqsRes, docsRes] = await Promise.all([
        api.get("/ai/config"),
        api.get("/ai/faqs"),
        api.get("/ai/documents")
      ]);
      
      const configData = configRes.data.data;
      setConfig(configData);
      setFaqs(faqsRes.data.data);
      setDocuments(docsRes.data.data);
      
      if (configData.businessOverview) {
        setIsTrained(true);
      }
    } catch (e) {
      toast.error("Neural link interrupted");
    } finally {
      setLoading(false);
    }
  };

  const handleStartOnboarding = () => setWizardStep(1);

  const handleGenerateOnboarding = async () => {
    setLoading(true);
    try {
      const res = await api.post("/ai/onboarding/generate", wizardData);
      setWizardResults(res.data.data);
      setWizardStep(4);
    } catch (e) {
      toast.error("Generation node failure");
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOnboarding = async () => {
    setLoading(true);
    try {
      await api.put("/ai/config", {
        businessOverview: wizardResults.overview,
        businessName: wizardData.businessName,
      });
      
      for (const faq of wizardResults.faqs) {
        await api.post("/ai/faqs", faq);
      }
      
      await api.post("/ai/config/compile");
      
      toast.success("Intelligence successfully injected!");
      setIsTrained(true);
      setWizardStep(0);
      fetchData();
    } catch (e) {
      toast.error("Failed to commit configuration");
    } finally {
      setLoading(false);
    }
  };

  const handleCompile = async () => {
    setCompiling(true);
    try {
      await api.post("/ai/config/compile");
      toast.success("Neural matrix recompiled");
    } catch (e) {
      toast.error("Recompilation failure");
    } finally {
      setCompiling(false);
    }
  };

  const handleTestChat = async () => {
    if (!chatInput.trim()) return;
    const msg = chatInput;
    setChatInput("");
    setChatMessages(prev => [...prev, { role: 'user', content: msg }]);
    setIsTyping(true);
    
    try {
      const res = await api.post("/ai/test", { message: msg });
      setChatMessages(prev => [...prev, { role: 'assistant', content: res.data.data.content }]);
    } catch (e) {
      toast.error("Preview node unreachable");
    } finally {
      setIsTyping(false);
    }
  };

  if (loading && wizardStep === 0) {
    return (
      <div className="p-12 space-y-12 bg-[#0A0A0A] min-h-screen">
        <div className="flex justify-between items-center">
           <Skeleton className="h-12 w-64 bg-white/5 rounded-2xl" />
           <Skeleton className="h-12 w-48 bg-white/5 rounded-2xl" />
        </div>
        <div className="grid grid-cols-12 gap-8">
           <Skeleton className="col-span-8 h-[600px] bg-white/5 rounded-[2.5rem]" />
           <Skeleton className="col-span-4 h-[600px] bg-white/5 rounded-[2.5rem]" />
        </div>
      </div>
    );
  }

  // --- WIZARD VIEWS (0 to 4) ---
  if (!isTrained && wizardStep > 0) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(var(--primary-rgb),0.15),transparent)]" />
        
        <div className="max-w-3xl w-full space-y-12 relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
           <div className="text-center space-y-4">
              <Badge className="bg-primary/10 text-primary border-primary/20 font-black px-4 py-1.5 uppercase tracking-[0.2em] text-[10px]">Neural Onboarding</Badge>
              <h1 className="text-5xl font-black text-white tracking-tighter">Initialize Intelligence</h1>
              <div className="flex items-center justify-center gap-2">
                 {[1,2,3,4].map(s => (
                   <div key={s} className={cn("h-1.5 w-12 rounded-full transition-all duration-500", wizardStep >= s ? "bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]" : "bg-white/5")} />
                 ))}
              </div>
           </div>

           {wizardStep === 1 && (
             <Card className="p-12 bg-black/40 border-white/5 rounded-[3rem] shadow-2xl backdrop-blur-2xl space-y-8">
                <div className="space-y-2">
                   <h3 className="text-2xl font-black text-white tracking-tight">Identity Parameters</h3>
                   <p className="text-gray-500 font-medium italic">Define the core business context for the AI matrix.</p>
                </div>
                <div className="space-y-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em]">Entity Name</label>
                      <Input 
                        value={wizardData.businessName}
                        onChange={(e) => setWizardData({ ...wizardData, businessName: e.target.value })}
                        placeholder="e.g. Nexus Dynamics"
                        className="h-14 bg-white/5 border-white/10 rounded-2xl text-lg font-bold"
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em]">Industry Sector</label>
                      <select 
                        value={wizardData.industry}
                        onChange={(e) => setWizardData({ ...wizardData, industry: e.target.value })}
                        className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 text-white font-bold appearance-none"
                      >
                        <option value="">Select Sector...</option>
                        <option value="Real Estate">Real Estate</option>
                        <option value="SaaS">SaaS / Enterprise Software</option>
                        <option value="E-commerce">E-commerce / Retail</option>
                        <option value="Healthcare">Healthcare Systems</option>
                        <option value="Fintech">Financial Technology</option>
                      </select>
                   </div>
                </div>
                <Button className="w-full h-16 rounded-[1.5rem] text-lg font-black uppercase tracking-widest gap-3" onClick={() => setWizardStep(2)}>
                   Next Protocol <ArrowRight size={20} />
                </Button>
             </Card>
           )}

           {wizardStep === 2 && (
             <Card className="p-12 bg-black/40 border-white/5 rounded-[3rem] shadow-2xl backdrop-blur-2xl space-y-8">
                <div className="space-y-2">
                   <h3 className="text-2xl font-black text-white tracking-tight">Operational Logic</h3>
                   <p className="text-gray-500 font-medium italic">Describe your services and primary value propositions.</p>
                </div>
                <textarea 
                  value={wizardData.services}
                  onChange={(e) => setWizardData({ ...wizardData, services: e.target.value })}
                  placeholder="We provide end-to-end automation for marketing agencies, including neural content generation and lead scoring..."
                  className="w-full bg-white/5 border border-white/10 rounded-[2rem] p-8 text-lg font-bold text-white min-h-[250px] focus:outline-none focus:border-primary/50 transition-all"
                />
                <div className="flex gap-4">
                  <Button variant="ghost" className="h-16 flex-1 rounded-2xl font-black uppercase tracking-widest" onClick={() => setWizardStep(1)}>Genesis</Button>
                  <Button className="h-16 flex-[2] rounded-2xl font-black uppercase tracking-widest gap-3" onClick={() => setWizardStep(3)}>Next Protocol <ArrowRight size={20} /></Button>
                </div>
             </Card>
           )}

           {wizardStep === 3 && (
             <div className="space-y-10">
                <div className="grid grid-cols-3 gap-6">
                  {[
                    { label: "Friendly", icon: Brain, desc: "Approachable, warm, and highly engaging." },
                    { label: "Formal", icon: Shield, desc: "Professional, precise, and authoritative." },
                    { label: "Sales", icon: Zap, desc: "Persuasive, energetic, and goal-oriented." }
                  ].map((t) => (
                    <button 
                      key={t.label}
                      onClick={() => setWizardData({ ...wizardData, tone: t.label })}
                      className={cn(
                        "p-10 rounded-[2.5rem] border-2 transition-all text-center space-y-4 group relative overflow-hidden",
                        wizardData.tone === t.label 
                          ? "bg-primary/5 border-primary shadow-[0_20px_50px_rgba(var(--primary-rgb),0.2)]" 
                          : "bg-black/40 border-white/5 hover:border-white/10"
                      )}
                    >
                      <div className={cn(
                        "h-16 w-16 rounded-2xl mx-auto flex items-center justify-center transition-all",
                        wizardData.tone === t.label ? "bg-primary text-white scale-110" : "bg-white/5 text-gray-500 group-hover:text-gray-300"
                      )}>
                        <t.icon size={32} />
                      </div>
                      <h4 className="text-xl font-black text-white">{t.label}</h4>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-relaxed">
                        {t.desc}
                      </p>
                    </button>
                  ))}
                </div>
                <div className="flex gap-4">
                  <Button variant="ghost" className="h-16 flex-1 rounded-2xl font-black uppercase tracking-widest" onClick={() => setWizardStep(2)}>Operational</Button>
                  <Button className="h-16 flex-[2] rounded-2xl font-black uppercase tracking-widest gap-3 shadow-2xl shadow-primary/20" onClick={handleGenerateOnboarding}>
                    <Sparkles size={20} /> Generate Neural Matrix
                  </Button>
                </div>
             </div>
           )}

           {wizardStep === 4 && wizardResults && (
             <Card className="p-12 bg-black/40 border-white/5 rounded-[3rem] shadow-2xl backdrop-blur-2xl space-y-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 h-full w-1/4 bg-gradient-to-l from-primary/5 to-transparent blur-3xl" />
                <div className="space-y-2">
                   <h3 className="text-2xl font-black text-white tracking-tight">Review Generated Matrix</h3>
                   <p className="text-gray-500 font-medium italic">Verify the synthesized intelligence before injection.</p>
                </div>
                <div className="space-y-8">
                  <div className="space-y-4 p-8 bg-white/[0.02] rounded-[2rem] border border-white/5">
                    <div>
                      <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Neural Overview</label>
                      <p className="text-base text-gray-300 font-bold mt-2 leading-relaxed italic">"{wizardResults.overview}"</p>
                    </div>
                    <div className="pt-6 border-t border-white/5">
                      <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Behavioral Directives</label>
                      <p className="text-sm text-gray-400 mt-2 whitespace-pre-line font-medium leading-relaxed">{wizardResults.instructions}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] px-4">Synthesized Knowledge Nodes (FAQs)</label>
                    <div className="grid grid-cols-1 gap-2">
                      {wizardResults.faqs.map((f: any, i: number) => (
                        <div key={i} className="px-6 py-3 bg-white/5 rounded-xl text-[11px] text-gray-400 font-bold border border-white/5">
                          <span className="text-primary mr-2 font-black tracking-widest">NODE_{i+1}:</span> {f.question}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <Button className="w-full h-16 rounded-[1.5rem] text-lg font-black uppercase tracking-widest gap-3 shadow-2xl shadow-primary/20" onClick={handleAcceptOnboarding}>
                   Inject Intelligence <CheckCircle2 size={24} />
                </Button>
             </Card>
           )}
        </div>
      </div>
    );
  }

  // --- WELCOME / EMPTY VIEW ---
  if (!isTrained && wizardStep === 0) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(var(--primary-rgb),0.1),transparent)]" />
        <div className="max-w-2xl w-full text-center space-y-10 animate-in fade-in slide-in-from-bottom-12 duration-1000">
           <div className="h-48 w-48 bg-primary/10 rounded-[4rem] border-2 border-primary/20 flex items-center justify-center text-primary mx-auto relative group">
              <div className="absolute inset-0 bg-primary/20 rounded-[4rem] blur-3xl group-hover:bg-primary/40 transition-all duration-1000" />
              <BrainCircuit size={96} className="relative z-10" />
           </div>
           <div className="space-y-4">
              <h1 className="text-6xl font-black text-white tracking-tighter">Awaken your AI</h1>
              <p className="text-xl text-gray-500 font-medium leading-relaxed">
                Your neural core is currently offline. Initialize the onboarding protocol to train your AI on business logic, documents, and unique brand tone.
              </p>
           </div>
           <Button size="lg" className="h-20 px-12 rounded-[2rem] gap-4 text-xl font-black uppercase tracking-widest shadow-2xl shadow-primary/20 group" onClick={handleStartOnboarding}>
              Initialize Neural Pilot
              <ArrowRight size={28} className="group-hover:translate-x-2 transition-transform" />
           </Button>
        </div>
      </div>
    );
  }

  // --- MAIN TRAINING HUB ---
  return (
    <div className="p-12 max-w-full space-y-12 bg-[#0A0A0A] min-h-screen animate-in fade-in duration-700">
      <div className="flex items-center justify-between bg-black/40 p-10 rounded-[3rem] border border-white/5 relative overflow-hidden backdrop-blur-3xl shadow-2xl">
        <div className="absolute top-0 left-0 h-full w-full bg-[radial-gradient(circle_at_50%_-50%,rgba(var(--primary-rgb),0.1),transparent)] opacity-50" />
        <div className="relative z-10 flex items-center gap-8">
           <div className="h-20 w-20 bg-primary/10 rounded-[2rem] border-2 border-primary/20 flex items-center justify-center text-primary shadow-2xl shadow-primary/20">
              <Database size={40} />
           </div>
           <div>
              <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-4">
                Neural Intelligence Hub
                <Badge className="bg-emerald-500/10 text-emerald-500 border-none px-3 py-1 text-[10px] font-black uppercase tracking-widest">Core Online</Badge>
              </h1>
              <p className="text-gray-500 text-sm font-medium italic mt-1">Orchestrating knowledge nodes and behavioral directives for {config?.businessName || "your entity"}.</p>
           </div>
        </div>
        <div className="relative z-10 flex gap-4">
           <div className="px-6 py-4 bg-white/5 rounded-2xl border border-white/5 flex flex-col justify-center">
              <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Neural Sync</span>
              <span className="text-xs font-black text-white font-mono uppercase">98.4% Efficiency</span>
           </div>
           <Button 
              className={cn(
                "h-16 px-8 rounded-2xl gap-3 text-xs font-black uppercase tracking-widest transition-all",
                compiling ? "bg-primary/20 text-primary border border-primary/20" : "bg-primary text-white shadow-2xl shadow-primary/20"
              )}
              onClick={handleCompile}
              disabled={compiling}
           >
              {compiling ? <RefreshCw className="animate-spin" size={20} /> : <Sparkles size={20} />}
              {compiling ? "Synchronizing..." : "Recompile Matrix"}
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-10">
        {/* Knowledge Management */}
        <div className="col-span-8 space-y-10">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-10">
            <div className="flex items-center justify-between">
               <TabsList className="bg-black/40 border border-white/5 p-1.5 rounded-2xl h-14 flex items-center gap-1 w-fit">
                  {[
                    { id: "faqs", label: "Knowledge Nodes", icon: HelpCircle },
                    { id: "documents", label: "RAG Vault", icon: FileText },
                    { id: "rules", label: "Directives", icon: Shield }
                  ].map((tab) => (
                    <TabsTrigger 
                      key={tab.id} 
                      value={tab.id} 
                      className="px-8 h-11 rounded-xl text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white/5 data-[state=active]:text-primary transition-all gap-2"
                    >
                      <tab.icon size={16} /> {tab.label}
                    </TabsTrigger>
                  ))}
               </TabsList>
               
               {activeTab !== "rules" && (
                 <Button className="h-14 px-8 rounded-2xl gap-3 bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-black uppercase tracking-widest">
                    <Plus size={20} className="text-primary" /> 
                    {activeTab === "faqs" ? "New Knowledge Node" : "Ingest Document"}
                 </Button>
               )}
            </div>

            <TabsContent value="faqs" className="space-y-6 animate-in fade-in duration-500">
               <div className="relative">
                 <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                 <Input 
                   placeholder="Search knowledge repository..." 
                   className="pl-16 h-16 bg-black/40 border-white/5 rounded-2xl text-base font-bold placeholder:text-gray-700" 
                 />
               </div>

               <div className="grid grid-cols-1 gap-6">
                 {faqs.map((faq) => (
                   <Card key={faq.id} className="p-8 bg-black/40 border-white/5 rounded-[2.5rem] group hover:border-primary/20 hover:bg-black/60 transition-all cursor-pointer shadow-xl relative overflow-hidden">
                     <div className="absolute top-0 right-0 h-full w-1/4 bg-gradient-to-l from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                     <div className="flex justify-between items-start gap-10">
                       <div className="space-y-3 flex-1 relative z-10">
                         <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                               <HelpCircle size={16} />
                            </div>
                            <h4 className="text-lg font-black text-white group-hover:text-primary transition-colors tracking-tight">{faq.question}</h4>
                         </div>
                         <p className="text-sm text-gray-500 leading-relaxed font-medium italic">"{faq.answer}"</p>
                       </div>
                       <div className="flex gap-2 relative z-10">
                         <Button variant="ghost" size="icon" className="h-12 w-12 rounded-xl text-gray-600 hover:text-white hover:bg-white/5">
                           <Settings size={20} />
                         </Button>
                         <Button variant="ghost" size="icon" className="h-12 w-12 rounded-xl text-gray-600 hover:text-rose-500 hover:bg-rose-500/5">
                           <Trash2 size={20} />
                         </Button>
                       </div>
                     </div>
                   </Card>
                 ))}
                 {faqs.length === 0 && (
                   <div className="py-32 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[3rem] opacity-20">
                      <HelpCircle size={64} className="mb-4" />
                      <p className="text-[10px] font-black uppercase tracking-[0.4em]">No Knowledge Nodes Found</p>
                   </div>
                 )}
               </div>
            </TabsContent>

            <TabsContent value="documents" className="space-y-10 animate-in fade-in duration-500">
               <div className="p-16 border-2 border-dashed border-white/5 rounded-[4rem] text-center space-y-6 group hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer relative overflow-hidden">
                 <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(var(--primary-rgb),0.05),transparent)] opacity-0 group-hover:opacity-100 transition-opacity" />
                 <div className="h-24 w-24 bg-white/5 rounded-[2rem] border border-white/5 flex items-center justify-center mx-auto text-gray-600 group-hover:text-primary group-hover:scale-110 transition-all shadow-2xl">
                   <Upload size={48} />
                 </div>
                 <div className="space-y-2 relative z-10">
                   <h4 className="text-2xl font-black text-white tracking-tight">Ingest Intelligence Vault</h4>
                   <p className="text-gray-500 font-medium italic">Upload PDF, DOCX, or Website URLs for RAG indexing. (Max 50MB per cycle)</p>
                 </div>
                 <div className="flex justify-center gap-4 relative z-10">
                    <Badge className="bg-white/5 text-gray-500 border-none font-black px-3 py-1">PDF_NODE</Badge>
                    <Badge className="bg-white/5 text-gray-500 border-none font-black px-3 py-1">DOCX_NODE</Badge>
                    <Badge className="bg-white/5 text-gray-500 border-none font-black px-3 py-1">URL_STREAM</Badge>
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-6">
                 {documents.map((doc) => (
                   <Card key={doc.id} className="p-8 bg-black/40 border-white/5 rounded-[2.5rem] flex items-center gap-6 group hover:border-primary/20 transition-all shadow-xl relative overflow-hidden">
                     <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary group-hover:rotate-6 transition-transform">
                       <FileText size={32} />
                     </div>
                     <div className="flex-1 min-w-0">
                       <h5 className="text-lg font-black text-white truncate tracking-tight">{doc.name}</h5>
                       <div className="flex items-center gap-3 mt-1">
                          <div className={cn("h-2 w-2 rounded-full", doc.processed ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-amber-500 animate-pulse")} />
                          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                            {doc.processed ? "Vector Indexed" : "Indexing..."}
                          </p>
                       </div>
                     </div>
                     <Button variant="ghost" size="icon" className="h-12 w-12 rounded-xl text-gray-600 hover:text-rose-500 transition-colors">
                       <Trash2 size={20} />
                     </Button>
                   </Card>
                 ))}
               </div>
            </TabsContent>

            <TabsContent value="rules" className="space-y-10 animate-in fade-in duration-500">
               <Card className="p-12 bg-black/40 border-white/5 rounded-[3rem] shadow-2xl space-y-12">
                 <div className="space-y-6">
                   <div className="flex items-center justify-between">
                      <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-4">
                        <Clock className="text-primary" size={24} />
                        Neural Operating Window
                      </h3>
                      <Button variant="ghost" className="text-primary font-black uppercase text-[10px] tracking-widest h-10 px-4 rounded-xl hover:bg-primary/10">Configure Schedule</Button>
                   </div>
                   <div className="grid grid-cols-7 gap-4">
                      {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                        <div key={day} className="flex flex-col items-center gap-3 p-4 bg-white/[0.02] rounded-2xl border border-white/5">
                           <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">{day}</span>
                           <div className="h-12 w-1 bg-primary/40 rounded-full" />
                           <span className="text-[9px] text-white font-black font-mono">09-18</span>
                        </div>
                      ))}
                   </div>
                 </div>
                 
                 <div className="space-y-6 pt-12 border-t border-white/5">
                   <div className="flex items-center justify-between">
                      <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-4">
                        <Shield className="text-primary" size={24} />
                        Escalation Directives
                      </h3>
                      <Button variant="ghost" className="text-primary font-black uppercase text-[10px] tracking-widest h-10 px-4 rounded-xl hover:bg-primary/10">Manage Triggers</Button>
                   </div>
                   <p className="text-gray-500 font-medium italic text-sm">When the following patterns are detected, AI will automatically pause and notify a human agent.</p>
                   <div className="flex flex-wrap gap-3">
                     {["human", "support", "agent", "refund", "manager", "stuck", "frustrated", "complaint", "billing", "talk to person"].map((kw) => (
                       <Badge key={kw} className="bg-white/5 border border-white/5 text-gray-500 font-black lowercase py-2 px-5 rounded-xl hover:border-primary/50 hover:text-white cursor-pointer transition-all">
                         {kw}
                       </Badge>
                     ))}
                   </div>
                 </div>
               </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Live Simulator */}
        <div className="col-span-4 space-y-10">
          <Card className="bg-black/40 border-white/5 rounded-[3rem] shadow-2xl p-0 sticky top-12 overflow-hidden flex flex-col h-[800px]">
            <div className="p-8 border-b border-white/5 bg-white/[0.02]">
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center text-white shadow-2xl shadow-primary/20">
                       <BrainCircuit size={28} />
                    </div>
                    <div>
                       <h4 className="text-xl font-black text-white tracking-tight">Neural Simulator</h4>
                       <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                          <span className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.2em]">Live Sandbox</span>
                       </div>
                    </div>
                 </div>
                 <Button variant="ghost" size="icon" className="h-12 w-12 rounded-xl text-gray-600 hover:text-white">
                    <RefreshCw size={20} />
                 </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-8 bg-black/20">
               {chatMessages.map((m, i) => (
                 <div key={i} className={cn(
                   "flex flex-col max-w-[85%] animate-in fade-in slide-in-from-bottom-2 duration-500",
                   m.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                 )}>
                    <div className="flex items-center gap-2 mb-2 px-1">
                       <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">{m.role === 'user' ? "Test Observer" : "Neural Agent"}</span>
                    </div>
                    <div className={cn(
                      "p-5 rounded-[1.5rem] text-sm font-bold leading-relaxed",
                      m.role === 'user' 
                        ? "bg-primary text-white rounded-tr-none shadow-xl" 
                        : "bg-white/5 text-gray-300 border border-white/5 rounded-tl-none italic"
                    )}>
                       {m.content}
                    </div>
                 </div>
               ))}
               {isTyping && (
                 <div className="flex items-center gap-3 text-primary animate-pulse ml-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    <div className="h-1.5 w-1.5 rounded-full bg-primary delay-75" />
                    <div className="h-1.5 w-1.5 rounded-full bg-primary delay-150" />
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] ml-2">Processing Node...</span>
                 </div>
               )}
            </div>
            
            <div className="p-8 border-t border-white/5 bg-white/[0.02]">
               <div className="relative group">
                 <Input 
                   value={chatInput}
                   onChange={(e) => setChatInput(e.target.value)}
                   onKeyDown={(e) => e.key === 'Enter' && handleTestChat()}
                   placeholder="Inject test transmission..." 
                   className="h-16 pl-8 pr-16 bg-black border-white/10 rounded-2xl text-base font-bold placeholder:text-gray-700 group-hover:border-primary/50 transition-all" 
                 />
                 <Button 
                   className="absolute right-2 top-2 h-12 w-12 rounded-xl p-0 shadow-2xl"
                   onClick={handleTestChat}
                   disabled={isTyping}
                 >
                   <ArrowRight size={24} />
                 </Button>
               </div>
               <div className="flex items-center justify-between mt-4 px-2">
                  <div className="flex items-center gap-2">
                     <Clock size={12} className="text-gray-600" />
                     <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Avg Latency: 1.2s</span>
                  </div>
                  <div className="flex items-center gap-2">
                     <Zap size={12} className="text-primary" />
                     <span className="text-[9px] font-black text-primary uppercase tracking-widest">Context Memory: Active</span>
                  </div>
               </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
