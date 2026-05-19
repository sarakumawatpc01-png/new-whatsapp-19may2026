"use client";

import { useState, useEffect } from "react";
import { 
  Megaphone, 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal,
  Play,
  Pause,
  XCircle,
  BarChart2,
  Calendar,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  Trash2,
  Zap,
  TrendingUp,
  Target,
  Send,
  Eye,
  ArrowRight
} from "lucide-react";
import { 
  Button, 
  Input, 
  Card, 
  Badge, 
  Skeleton,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from "@repo/ui";
import Link from "next/link";
import api from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@repo/ui";
import { format } from "date-fns";

export default function CampaignsPage() {
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [stats, setStats] = useState<any>({
     total: 0,
     sent: 0,
     delivered: 0,
     read: 0
  });

  useEffect(() => {
    fetchCampaigns();
    const interval = setInterval(fetchCampaigns, 10000); // Polling every 10s
    return () => clearInterval(interval);
  }, []);

  const fetchCampaigns = async () => {
    try {
      const res = await api.get("/campaigns");
      setCampaigns(res.data.data);
      
      // Calculate basic stats
      const campaignList = res.data.data;
      setStats({
         total: campaignList.length,
         sent: campaignList.reduce((acc: any, c: any) => acc + (c.sentCount || 0), 0),
         delivered: campaignList.reduce((acc: any, c: any) => acc + (c.deliveredCount || 0), 0),
         read: campaignList.reduce((acc: any, c: any) => acc + (c.readCount || 0), 0)
      });
    } catch (e) {
      toast.error("Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  };

  const handleLaunch = async (id: string) => {
    try {
      await api.post(`/campaigns/${id}/launch`);
      toast.success("Campaign sequence initiated");
      fetchCampaigns();
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Launch failed");
    }
  };

  return (
    <div className="p-8 max-w-full space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Analytics Summary */}
      <div className="grid grid-cols-4 gap-8">
         {[
           { label: "Active Campaigns", val: campaigns.filter(c => c.status === "RUNNING").length, icon: Target, color: "text-primary" },
           { label: "Neural Dispatches", val: stats.sent.toLocaleString(), icon: Send, color: "text-blue-500" },
           { label: "Delivery Efficiency", val: "98.2%", icon: Zap, color: "text-emerald-500" },
           { label: "Mean Read Rate", val: "42%", icon: Eye, color: "text-amber-500" },
         ].map((s, i) => (
           <Card key={i} className="p-8 bg-black/40 border-white/5 rounded-[2.5rem] relative overflow-hidden group hover:border-white/10 transition-all">
              <div className="absolute top-0 right-0 h-full w-1/3 bg-gradient-to-l from-white/5 to-transparent blur-3xl opacity-20 group-hover:opacity-40 transition-opacity" />
              <div className="flex items-center gap-6">
                 <div className={cn("h-14 w-14 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 shadow-inner transition-all group-hover:scale-110", s.color)}>
                    <s.icon size={28} />
                 </div>
                 <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">{s.label}</p>
                    <h4 className="text-3xl font-black text-white tracking-tighter">{s.val}</h4>
                 </div>
              </div>
           </Card>
         ))}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between bg-black/40 p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden">
        <div className="absolute top-0 left-0 h-full w-full bg-[radial-gradient(circle_at_50%_-20%,rgba(var(--primary-rgb),0.15),transparent)] opacity-50" />
        <div className="relative z-10 flex items-center gap-6">
           <div className="h-16 w-16 bg-primary/20 rounded-[1.5rem] border border-primary/20 flex items-center justify-center text-primary shadow-2xl shadow-primary/20">
              <Megaphone size={32} />
           </div>
           <div>
              <h1 className="text-3xl font-black text-white tracking-tight">Campaign Orchestrator</h1>
              <div className="flex items-center gap-3 mt-1">
                 <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-black px-2 uppercase text-[9px] tracking-widest">Live Engine</Badge>
                 <div className="h-1.5 w-1.5 rounded-full bg-gray-800" />
                 <p className="text-xs text-gray-400 font-medium italic">Execute high-impact broadcasts with dynamic audience resolution.</p>
              </div>
           </div>
        </div>
        <div className="relative z-10">
           <Link href="/campaigns/create">
              <Button className="h-14 px-10 gap-3 rounded-[1.25rem] shadow-2xl bg-primary hover:bg-primary-hover shadow-primary/20 text-xs font-black uppercase tracking-widest">
                <Plus size={22} /> New Broadcast
              </Button>
           </Link>
        </div>
      </div>

      {/* Main Table */}
      <Card className="bg-black/40 border-white/5 overflow-hidden rounded-[2.5rem] shadow-2xl">
        <div className="p-8 border-b border-white/5 flex items-center justify-between">
           <div className="relative max-w-md w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
              <Input 
                placeholder="Search neural broadcasts..." 
                className="pl-12 bg-white/5 border-white/10 h-14 rounded-2xl text-sm focus:border-primary/40 transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
           </div>
           <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="h-12 w-12 rounded-xl text-gray-500 hover:text-white" onClick={fetchCampaigns}>
                 <RefreshCw size={20} />
              </Button>
              <Button variant="outline" className="h-12 px-6 gap-2 border-white/10 hover:bg-white/5 text-gray-300 rounded-xl text-xs font-black uppercase tracking-widest">
                 <Filter size={18} /> Filters
              </Button>
           </div>
        </div>

        {loading ? (
          <div className="p-10 space-y-6">
            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-20 w-full bg-white/5 rounded-[1.5rem]" />)}
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-white/[0.03] h-16">
              <TableRow className="hover:bg-transparent border-white/5">
                <TableHead className="text-gray-500 font-black uppercase tracking-[0.2em] text-[10px] pl-8">Campaign Protocol</TableHead>
                <TableHead className="text-gray-500 font-black uppercase tracking-[0.2em] text-[10px]">Current Status</TableHead>
                <TableHead className="text-gray-500 font-black uppercase tracking-[0.2em] text-[10px]">Audience Logic</TableHead>
                <TableHead className="text-gray-500 font-black uppercase tracking-[0.2em] text-[10px]">Dispatch Efficiency</TableHead>
                <TableHead className="text-gray-500 font-black uppercase tracking-[0.2em] text-[10px]">Temporal Logs</TableHead>
                <TableHead className="w-20 pr-8"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((campaign) => (
                <TableRow key={campaign.id} className="hover:bg-white/[0.03] border-white/5 group transition-all duration-300 h-24">
                  <TableCell className="pl-8">
                    <div className="flex items-center gap-5">
                      <div className="h-14 w-14 bg-gradient-to-br from-white/[0.05] to-white/[0.08] rounded-2xl border border-white/5 flex items-center justify-center text-gray-400 group-hover:scale-110 group-hover:text-primary transition-all duration-500 shadow-inner">
                        <Target size={24} />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-black text-white text-base tracking-tight">{campaign.name}</span>
                        <div className="flex items-center gap-2 mt-1">
                           <Badge className="bg-primary/10 text-primary border-none text-[8px] font-black uppercase px-2">{campaign.type}</Badge>
                           <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">v1.2.0</span>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                     <StatusBadge status={campaign.status} />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-xs text-white font-black uppercase tracking-tight">
                        <Users size={14} className="text-primary" />
                        {campaign.totalRecipients || 0} Contacts
                      </div>
                      <div className="flex items-center gap-2">
                         <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                         <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Filter: {campaign.audienceType}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-3 w-56">
                      <div className="flex justify-between items-end mb-1">
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Efficiency</span>
                        <span className="text-xs font-black text-white font-mono">{campaign.totalRecipients > 0 ? Math.round((campaign.sentCount / campaign.totalRecipients) * 100) : 0}%</span>
                      </div>
                      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 shadow-inner">
                        <div 
                          className="h-full bg-gradient-to-r from-primary to-blue-500 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(var(--primary-rgb),0.3)]" 
                          style={{ width: `${campaign.totalRecipients > 0 ? (campaign.sentCount / campaign.totalRecipients) * 100 : 0}%` }}
                        />
                      </div>
                      <div className="flex gap-4">
                        <Badge className="bg-emerald-500/5 text-emerald-500 border-none text-[8px] font-black uppercase tracking-widest px-1.5">Del: {campaign.deliveredCount || 0}</Badge>
                        <Badge className="bg-amber-500/5 text-amber-500 border-none text-[8px] font-black uppercase tracking-widest px-1.5">Read: {campaign.readCount || 0}</Badge>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-500 text-[10px] font-bold space-y-2 uppercase tracking-widest">
                    <div className="flex items-center gap-2"><Clock size={12} className="text-primary" /> Created {format(new Date(campaign.createdAt), "MMM d")}</div>
                    {campaign.startedAt && (
                      <div className="flex items-center gap-2 text-emerald-500"><Play size={12} fill="currentColor" /> {format(new Date(campaign.startedAt), "HH:mm")}</div>
                    )}
                  </TableCell>
                  <TableCell className="pr-8">
                    <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl text-gray-500 hover:text-white hover:bg-white/5">
                            <MoreHorizontal size={24} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="glass border-white/10 w-64 p-2 rounded-2xl shadow-2xl">
                          <DropdownMenuItem asChild className="rounded-xl p-4 cursor-pointer">
                            <Link href={`/campaigns/${campaign.id}`} className="gap-4 font-black uppercase text-[10px] tracking-widest">
                              <BarChart2 size={18} className="text-primary" /> Analytics Data
                            </Link>
                          </DropdownMenuItem>
                          {campaign.status === "DRAFT" && (
                            <>
                              <DropdownMenuItem className="rounded-xl p-4 cursor-pointer gap-4 font-black uppercase text-[10px] tracking-widest text-emerald-500 hover:bg-emerald-500/10" onClick={() => handleLaunch(campaign.id)}>
                                <Play size={18} fill="currentColor" /> Execute Protocol
                              </DropdownMenuItem>
                              <div className="h-px bg-white/5 my-2" />
                              <DropdownMenuItem className="rounded-xl p-4 cursor-pointer gap-4 font-black uppercase text-[10px] tracking-widest text-rose-500 hover:bg-rose-500/10">
                                <Trash2 size={18} /> Wipe Protocol
                              </DropdownMenuItem>
                            </>
                          )}
                          {campaign.status === "RUNNING" && (
                            <DropdownMenuItem className="rounded-xl p-4 cursor-pointer gap-4 font-black uppercase text-[10px] tracking-widest text-amber-500 hover:bg-amber-500/10">
                              <Pause size={18} fill="currentColor" /> Pause Transmission
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl text-gray-500 hover:text-white hover:bg-white/5 ml-2">
                         <ArrowRight size={24} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {campaigns.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-96 text-center">
                    <div className="flex flex-col items-center justify-center space-y-6 opacity-30">
                      <div className="h-24 w-24 bg-white/5 rounded-[2rem] flex items-center justify-center text-gray-600 border border-white/5 shadow-inner">
                        <Megaphone size={48} />
                      </div>
                      <div className="space-y-2">
                        <p className="text-white font-black text-xl tracking-widest uppercase">No Protocols Found</p>
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Initialize your first neural broadcast sequence.</p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
   const variants: any = {
      RUNNING: "bg-primary/10 text-primary border-primary/20 animate-pulse",
      COMPLETED: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
      DRAFT: "bg-gray-500/10 text-gray-500 border-gray-500/20",
      PAUSED: "bg-amber-500/10 text-amber-500 border-amber-500/20",
      SCHEDULED: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      CANCELLED: "bg-rose-500/10 text-rose-500 border-rose-500/20",
   };
   
   return (
      <Badge className={cn("px-3 py-1.5 rounded-xl font-black uppercase text-[9px] tracking-[0.15em] border", variants[status])}>
         <div className={cn("h-1.5 w-1.5 rounded-full mr-2 shadow-[0_0_8px_currentColor]", status === "RUNNING" ? "bg-primary" : "bg-current")} />
         {status}
      </Badge>
   );
}
