"use client";

import { useState, useEffect } from "react";
import { 
  Workflow, 
  Plus, 
  MoreHorizontal, 
  Play, 
  Pause, 
  Trash2, 
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import { 
  Button, 
  Input, 
  Card, 
  Badge, 
  Skeleton,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from "@repo/ui";
import Link from "next/link";
import api from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@repo/ui";

export default function AutomationsPage() {
  const [loading, setLoading] = useState(true);
  const [automations, setAutomations] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchAutomations();
  }, []);

  const fetchAutomations = async () => {
    setLoading(true);
    try {
      const res = await api.get("/automations");
      setAutomations(res.data.data);
    } catch (e) {
      toast.error("Failed to load automations");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "ACTIVE" ? "pause" : "activate";
    try {
      await api.patch(`/automations/${id}/${newStatus}`);
      toast.success(`Automation ${newStatus}d`);
      fetchAutomations();
    } catch (e) {
      toast.error("Status update failed");
    }
  };

  const filteredAutomations = automations.filter(a => 
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <div className="h-10 w-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary shadow-2xl shadow-primary/20">
              <Workflow size={24} />
            </div>
            Automations
          </h1>
          <p className="text-gray-400">Design workflows to automate your WhatsApp conversations.</p>
        </div>
        <Link href="/automations/new">
          <Button className="h-12 px-6 gap-2 rounded-2xl shadow-xl shadow-primary/20">
            <Plus size={20} />
            Create Automation
          </Button>
        </Link>
      </div>

      <div className="flex gap-4 items-center mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
          <Input 
            placeholder="Search workflows..." 
            className="pl-10 bg-white/5 border-white/10 h-11 rounded-xl"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="bg-white/5 border-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer px-4 py-1.5 rounded-full">All</Badge>
          <Badge variant="outline" className="bg-white/5 border-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer px-4 py-1.5 rounded-full">Active</Badge>
          <Badge variant="outline" className="bg-white/5 border-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer px-4 py-1.5 rounded-full">Paused</Badge>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full bg-white/5 rounded-2xl" />)}
        </div>
      ) : filteredAutomations.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {filteredAutomations.map((automation) => (
            <Card key={automation.id} className="p-6 glass border-white/10 group hover:border-primary/50 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className={cn(
                    "h-14 w-14 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110",
                    automation.status === "ACTIVE" ? "bg-emerald-500/10 text-emerald-500" : "bg-white/5 text-gray-500"
                  )}>
                    <Workflow size={28} />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <Link href={`/automations/${automation.id}`}>
                        <h3 className="text-lg font-bold text-white hover:text-primary transition-colors">{automation.name}</h3>
                      </Link>
                      <Badge className={cn(
                        "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                        automation.status === "ACTIVE" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-white/5 text-gray-500 border-white/10"
                      )}>
                        {automation.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1.5"><Play size={12} className="text-gray-600" /> {automation.totalRuns} Runs</span>
                      <span className="flex items-center gap-1.5 text-emerald-500/70"><CheckCircle2 size={12} /> {automation.successRuns > 0 ? ((automation.successRuns/automation.totalRuns)*100).toFixed(0) : 0}% Success</span>
                      <span className="flex items-center gap-1.5"><Clock size={12} /> Last run: {automation.lastRunAt ? new Date(automation.lastRunAt).toLocaleDateString() : "Never"}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={cn(
                      "h-10 w-10 rounded-xl transition-all",
                      automation.status === "ACTIVE" ? "text-amber-500 hover:bg-amber-500/10" : "text-emerald-500 hover:bg-emerald-500/10"
                    )}
                    onClick={() => handleToggleStatus(automation.id, automation.status)}
                  >
                    {automation.status === "ACTIVE" ? <Pause size={20} /> : <Play size={20} />}
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-gray-500 hover:text-white hover:bg-white/5">
                        <MoreHorizontal size={20} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 glass border-white/10">
                      <DropdownMenuItem asChild>
                        <Link href={`/automations/${automation.id}`} className="flex items-center gap-2">
                          <ExternalLink size={14} /> Open Builder
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="flex items-center gap-2 text-rose-500">
                        <Trash2 size={14} /> Delete Workflow
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
          <div className="h-24 w-24 bg-white/5 rounded-[40px] flex items-center justify-center text-gray-700">
            <Workflow size={48} />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-white">No automations found</h3>
            <p className="text-gray-500 max-w-xs mx-auto">Create your first workflow to automate your customer engagement.</p>
          </div>
          <Link href="/automations/new">
            <Button className="gap-2 px-8 h-12 rounded-2xl">
              <Plus size={20} />
              Build New Workflow
            </Button>
          </Link>
        </div>
      )}

      {/* Templates Section */}
      <div className="pt-12 space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-8 w-1 bg-primary rounded-full" />
          <h2 className="text-xl font-bold text-white">Start with a Template</h2>
        </div>
        <div className="grid grid-cols-3 gap-6">
          {[
            { name: "Welcome Message", desc: "Greet new contacts automatically", icon: Play, color: "text-blue-500" },
            { name: "Away Reply", desc: "Auto-respond outside business hours", icon: Clock, color: "text-amber-500" },
            { name: "Lead Qualification", desc: "Ask questions to qualify leads", icon: HelpCircle, color: "text-emerald-500" }
          ].map((t, i) => (
            <Card key={i} className="p-6 glass border-white/10 hover:border-white/20 transition-all cursor-pointer group space-y-4">
              <div className={cn("h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center transition-all group-hover:scale-110", t.color)}>
                <t.icon size={24} />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-white">{t.name}</h4>
                <p className="text-[10px] text-gray-500">{t.desc}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function HelpCircle(props: any) {
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
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <path d="M12 17h.01" />
    </svg>
  )
}

function Database(props: any) {
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
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5V19A9 3 0 0 0 21 19V5" />
      <path d="M3 12A9 3 0 0 0 21 12" />
    </svg>
  )
}
