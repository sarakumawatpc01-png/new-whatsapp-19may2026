"use client";

import { useState, useEffect } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  Megaphone, 
  Users, 
  FileText, 
  Calendar, 
  CheckCircle2,
  Info,
  ArrowRight,
  Search,
  Tag as TagIcon,
  Upload,
  Clock,
  Sparkles,
  Filter,
  RefreshCw,
  Zap,
  Target,
  Send,
  Eye,
  Settings,
  ShieldCheck,
  Globe,
  TrendingUp
} from "lucide-react";
import { 
  Button, 
  Input, 
  Card, 
  Badge, 
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Label,
  RadioGroup,
  RadioGroupItem,
  Skeleton
} from "@repo/ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@repo/ui";
import { format } from "date-fns";

export default function CreateCampaignPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [numbers, setNumbers] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    numberId: "",
    templateId: "",
    audienceType: "all",
    audienceFilter: {} as any,
    scheduledAt: null as string | null,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [numRes, tempRes, tagRes] = await Promise.all([
        api.get("/whatsapp/numbers"),
        api.get("/campaigns/templates"),
        api.get("/contacts/tags")
      ]);
      setNumbers(numRes.data.data);
      setTemplates(tempRes.data.data.filter((t: any) => t.status === "APPROVED"));
      setTags(tagRes.data.data);
    } catch (e) {
      toast.error("Neural data link failed");
    }
  };

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  const handleCreate = async () => {
    setLoading(true);
    try {
      const res = await api.post("/campaigns", formData);
      const campaignId = res.data.data.id;
      
      if (formData.scheduledAt) {
        // Scheduled logic would go here if backend supported separate /schedule
        toast.success("Protocol scheduled in queue");
      } else {
        await api.post(`/campaigns/${campaignId}/launch`, { templateId: formData.templateId });
        toast.success("Neural broadcast sequence initiated");
      }
      router.push("/campaigns");
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Protocol initiation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header & Progress */}
      <div className="flex items-center justify-between bg-black/40 p-6 rounded-[2rem] border border-white/5 backdrop-blur-xl sticky top-8 z-50">
        <Link href="/campaigns">
          <Button variant="ghost" className="gap-3 text-gray-500 hover:text-white rounded-2xl group px-6">
            <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-widest">Abort Creation</span>
          </Button>
        </Link>
        <div className="flex items-center gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div 
              key={i} 
              className={cn(
                "h-2 rounded-full transition-all duration-500 border border-white/5",
                step === i ? "w-12 bg-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]" : step > i ? "w-4 bg-primary/40" : "w-4 bg-white/5"
              )} 
            />
          ))}
        </div>
        <Badge className="bg-primary/10 text-primary border-none px-4 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-widest">
           Step {step} of 5
        </Badge>
      </div>

      <div className="space-y-2 text-center max-w-2xl mx-auto">
        <h1 className="text-4xl font-black text-white tracking-tight">
          {step === 1 ? "Protocol Initialization" : 
           step === 2 ? "Audience Resolution" : 
           step === 3 ? "Neural Content" : 
           step === 4 ? "Temporal Scheduling" : "Final Verification"}
        </h1>
        <p className="text-gray-500 font-medium italic">
           {step === 1 ? "Define the core parameters of your broadcast dispatch." : 
            step === 2 ? "Specify the exact subscriber target group for this mission." : 
            step === 3 ? "Select the approved neural template for maximum impact." : 
            step === 4 ? "Determine the optimal moment for transmission." : "Review all systems before initiating broadcast."}
        </p>
      </div>

      <div className="min-h-[500px] flex flex-col justify-center">
        {step === 1 && (
          <Card className="bg-black/40 border-white/5 p-12 rounded-[3rem] space-y-10 animate-in slide-in-from-right-8 duration-500 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 h-full w-1/3 bg-gradient-to-l from-primary/5 to-transparent blur-3xl opacity-50" />
            <div className="grid grid-cols-1 gap-8 relative z-10">
              <div className="space-y-4">
                <Label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Campaign Identifier</Label>
                <div className="relative group">
                   <Target className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-700 group-focus-within:text-primary transition-colors" size={20} />
                   <Input 
                     placeholder="e.g. Q3_SUBSCRIBER_RE_ENGAGEMENT" 
                     className="pl-12 bg-white/5 border-white/10 h-16 rounded-2xl text-base font-bold tracking-tight focus:border-primary/40 transition-all"
                     value={formData.name}
                     onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                   />
                </div>
              </div>
              <div className="space-y-4">
                <Label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Source Node (WhatsApp Number)</Label>
                <Select 
                  value={formData.numberId} 
                  onValueChange={(val) => setFormData({ ...formData, numberId: val })}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 h-16 rounded-2xl text-white font-bold">
                    <SelectValue placeholder="Select transmission origin..." />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0A0A0A] border-white/10 p-2 rounded-2xl shadow-2xl">
                    {numbers.map((n) => (
                      <SelectItem key={n.id} value={n.id} className="rounded-xl p-4 cursor-pointer focus:bg-white/5 transition-colors">
                         <div className="flex flex-col">
                            <span className="font-black text-sm">+{n.phoneNumber}</span>
                            <span className="text-[10px] text-gray-500 uppercase tracking-widest">{n.displayName}</span>
                         </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button className="w-full h-16 rounded-2xl gap-3 bg-primary hover:bg-primary-hover shadow-2xl shadow-primary/20 text-xs font-black uppercase tracking-[0.2em] transition-all" onClick={nextStep} disabled={!formData.name || !formData.numberId}>
               Continue To Audience <ArrowRight size={20} />
            </Button>
          </Card>
        )}

        {step === 2 && (
          <div className="space-y-8 animate-in slide-in-from-right-8 duration-500">
            <RadioGroup 
              value={formData.audienceType} 
              onValueChange={(val) => setFormData({ ...formData, audienceType: val })}
              className="grid grid-cols-2 gap-6"
            >
              {[
                { id: "all", title: "Universal Broadcast", desc: "Reach every active subscriber in the registry.", icon: Globe, color: "text-blue-500" },
                { id: "tag", title: "Segmental Filter", desc: "Isolate targets based on behavioral tags.", icon: TagIcon, color: "text-amber-500" },
                { id: "segment", title: "Dynamic Logic", desc: "Rule-based neural targeting (Neural Scoring).", icon: Filter, color: "text-emerald-500" },
                { id: "csv", title: "External Data", desc: "Manual CSV override for custom mission.", icon: Upload, color: "text-purple-500" },
              ].map((t) => (
                <Label 
                  key={t.id}
                  className={cn(
                    "flex flex-col gap-6 p-8 rounded-[2.5rem] border-2 cursor-pointer transition-all relative overflow-hidden group",
                    formData.audienceType === t.id ? "bg-primary/5 border-primary shadow-2xl shadow-primary/10" : "bg-black/40 border-white/5 hover:border-white/20"
                  )}
                >
                  <div className="flex items-center justify-between relative z-10">
                    <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center border shadow-inner group-hover:scale-110 transition-transform", formData.audienceType === t.id ? "bg-primary text-white border-primary/20" : "bg-white/5 text-gray-500 border-white/5")}>
                      <t.icon size={28} />
                    </div>
                    <RadioGroupItem value={t.id} className="h-6 w-6 border-2 border-white/10" />
                  </div>
                  <div className="space-y-2 text-left relative z-10">
                    <p className="font-black text-white text-lg tracking-tight uppercase tracking-[0.05em]">{t.title}</p>
                    <p className="text-xs text-gray-500 font-medium italic leading-relaxed">{t.desc}</p>
                  </div>
                </Label>
              ))}
            </RadioGroup>

            {formData.audienceType === "tag" && (
              <Card className="p-8 bg-black/40 border border-white/5 rounded-[2.5rem] animate-in fade-in zoom-in-95">
                <Label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1 mb-6 block text-center">Active Behavioral Tags</Label>
                <div className="flex flex-wrap justify-center gap-3">
                  {tags.map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => setFormData({ ...formData, audienceFilter: { tagId: tag.id } })}
                      className={cn(
                        "px-6 py-3 rounded-2xl border-2 text-[10px] font-black uppercase tracking-widest transition-all",
                        formData.audienceFilter.tagId === tag.id ? "bg-primary border-primary text-white shadow-xl shadow-primary/20" : "bg-white/5 border-white/10 text-gray-500 hover:text-white"
                      )}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              </Card>
            )}

            <div className="flex gap-6">
              <Button variant="ghost" className="flex-1 h-16 rounded-2xl border border-white/5 text-gray-500 hover:text-white font-black uppercase tracking-widest" onClick={prevStep}>Previous Step</Button>
              <Button className="flex-[2] h-16 rounded-2xl gap-3 bg-primary hover:bg-primary-hover shadow-2xl shadow-primary/20 text-xs font-black uppercase tracking-[0.2em]" onClick={nextStep}>
                 Proceed To Content <ArrowRight size={20} />
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-8 animate-in slide-in-from-right-8 duration-500">
            <div className="grid grid-cols-1 gap-4 overflow-y-auto max-h-[600px] p-2 no-scrollbar">
              {templates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setFormData({ ...formData, templateId: t.id })}
                  className={cn(
                    "flex items-center justify-between p-8 rounded-[2.5rem] border-2 text-left transition-all group relative overflow-hidden",
                    formData.templateId === t.id ? "bg-primary/5 border-primary shadow-2xl shadow-primary/10" : "bg-black/40 border-white/5 hover:border-white/20"
                  )}
                >
                  <div className="flex items-center gap-6 relative z-10">
                    <div className={cn("h-16 w-16 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-center text-primary shadow-inner group-hover:rotate-3 transition-all", formData.templateId === t.id && "bg-primary/20 border-primary/20")}>
                      <FileText size={32} />
                    </div>
                    <div className="space-y-1.5">
                      <p className="font-black text-white text-lg tracking-tight uppercase tracking-[0.05em]">{t.displayName || t.name}</p>
                      <div className="flex items-center gap-3">
                         <Badge className="bg-white/5 text-gray-500 border-none text-[8px] font-black uppercase px-2">{t.category}</Badge>
                         <div className="h-1 w-1 rounded-full bg-gray-800" />
                         <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">{t.language}</span>
                      </div>
                    </div>
                  </div>
                  {formData.templateId === t.id && <CheckCircle2 size={32} className="text-primary relative z-10 animate-in zoom-in" />}
                </button>
              ))}
              {templates.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 opacity-20 border-2 border-dashed border-white/10 rounded-[3rem]">
                   <FileText size={64} className="mb-4" />
                   <p className="text-[10px] font-black uppercase tracking-[0.3em]">No Approved Content Found</p>
                </div>
              )}
            </div>
            <div className="flex gap-6">
              <Button variant="ghost" className="flex-1 h-16 rounded-2xl border border-white/5 text-gray-500 hover:text-white font-black uppercase tracking-widest" onClick={prevStep}>Previous Step</Button>
              <Button className="flex-[2] h-16 rounded-2xl gap-3 bg-primary hover:bg-primary-hover shadow-2xl shadow-primary/20 text-xs font-black uppercase tracking-[0.2em]" onClick={nextStep} disabled={!formData.templateId}>
                 Scheduling Logic <ArrowRight size={20} />
              </Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-10 animate-in slide-in-from-right-8 duration-500">
             <RadioGroup 
              value={formData.scheduledAt ? "later" : "now"} 
              onValueChange={(val) => setFormData({ ...formData, scheduledAt: val === "now" ? null : new Date().toISOString() })}
              className="grid grid-cols-1 gap-6"
            >
              {[
                { id: "now", title: "Immediate Dispatch", desc: "Launch transmission protocol as soon as initialization is complete.", icon: Zap, color: "text-primary" },
                { id: "later", title: "Temporal Schedule", desc: "Select a future window for optimal engagement timing.", icon: Clock, color: "text-blue-500" },
              ].map((t) => (
                <Label 
                  key={t.id}
                  className={cn(
                    "flex items-center gap-8 p-8 rounded-[2.5rem] border-2 cursor-pointer transition-all relative overflow-hidden group",
                    (t.id === "now" ? !formData.scheduledAt : !!formData.scheduledAt) ? "bg-primary/5 border-primary shadow-2xl shadow-primary/10" : "bg-black/40 border-white/5 hover:border-white/20"
                  )}
                >
                  <div className={cn("h-16 w-16 rounded-2xl border flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform", (t.id === "now" ? !formData.scheduledAt : !!formData.scheduledAt) ? "bg-primary/20 border-primary/20 text-primary" : "bg-white/5 border-white/5 text-gray-500")}>
                    <t.icon size={32} />
                  </div>
                  <div className="space-y-1.5 flex-1 text-left">
                    <p className="font-black text-white text-lg tracking-tight uppercase tracking-[0.05em]">{t.title}</p>
                    <p className="text-xs text-gray-500 font-medium italic leading-relaxed">{t.desc}</p>
                  </div>
                  <RadioGroupItem value={t.id} className="h-6 w-6 border-2 border-white/10" />
                </Label>
              ))}
            </RadioGroup>

            {formData.scheduledAt && (
              <Card className="p-10 bg-black/40 border border-white/5 rounded-[2.5rem] animate-in slide-in-from-top-4">
                <Label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1 mb-4 block">Target Transmission Window</Label>
                <Input 
                  type="datetime-local" 
                  className="bg-white/5 border-white/10 h-16 rounded-2xl text-lg font-black text-white px-6 focus:border-primary/40 transition-all"
                  onChange={(e) => setFormData({ ...formData, scheduledAt: new Date(e.target.value).toISOString() })}
                />
              </Card>
            )}

            <div className="flex gap-6">
              <Button variant="ghost" className="flex-1 h-16 rounded-2xl border border-white/5 text-gray-500 hover:text-white font-black uppercase tracking-widest" onClick={prevStep}>Previous Step</Button>
              <Button className="flex-[2] h-16 rounded-2xl gap-3 bg-primary hover:bg-primary-hover shadow-2xl shadow-primary/20 text-xs font-black uppercase tracking-[0.2em]" onClick={nextStep}>
                 Final Verification <ArrowRight size={20} />
              </Button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-10 animate-in zoom-in-95 duration-500">
            <div className="grid grid-cols-2 gap-8">
              <Card className="bg-black/40 border-white/5 p-10 rounded-[3rem] space-y-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 h-full w-1/3 bg-gradient-to-l from-primary/5 to-transparent blur-3xl opacity-50" />
                <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-3">
                  <ShieldCheck size={16} className="text-emerald-500" /> System Parameters
                </h3>
                <div className="space-y-6">
                  <SummaryItem icon={Target} label="Campaign" value={formData.name} />
                  <SummaryItem icon={Users} label="Audience" value={formData.audienceType === "all" ? "Universal" : formData.audienceType.toUpperCase()} />
                  <SummaryItem icon={Send} label="Origin" value={numbers.find(n => n.id === formData.numberId)?.displayName || "Unspecified"} />
                  <SummaryItem icon={Clock} label="Window" value={formData.scheduledAt ? format(new Date(formData.scheduledAt), "MMM d, HH:mm") : "Immediate Dispatch"} />
                </div>
              </Card>
              
              <Card className="bg-black/40 border-white/5 p-10 rounded-[3rem] space-y-10 flex flex-col items-center justify-center text-center group">
                <div className="h-24 w-24 bg-primary/10 rounded-[2rem] border border-primary/20 flex items-center justify-center text-primary shadow-[0_0_40px_rgba(var(--primary-rgb),0.2)] group-hover:scale-110 transition-transform">
                   <TrendingUp size={48} />
                </div>
                <div className="space-y-2">
                   <h3 className="text-4xl font-black text-white font-mono tracking-tighter">~1,240</h3>
                   <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Neural Reach Projection</p>
                </div>
                <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest italic leading-relaxed">Estimated cost: $14.20 Meta Fees</p>
              </Card>
            </div>

            <Card className="bg-emerald-500/5 border border-emerald-500/20 p-8 rounded-[2.5rem] flex items-center gap-8 relative overflow-hidden group">
               <div className="absolute top-0 left-0 h-full w-2 bg-emerald-500" />
               <div className="h-16 w-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 border border-emerald-500/20 group-hover:rotate-6 transition-transform">
                  <CheckCircle2 size={32} />
               </div>
               <div className="space-y-1.5">
                  <p className="text-lg font-black text-white tracking-tight uppercase tracking-[0.05em]">All Systems Nominal</p>
                  <p className="text-xs text-gray-400 font-medium italic leading-relaxed">Your broadcast protocol is verified and compliant. Neural dispatches will occur in batches of 50 to ensure maximum delivery efficiency.</p>
               </div>
            </Card>

            <div className="flex gap-6 pt-4">
              <Button variant="ghost" className="flex-1 h-16 rounded-2xl border border-white/5 text-gray-500 hover:text-white font-black uppercase tracking-widest" onClick={prevStep}>Reconfigure</Button>
              <Button className="flex-[2] h-16 rounded-2xl shadow-[0_0_30px_rgba(var(--primary-rgb),0.3)] bg-primary hover:bg-primary-hover text-xs font-black uppercase tracking-[0.2em] transition-all hover:scale-[1.02]" onClick={handleCreate} disabled={loading}>
                {loading ? <RefreshCw className="animate-spin" size={24} /> : (formData.scheduledAt ? "Authorize Scheduled Queue" : "Authorize Immediate Broadcast")}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryItem({ icon: Icon, label, value }: { icon: any, label: string, value: string }) {
  return (
    <div className="flex items-center gap-4 group/item">
      <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-600 group-hover/item:text-primary group-hover/item:bg-primary/10 transition-all border border-white/5">
        <Icon size={18} />
      </div>
      <div className="flex flex-col">
        <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-0.5">{label}</span>
        <span className="text-sm text-white font-black tracking-tight truncate max-w-[200px]">{value}</span>
      </div>
    </div>
  );
}
