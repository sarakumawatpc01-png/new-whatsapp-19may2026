"use client";

import { useState, useEffect } from "react";
import { 
  Sparkles, 
  Settings, 
  Database, 
  BarChart3, 
  Save, 
  RefreshCw,
  Lock,
  Eye,
  EyeOff,
  Zap,
  BookOpen,
  FileText,
  Plus,
  Trash2,
  ChevronRight,
  TrendingUp,
  BrainCircuit,
  MessageSquare,
  ShieldCheck,
  AlertCircle
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
  Skeleton
} from "@repo/ui";
import api from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@repo/ui";
import { format } from "date-fns";

export default function AISettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [activeTab, setActiveTab] = useState("provider");
  
  // Data State
  const [config, setConfig] = useState<any>({});
  const [providers, setProviders] = useState<string[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [faqs, setFaqs] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [usage, setUsage] = useState<any>({ stats: {}, logs: [] });

  // UI State
  const [newFaq, setNewFaq] = useState({ question: "", answer: "" });
  const [testMessage, setTestMessage] = useState("");
  const [testResult, setTestResult] = useState("");
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (config.provider) {
      fetchModels(config.provider);
    }
  }, [config.provider]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [configRes, providersRes, faqsRes, docsRes, usageRes] = await Promise.all([
        api.get("/ai/config"),
        api.get("/ai/providers"),
        api.get("/ai/faqs"),
        api.get("/ai/documents"),
        api.get("/ai/usage"),
      ]);
      
      setConfig(configRes.data.data);
      setProviders(providersRes.data.data);
      setFaqs(faqsRes.data.data);
      setDocuments(docsRes.data.data);
      setUsage(usageRes.data.data);
    } catch (e) {
      toast.error("Failed to load AI data");
    } finally {
      setLoading(false);
    }
  };

  const fetchModels = async (provider: string) => {
    try {
      const res = await api.get(`/ai/models?provider=${provider}`);
      setModels(res.data.data);
    } catch (e) {
      toast.error(`Failed to load models for ${provider}`);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put("/ai/config", config);
      toast.success("AI configuration saved");
    } catch (e) {
      toast.error("Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateFAQ = async () => {
    if (!newFaq.question || !newFaq.answer) return;
    try {
      const res = await api.post("/ai/faqs", newFaq);
      setFaqs([...faqs, res.data.data]);
      setNewFaq({ question: "", answer: "" });
      toast.success("FAQ added");
    } catch (e) {
      toast.error("Failed to add FAQ");
    }
  };

  const handleDeleteFAQ = async (id: string) => {
    try {
      await api.delete(`/ai/faqs/${id}`);
      setFaqs(faqs.filter(f => f.id !== id));
      toast.success("FAQ removed");
    } catch (e) {
      toast.error("Failed to remove FAQ");
    }
  };

  const handleTest = async () => {
    if (!testMessage) return;
    setTesting(true);
    try {
      const res = await api.post("/ai/test", { message: testMessage });
      setTestResult(res.data.data.content);
    } catch (e) {
      toast.error("Test failed");
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 space-y-8 max-w-7xl mx-auto">
        <Skeleton className="h-12 w-64 bg-white/5 rounded-2xl" />
        <div className="grid grid-cols-12 gap-8">
           <div className="col-span-3">
             <Skeleton className="h-[400px] w-full bg-white/5 rounded-3xl" />
           </div>
           <div className="col-span-9">
             <Skeleton className="h-[600px] w-full bg-white/5 rounded-3xl" />
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-black/40 p-8 rounded-[2rem] border border-white/5 relative overflow-hidden group">
        <div className="absolute top-0 right-0 h-full w-1/3 bg-gradient-to-l from-primary/10 to-transparent blur-3xl opacity-50" />
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-2">
            <div className="h-14 w-14 bg-primary/20 rounded-2xl flex items-center justify-center text-primary border border-primary/20 shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]">
              <BrainCircuit size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight">AI Orchestrator</h1>
              <div className="flex items-center gap-3 mt-1">
                <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px] font-bold uppercase tracking-widest">System Stable</Badge>
                <div className="h-1 w-1 rounded-full bg-gray-700" />
                <p className="text-xs text-gray-400 font-medium">Powering automated conversations with {config.provider || "Default"}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 relative z-10">
           <Button variant="outline" className="rounded-2xl border-white/10 hover:bg-white/5 gap-2 px-6 h-12 text-sm font-bold">
              <RefreshCw size={18} /> Reset
           </Button>
           <Button onClick={handleSave} disabled={saving} className="rounded-2xl gap-2 shadow-2xl px-8 h-12 text-sm font-bold bg-primary hover:bg-primary-hover shadow-primary/20">
            {saving ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
            Synchronize AI
          </Button>
        </div>
      </div>

      <Tabs defaultValue="provider" onValueChange={setActiveTab} className="grid grid-cols-12 gap-8 items-start">
        {/* Sidebar Navigation */}
        <div className="col-span-3 sticky top-8">
          <TabsList className="flex flex-col h-auto bg-transparent border-none p-0 gap-2">
            {[
              { id: "provider", icon: Settings, label: "Core Engine", desc: "Providers & Models" },
              { id: "training", icon: BookOpen, label: "Knowledge Base", desc: "FAQs & Guidelines" },
              { id: "documents", icon: FileText, label: "Neural Memory", desc: "Document Processing" },
              { id: "playground", icon: Zap, label: "Playground", desc: "Test Responses" },
              { id: "analytics", icon: BarChart3, label: "Analytics", desc: "Usage & Cost" },
            ].map((tab) => (
              <TabsTrigger 
                key={tab.id}
                value={tab.id}
                className={cn(
                  "w-full justify-start gap-4 p-4 rounded-2xl border transition-all duration-300 text-left",
                  activeTab === tab.id 
                    ? "bg-white/10 border-white/10 text-white shadow-xl translate-x-2" 
                    : "bg-transparent border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/[0.02]"
                )}
              >
                <div className={cn(
                  "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border transition-all",
                  activeTab === tab.id ? "bg-primary border-primary/20 text-white shadow-[0_0_15px_rgba(var(--primary-rgb),0.4)]" : "bg-white/5 border-white/5"
                )}>
                  <tab.icon size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold tracking-tight">{tab.label}</p>
                  <p className="text-[10px] opacity-60 font-medium uppercase tracking-wider">{tab.desc}</p>
                </div>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Main Content Areas */}
        <div className="col-span-9 space-y-8">
          {/* TAB: PROVIDER */}
          <TabsContent value="provider" className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <Card className="p-8 bg-black/40 border-white/5 rounded-[2rem] space-y-8">
               <div className="space-y-6">
                  <div className="flex items-center gap-2">
                     <div className="h-2 w-2 rounded-full bg-primary" />
                     <h3 className="text-lg font-black text-white uppercase tracking-widest">Model Configuration</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Primary Provider</label>
                      <select 
                        value={config.provider}
                        onChange={(e) => setConfig({ ...config, provider: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-primary/40 transition-all appearance-none cursor-pointer"
                      >
                        {providers.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Neural Model</label>
                      <select 
                        value={config.model}
                        onChange={(e) => setConfig({ ...config, model: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-primary/40 transition-all appearance-none cursor-pointer"
                      >
                        {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        {models.length === 0 && <option value={config.model}>{config.model}</option>}
                      </select>
                    </div>
                  </div>
               </div>

               <div className="space-y-6 pt-8 border-t border-white/5">
                  <div className="flex items-center justify-between">
                     <div className="space-y-1">
                        <h3 className="text-lg font-black text-white uppercase tracking-widest">Authentication</h3>
                        <p className="text-xs text-gray-500">Secure your connections with individual or platform keys.</p>
                     </div>
                     <div className="flex items-center gap-4 bg-white/5 p-2 rounded-2xl border border-white/5">
                        <span className="text-[10px] font-black uppercase tracking-widest px-2">Shared Keys</span>
                        <button 
                          onClick={() => setConfig({ ...config, useSharedKey: !config.useSharedKey })}
                          className={cn(
                            "w-12 h-6 rounded-full transition-all relative",
                            config.useSharedKey ? "bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.4)]" : "bg-white/10"
                          )}
                        >
                          <div className={cn(
                            "absolute top-1 h-4 w-4 rounded-full bg-white transition-all shadow-md",
                            config.useSharedKey ? "right-1" : "left-1"
                          )} />
                        </button>
                     </div>
                  </div>

                  {!config.useSharedKey ? (
                    <div className="space-y-3 animate-in slide-in-from-top-4 duration-500">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Your API Key</label>
                      <div className="relative">
                        <Input 
                          type={showKey ? "text" : "password"}
                          value={config.apiKey === "********" ? "" : config.apiKey}
                          onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                          placeholder="Paste your API key here (sk-...)"
                          className="bg-white/5 border-white/10 h-14 rounded-2xl px-6 pr-16 font-mono text-sm"
                        />
                        <button 
                          onClick={() => setShowKey(!showKey)}
                          className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                        >
                          {showKey ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 bg-primary/5 border border-primary/20 rounded-[1.5rem] flex items-center gap-6 group">
                       <div className="h-16 w-16 bg-primary/20 rounded-2xl flex items-center justify-center text-primary border border-primary/20 shrink-0 group-hover:scale-110 transition-transform">
                          <ShieldCheck size={32} />
                       </div>
                       <div>
                          <p className="text-base font-bold text-white tracking-tight">Enterprise Shared Keys Active</p>
                          <p className="text-sm text-gray-500 leading-relaxed max-w-lg mt-1">
                            Your account is currently utilizing the platform's high-tier infrastructure. Usage is monitored and billed directly to your platform balance.
                          </p>
                       </div>
                    </div>
                  )}
               </div>
            </Card>

            <div className="grid grid-cols-2 gap-8">
               <Card className="p-8 bg-black/40 border-white/5 rounded-[2rem] space-y-6">
                  <div className="flex items-center gap-3">
                     <Zap size={20} className="text-primary" />
                     <h3 className="text-sm font-black text-white uppercase tracking-widest">Creativity</h3>
                  </div>
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-end">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Temperature</label>
                        <span className="text-lg font-black text-primary font-mono">{config.temperature}</span>
                      </div>
                      <input 
                        type="range" min="0" max="1" step="0.1" 
                        value={config.temperature}
                        onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
                        className="w-full accent-primary bg-white/10 h-1.5 rounded-full appearance-none cursor-pointer"
                      />
                      <p className="text-[10px] text-gray-600 font-medium">Lower is more predictable, higher is more creative.</p>
                    </div>
                  </div>
               </Card>
               <Card className="p-8 bg-black/40 border-white/5 rounded-[2rem] space-y-6">
                  <div className="flex items-center gap-3">
                     <MessageSquare size={20} className="text-primary" />
                     <h3 className="text-sm font-black text-white uppercase tracking-widest">Response Length</h3>
                  </div>
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-end">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Max Tokens</label>
                        <span className="text-lg font-black text-primary font-mono">{config.maxTokens}</span>
                      </div>
                      <input 
                        type="range" min="100" max="4000" step="100" 
                        value={config.maxTokens}
                        onChange={(e) => setConfig({ ...config, maxTokens: parseInt(e.target.value) })}
                        className="w-full accent-primary bg-white/10 h-1.5 rounded-full appearance-none cursor-pointer"
                      />
                      <p className="text-[10px] text-gray-600 font-medium">Controls the maximum length of generated replies.</p>
                    </div>
                  </div>
               </Card>
            </div>
          </TabsContent>

          {/* TAB: TRAINING */}
          <TabsContent value="training" className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
             <Card className="p-8 bg-black/40 border-white/5 rounded-[2rem] space-y-8">
                <div className="grid grid-cols-2 gap-8">
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Business Name</label>
                      <Input 
                        value={config.businessName}
                        onChange={(e) => setConfig({ ...config, businessName: e.target.value })}
                        className="bg-white/5 border-white/10 h-14 rounded-2xl px-6"
                      />
                   </div>
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Industry / Sector</label>
                      <Input 
                        value={config.industry}
                        onChange={(e) => setConfig({ ...config, industry: e.target.value })}
                        className="bg-white/5 border-white/10 h-14 rounded-2xl px-6"
                      />
                   </div>
                </div>

                <div className="space-y-4">
                   <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Executive Overview</label>
                   <textarea 
                     value={config.businessOverview}
                     onChange={(e) => setConfig({ ...config, businessOverview: e.target.value })}
                     className="w-full bg-white/5 border border-white/10 rounded-[1.5rem] p-6 text-sm text-white min-h-[160px] focus:outline-none focus:border-primary/40 transition-all font-medium leading-relaxed"
                     placeholder="Tell the AI what your business does..."
                   />
                </div>

                <div className="grid grid-cols-2 gap-8">
                   <div className="space-y-4">
                      <label className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">Positive Behaviors (Do's)</label>
                      <textarea 
                        value={config.doInstructions}
                        onChange={(e) => setConfig({ ...config, doInstructions: e.target.value })}
                        className="w-full bg-emerald-500/5 border border-emerald-500/20 rounded-[1.5rem] p-6 text-sm text-white min-h-[200px] focus:outline-none focus:border-emerald-500/40 transition-all font-medium leading-relaxed"
                        placeholder="Always offer a discount for new users..."
                      />
                   </div>
                   <div className="space-y-4">
                      <label className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em]">Strict Constraints (Don'ts)</label>
                      <textarea 
                        value={config.dontInstructions}
                        onChange={(e) => setConfig({ ...config, dontInstructions: e.target.value })}
                        className="w-full bg-rose-500/5 border border-rose-500/20 rounded-[1.5rem] p-6 text-sm text-white min-h-[200px] focus:outline-none focus:border-rose-500/40 transition-all font-medium leading-relaxed"
                        placeholder="Never mention competitors..."
                      />
                   </div>
                </div>
             </Card>

             {/* FAQ Manager */}
             <div className="space-y-6">
                <div className="flex items-center justify-between">
                   <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-3">
                      <BookOpen className="text-primary" /> FAQ Neural Mapping
                   </h3>
                   <Badge className="bg-white/5 text-gray-500 border-white/10 px-4 py-1 rounded-full font-bold uppercase tracking-widest text-[10px]">{faqs.length} Pairs</Badge>
                </div>

                <div className="grid grid-cols-1 gap-4">
                   {faqs.map((faq) => (
                      <Card key={faq.id} className="p-6 bg-black/40 border-white/5 rounded-2xl group hover:border-primary/20 transition-all">
                         <div className="flex justify-between items-start gap-6">
                            <div className="space-y-3 flex-1">
                               <p className="text-sm font-black text-white tracking-tight">Q: {faq.question}</p>
                               <p className="text-sm text-gray-400 font-medium leading-relaxed">A: {faq.answer}</p>
                            </div>
                            <Button 
                               variant="ghost" size="icon" 
                               className="text-gray-700 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                               onClick={() => handleDeleteFAQ(faq.id)}
                            >
                               <Trash2 size={18} />
                            </Button>
                         </div>
                      </Card>
                   ))}

                   <Card className="p-8 bg-white/[0.03] border-dashed border-white/10 rounded-2xl space-y-6">
                      <h4 className="text-sm font-black text-white uppercase tracking-widest">Inject New Knowledge</h4>
                      <div className="space-y-4">
                         <Input 
                           placeholder="Consumer Question?" 
                           value={newFaq.question}
                           onChange={(e) => setNewFaq({ ...newFaq, question: e.target.value })}
                           className="bg-white/5 border-white/10 h-12 rounded-xl"
                         />
                         <textarea 
                           placeholder="The Neural Answer..."
                           value={newFaq.answer}
                           onChange={(e) => setNewFaq({ ...newFaq, answer: e.target.value })}
                           className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white min-h-[100px] focus:outline-none focus:border-primary/40 transition-all"
                         />
                         <Button onClick={handleCreateFAQ} className="w-full h-12 rounded-xl bg-primary hover:bg-primary-hover font-black uppercase tracking-widest text-xs gap-2 shadow-xl shadow-primary/10">
                            <Plus size={18} /> Append to Training
                         </Button>
                      </div>
                   </Card>
                </div>
             </div>
          </TabsContent>

          {/* TAB: PLAYGROUND */}
          <TabsContent value="playground" className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
             <Card className="p-8 bg-black/40 border-white/5 rounded-[2rem] space-y-8">
                <div className="space-y-6">
                   <div className="flex items-center gap-3">
                      <Zap size={24} className="text-primary fill-primary/20" />
                      <div>
                        <h3 className="text-xl font-black text-white tracking-tight">AI Playground</h3>
                        <p className="text-xs text-gray-500 mt-0.5">Test how your AI responds to specific scenarios.</p>
                      </div>
                   </div>

                   <div className="space-y-4">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Prompt Simulation</label>
                      <div className="relative group">
                        <textarea 
                          value={testMessage}
                          onChange={(e) => setTestMessage(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-[1.5rem] p-6 text-sm text-white min-h-[140px] focus:outline-none focus:border-primary/40 transition-all font-medium leading-relaxed pr-24"
                          placeholder="Type a message to simulate a user..."
                        />
                        <Button 
                          onClick={handleTest} 
                          disabled={testing || !testMessage}
                          className="absolute right-4 bottom-4 h-12 w-12 rounded-2xl bg-primary hover:bg-primary-hover p-0 shadow-2xl"
                        >
                          {testing ? <RefreshCw className="animate-spin" size={20} /> : <ChevronRight size={24} />}
                        </Button>
                      </div>
                   </div>

                   {testResult && (
                     <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
                        <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Neural Output</label>
                        <div className="p-8 rounded-[2rem] bg-primary/10 border border-primary/20 relative overflow-hidden group">
                           <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-100 transition-opacity">
                              <Sparkles size={24} className="text-primary animate-pulse" />
                           </div>
                           <p className="text-base text-white leading-relaxed font-medium whitespace-pre-wrap">{testResult}</p>
                        </div>
                     </div>
                   )}
                </div>
             </Card>
          </TabsContent>

          {/* TAB: ANALYTICS */}
          <TabsContent value="analytics" className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
             <div className="grid grid-cols-3 gap-8">
                {[
                  { label: "Neural Tokens", val: usage.stats?.totalTokens?.toLocaleString() || "0", trend: "+12%", color: "text-primary" },
                  { label: "Auto-Resolved", val: "94.2%", trend: "+2.1%", color: "text-emerald-500" },
                  { label: "Cost (USD)", val: `$${(usage.stats?.costUsd || 0).toFixed(2)}`, trend: "-5%", color: "text-amber-500" },
                ].map((stat, i) => (
                  <Card key={i} className="p-8 bg-black/40 border-white/5 rounded-[2rem] relative overflow-hidden group hover:border-white/10 transition-all">
                     <div className="absolute -bottom-4 -right-4 h-24 w-24 bg-white/5 blur-3xl group-hover:bg-primary/10 transition-all duration-700" />
                     <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3">{stat.label}</p>
                     <div className="flex items-end justify-between">
                        <h4 className={cn("text-4xl font-black tracking-tight", stat.color)}>{stat.val}</h4>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full mb-1">
                           <TrendingUp size={10} /> {stat.trend}
                        </div>
                     </div>
                  </Card>
                ))}
             </div>

             <Card className="p-8 bg-black/40 border-white/5 rounded-[2rem] space-y-6">
                <div className="flex items-center justify-between">
                   <h3 className="text-lg font-black text-white uppercase tracking-widest">Real-time Usage Logs</h3>
                   <Button variant="ghost" size="sm" className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white">Export CSV</Button>
                </div>
                <div className="overflow-hidden rounded-2xl border border-white/5">
                   <table className="w-full text-left border-collapse">
                      <thead className="bg-white/5 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                         <tr>
                            <th className="px-6 py-4">Timestamp</th>
                            <th className="px-6 py-4">Model</th>
                            <th className="px-6 py-4">Tokens</th>
                            <th className="px-6 py-4">Action</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                         {usage.logs?.map((log: any) => (
                            <tr key={log.id} className="text-xs text-gray-400 hover:bg-white/[0.02] transition-colors">
                               <td className="px-6 py-4 font-mono">{format(new Date(log.createdAt), "MMM d, HH:mm:ss")}</td>
                               <td className="px-6 py-4 font-bold text-gray-300">{log.model}</td>
                               <td className="px-6 py-4">
                                  <div className="flex gap-2">
                                     <Badge className="bg-blue-500/10 text-blue-500 border-none text-[9px] font-black">{log.inputTokens} IN</Badge>
                                     <Badge className="bg-purple-500/10 text-purple-500 border-none text-[9px] font-black">{log.outputTokens} OUT</Badge>
                                  </div>
                               </td>
                               <td className="px-6 py-4">
                                  <button className="text-primary hover:underline font-bold">Details</button>
                               </td>
                            </tr>
                         ))}
                         {usage.logs?.length === 0 && (
                            <tr>
                               <td colSpan={4} className="px-6 py-12 text-center text-gray-600 font-bold uppercase tracking-widest text-[10px]">No Neural Activity Recorded</td>
                            </tr>
                         )}
                      </tbody>
                   </table>
                </div>
             </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
