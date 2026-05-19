"use client";

import { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger, 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue, 
  Button,
  Badge,
  Skeleton,
  Progress
} from "@repo/ui";
import { 
  Download, 
  Phone, 
  TrendingUp, 
  MessageSquare, 
  Users, 
  Zap, 
  Activity, 
  Calendar,
  Sparkles,
  Target,
  BarChart2,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  BrainCircuit,
  Filter
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  Legend, 
  AreaChart, 
  Area, 
  PieChart, 
  Pie, 
  Cell 
} from "recharts";
import api from "@/lib/api";
import { format } from "date-fns";
import { cn } from "@repo/ui";

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("30d");
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchAnalytics();
  }, [range]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [overview, ai, contacts, campaigns] = await Promise.all([
        api.get("/analytics/overview", { params: { range } }),
        api.get("/analytics/ai", { params: { range } }),
        api.get("/analytics/contacts", { params: { range } }),
        api.get("/analytics/campaigns", { params: { range } })
      ]);
      setData({
        overview: overview.data.data,
        ai: ai.data.data,
        contacts: contacts.data.data,
        campaigns: campaigns.data.data
      });
    } catch (e) {
      console.error("Neural analytics link failed");
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b'];

  const mockTimeSeries = [
    { name: "Mon", inbound: 400, outbound: 240, ai: 200 },
    { name: "Tue", inbound: 300, outbound: 139, ai: 221 },
    { name: "Wed", inbound: 200, outbound: 980, ai: 229 },
    { name: "Thu", inbound: 278, outbound: 390, ai: 200 },
    { name: "Fri", inbound: 189, outbound: 480, ai: 218 },
    { name: "Sat", inbound: 239, outbound: 380, ai: 250 },
    { name: "Sun", inbound: 349, outbound: 430, ai: 210 },
  ];

  return (
    <div className="p-8 max-w-full space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex items-center justify-between bg-black/40 p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden backdrop-blur-xl">
        <div className="absolute top-0 left-0 h-full w-full bg-[radial-gradient(circle_at_50%_-20%,rgba(var(--primary-rgb),0.15),transparent)] opacity-50" />
        <div className="relative z-10 flex items-center gap-6">
           <div className="h-16 w-16 bg-primary/20 rounded-[1.5rem] border border-primary/20 flex items-center justify-center text-primary shadow-2xl shadow-primary/20">
              <BarChart2 size={32} />
           </div>
           <div>
              <h1 className="text-3xl font-black text-white tracking-tight">Neural Intelligence Dashboard</h1>
              <div className="flex items-center gap-3 mt-1">
                 <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-black px-2 uppercase text-[9px] tracking-widest">Real-time Stream</Badge>
                 <div className="h-1.5 w-1.5 rounded-full bg-gray-800" />
                 <p className="text-xs text-gray-400 font-medium italic">Monitoring subscriber behavior and AI orchestration metrics.</p>
              </div>
           </div>
        </div>
        <div className="relative z-10 flex gap-4">
           <Select value={range} onValueChange={setRange}>
             <SelectTrigger className="w-48 bg-white/5 border-white/10 h-12 rounded-xl text-white font-bold">
               <SelectValue placeholder="Temporal Range" />
             </SelectTrigger>
             <SelectContent className="bg-[#0A0A0A] border-white/10 p-2 rounded-xl">
               <SelectItem value="7d" className="rounded-lg">Last 7 Cycles</SelectItem>
               <SelectItem value="30d" className="rounded-lg">Last 30 Cycles</SelectItem>
               <SelectItem value="90d" className="rounded-lg">Last 90 Cycles</SelectItem>
             </SelectContent>
           </Select>
           <Button variant="outline" className="h-12 px-6 gap-2 border-white/10 hover:bg-white/5 text-gray-300 rounded-xl text-[10px] font-black uppercase tracking-widest">
              <Download size={18} /> Export Protocol
           </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-8">
        <TabsList className="bg-black/40 border border-white/5 p-1.5 rounded-2xl h-14 flex items-center gap-1 w-fit">
          {["Overview", "Messages", "AI Intelligence", "Campaigns", "Subscribers"].map((tab) => (
            <TabsTrigger 
              key={tab} 
              value={tab.toLowerCase().split(' ')[0]} 
              className="px-8 h-11 rounded-xl text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
            >
              {tab}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="space-y-8 animate-in fade-in duration-500">
          {/* Stats Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Total Dispatches", val: data?.overview?.totalMessages.toLocaleString() || "0", trend: "+12.5%", icon: MessageSquare, color: "text-blue-500" },
              { label: "Active Sessions", val: data?.overview?.openConversations || "0", trend: "+3.2%", icon: Activity, color: "text-emerald-500" },
              { label: "Neural Reply Rate", val: `${Math.round(data?.overview?.aiReplyRate || 0)}%`, trend: "+24.1%", icon: BrainCircuit, color: "text-purple-500" },
              { label: "Mean TTR", val: "4.2m", trend: "-1.5%", icon: Clock, color: "text-amber-500" },
            ].map((s, i) => (
              <Card key={i} className="p-8 bg-black/40 border-white/5 rounded-[2.5rem] relative overflow-hidden group hover:border-white/10 transition-all shadow-2xl">
                 <div className="absolute top-0 right-0 h-full w-1/3 bg-gradient-to-l from-white/5 to-transparent blur-3xl opacity-20 group-hover:opacity-40 transition-opacity" />
                 <div className="flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                       <div className={cn("h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 shadow-inner transition-all group-hover:scale-110", s.color)}>
                          <s.icon size={24} />
                       </div>
                       <Badge className="bg-emerald-500/10 text-emerald-500 border-none text-[10px] font-black px-2">{s.trend}</Badge>
                    </div>
                    <div>
                       <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">{s.label}</p>
                       <h4 className="text-4xl font-black text-white tracking-tighter">{loading ? "---" : s.val}</h4>
                    </div>
                 </div>
              </Card>
            ))}
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-7">
            {/* Main Chart */}
            <Card className="lg:col-span-4 bg-black/40 border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
              <CardHeader className="p-8 pb-0">
                <div className="flex items-center justify-between">
                   <div>
                      <CardTitle className="text-xl font-black text-white uppercase tracking-tight">Transmission Flow</CardTitle>
                      <CardDescription className="text-gray-500 font-medium italic">Message volume across all channels.</CardDescription>
                   </div>
                   <div className="flex gap-4">
                      <div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-blue-500" /> <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Inbound</span></div>
                      <div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-emerald-500" /> <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Outbound</span></div>
                      <div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-purple-500" /> <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Neural</span></div>
                   </div>
                </div>
              </CardHeader>
              <CardContent className="h-[400px] p-8">
                {loading ? <Skeleton className="w-full h-full bg-white/5 rounded-[2rem]" /> : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={mockTimeSeries}>
                      <defs>
                        <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                      <XAxis dataKey="name" stroke="#ffffff20" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} />
                      <YAxis stroke="#ffffff20" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} />
                      <Tooltip 
                         contentStyle={{ backgroundColor: '#0A0A0A', border: '1px solid #ffffff10', borderRadius: '16px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}
                         itemStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                      />
                      <Area type="monotone" dataKey="inbound" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorIn)" />
                      <Area type="monotone" dataKey="outbound" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorOut)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* AI Insight Card */}
            <Card className="lg:col-span-3 bg-black/40 border-white/5 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 h-full w-full bg-[radial-gradient(circle_at_100%_0%,rgba(var(--primary-rgb),0.1),transparent)]" />
              <div className="space-y-2 relative z-10">
                 <h3 className="text-xl font-black text-white uppercase tracking-tight">Neural Distribution</h3>
                 <p className="text-gray-500 text-xs font-medium italic">Distribution of dispatches by model provider.</p>
              </div>
              <div className="h-[240px] relative z-10">
                 {loading ? <Skeleton className="w-full h-full bg-white/5 rounded-full mx-auto" style={{ width: '200px', height: '200px' }} /> : (
                   <ResponsiveContainer width="100%" height="100%">
                     <PieChart>
                       <Pie 
                         data={data?.ai?.byModel || []} 
                         cx="50%" 
                         cy="50%" 
                         innerRadius={60} 
                         outerRadius={80} 
                         paddingAngle={8} 
                         dataKey="value"
                         stroke="none"
                       >
                         {data?.ai?.byModel.map((entry: any, index: number) => (
                           <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                         ))}
                       </Pie>
                       <Tooltip />
                     </PieChart>
                   </ResponsiveContainer>
                 )}
              </div>
              <div className="grid grid-cols-2 gap-4 relative z-10">
                 {data?.ai?.byModel.map((m: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/5">
                       <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                       <div className="flex-1">
                          <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">{m.name}</p>
                          <p className="text-sm font-black text-white">{m.value}%</p>
                       </div>
                    </div>
                 ))}
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="messages" className="animate-in fade-in duration-500">
           <Card className="bg-black/40 border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
              <CardHeader className="p-10">
                 <CardTitle className="text-2xl font-black text-white uppercase tracking-tight">Transmission Volumetrics</CardTitle>
                 <CardDescription className="text-gray-500 font-medium italic">Hourly dispatch density across all source nodes.</CardDescription>
              </CardHeader>
              <CardContent className="h-[500px] p-10">
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={mockTimeSeries}>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                       <XAxis dataKey="name" stroke="#ffffff20" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} />
                       <YAxis stroke="#ffffff20" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} />
                       <Tooltip />
                       <Bar dataKey="inbound" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                       <Bar dataKey="outbound" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                       <Bar dataKey="ai" stackId="a" fill="#8b5cf6" radius={[10, 10, 0, 0]} />
                    </BarChart>
                 </ResponsiveContainer>
              </CardContent>
           </Card>
        </TabsContent>

        <TabsContent value="ai" className="space-y-8 animate-in fade-in duration-500">
           <div className="grid grid-cols-3 gap-8">
              {[
                { label: "Neural Tokens Processed", val: "14.2M", sub: "$42.50 Est. Cost", icon: Zap, color: "text-primary" },
                { label: "Containment Rate", val: "78.2%", sub: "Automated Res. Ratio", icon: Target, color: "text-emerald-500" },
                { label: "Neural Latency", val: "1.4s", sub: "Mean Response Window", icon: Clock, color: "text-amber-500" },
              ].map((s, i) => (
                <Card key={i} className="p-8 bg-black/40 border-white/5 rounded-[2.5rem] relative shadow-2xl group overflow-hidden">
                   <div className="absolute top-0 right-0 h-full w-1/3 bg-gradient-to-l from-white/5 to-transparent blur-3xl opacity-20" />
                   <div className="flex items-center gap-6 relative z-10">
                      <div className={cn("h-14 w-14 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 shadow-inner", s.color)}>
                         <s.icon size={28} />
                      </div>
                      <div>
                         <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">{s.label}</p>
                         <h4 className="text-3xl font-black text-white tracking-tighter">{s.val}</h4>
                         <p className="text-[9px] font-black text-primary uppercase tracking-widest mt-1">{s.sub}</p>
                      </div>
                   </div>
                </Card>
              ))}
           </div>
           
           <Card className="bg-black/40 border-white/5 rounded-[3rem] p-12 shadow-2xl flex flex-col items-center justify-center text-center space-y-8 min-h-[400px]">
              <div className="h-32 w-32 bg-primary/10 rounded-[3rem] border border-primary/20 flex items-center justify-center text-primary shadow-[0_0_50px_rgba(var(--primary-rgb),0.2)]">
                 <BrainCircuit size={64} />
              </div>
              <div className="space-y-2">
                 <h3 className="text-3xl font-black text-white uppercase tracking-tighter">Neural Context Engine</h3>
                 <p className="text-gray-500 max-w-lg font-medium italic leading-relaxed">Deep behavioral analytics and semantic search indexing logs are being synthesized. Advanced AI reporting will be available in the next platform cycle.</p>
              </div>
              <Button className="h-14 px-10 rounded-2xl bg-primary hover:bg-primary-hover shadow-2xl shadow-primary/20 text-[10px] font-black uppercase tracking-widest">Initialize Advanced Indexing</Button>
           </Card>
        </TabsContent>

        <TabsContent value="campaigns" className="animate-in fade-in duration-500">
           <Card className="bg-black/40 border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
              <div className="p-10 border-b border-white/5 flex items-center justify-between">
                 <div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tight">Campaign Efficiency</h3>
                    <p className="text-gray-500 font-medium italic">High-impact broadcast performance metrics.</p>
                 </div>
                 <Button variant="outline" className="h-12 px-6 border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest">Protocol View</Button>
              </div>
              <div className="p-10 space-y-6">
                 {data?.campaigns?.map((c: any, i: number) => (
                    <div key={i} className="p-8 bg-white/[0.03] border border-white/5 rounded-[2rem] flex items-center justify-between group hover:bg-white/[0.05] transition-all">
                       <div className="flex items-center gap-6">
                          <div className="h-14 w-14 bg-black rounded-2xl border border-white/10 flex items-center justify-center text-primary shadow-xl group-hover:rotate-6 transition-transform">
                             <Target size={28} />
                          </div>
                          <div>
                             <h4 className="text-lg font-black text-white tracking-tight">{c.name}</h4>
                             <div className="flex items-center gap-3 mt-1">
                                <Badge className="bg-emerald-500/10 text-emerald-500 border-none text-[8px] font-black uppercase px-2">{c.status}</Badge>
                                <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">{c.sent.toLocaleString()} DISPATCHES</span>
                             </div>
                          </div>
                       </div>
                       
                       <div className="flex gap-12 items-center">
                          <div className="text-center">
                             <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Efficiency</p>
                             <p className="text-xl font-black text-white font-mono">{Math.round(c.conversion)}%</p>
                          </div>
                          <div className="w-48 h-2 bg-white/5 rounded-full overflow-hidden border border-white/5 shadow-inner">
                             <div className="h-full bg-gradient-to-r from-primary to-blue-500 rounded-full" style={{ width: `${c.conversion}%` }} />
                          </div>
                          <Button variant="ghost" size="icon" className="h-12 w-12 text-gray-500 hover:text-white rounded-xl">
                             <ArrowUpRight size={24} />
                          </Button>
                       </div>
                    </div>
                 ))}
                 {(!data?.campaigns || data.campaigns.length === 0) && (
                    <div className="h-96 flex flex-col items-center justify-center opacity-20">
                       <Target size={64} className="mb-4" />
                       <p className="text-[10px] font-black uppercase tracking-[0.3em]">No Active Campaign Data</p>
                    </div>
                 )}
              </div>
           </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
