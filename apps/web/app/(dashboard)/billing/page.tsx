"use client";

import { useState, useEffect } from "react";
import { 
  CreditCard, 
  Zap, 
  BarChart2, 
  Calendar, 
  Download, 
  ArrowUpRight,
  ShieldCheck,
  Clock,
  ExternalLink,
  ChevronRight,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import { 
  Button, 
  Card, 
  Badge, 
  Skeleton,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  Progress
} from "@repo/ui";
import Link from "next/link";
import api from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@repo/ui";
import { format } from "date-fns";

export default function BillingPage() {
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);
  const [usage, setUsage] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [subRes, usageRes, invRes] = await Promise.all([
        api.get("/billing/subscription"),
        api.get("/billing/usage"),
        api.get("/billing/invoices")
      ]);
      setSubscription(subRes.data.data);
      setUsage(usageRes.data.data);
      setInvoices(invRes.data.items);
    } catch (e) {
      toast.error("Failed to load billing data");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <Badge className="bg-emerald-500/10 text-emerald-500 border-none rounded-lg gap-1.5"><CheckCircle2 size={12} /> Active</Badge>;
      case "TRIALING":
        return <Badge className="bg-blue-500/10 text-blue-500 border-none rounded-lg gap-1.5"><Zap size={12} /> Trialing</Badge>;
      case "PAST_DUE":
        return <Badge className="bg-amber-500/10 text-amber-500 border-none rounded-lg gap-1.5"><AlertTriangle size={12} /> Past Due</Badge>;
      case "CANCELLED":
        return <Badge className="bg-gray-500/10 text-gray-400 border-none rounded-lg gap-1.5"><Clock size={12} /> Cancelled</Badge>;
      default:
        return <Badge className="bg-gray-500/10 text-gray-500 border-none rounded-lg">{status}</Badge>;
    }
  };

  const getUsageColor = (percentage: number) => {
    if (percentage > 90) return "bg-rose-500";
    if (percentage > 70) return "bg-amber-500";
    return "bg-emerald-500";
  };

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
        <Skeleton className="h-10 w-48 bg-white/5 rounded-xl" />
        <div className="grid grid-cols-12 gap-8">
           <Skeleton className="col-span-7 h-[400px] bg-white/5 rounded-[32px]" />
           <Skeleton className="col-span-5 h-[400px] bg-white/5 rounded-[32px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <div className="h-10 w-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary shadow-2xl shadow-primary/20">
              <CreditCard size={24} />
            </div>
            Billing & Subscription
          </h1>
          <p className="text-gray-400">Manage your plan, usage, and invoices.</p>
        </div>
        <Link href="/billing/upgrade">
          <Button className="h-12 px-6 gap-2 rounded-2xl shadow-xl shadow-primary/20">
            <Zap size={18} fill="currentColor" />
            Upgrade Plan
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Current Plan */}
        <div className="col-span-7 space-y-8">
          <Card className="glass border-white/5 p-8 rounded-[32px] space-y-8 bg-gradient-to-br from-primary/5 via-transparent to-transparent">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Current Plan</p>
                <h2 className="text-4xl font-bold text-white">{subscription?.plan?.name || "No Plan"}</h2>
                <div className="flex items-center gap-3 pt-2">
                  {getStatusBadge(subscription?.status)}
                  <span className="text-gray-500 text-sm flex items-center gap-1">
                    <Calendar size={14} /> Next billing on {subscription?.currentPeriodEnd ? format(new Date(subscription.currentPeriodEnd), "MMM d, yyyy") : "N/A"}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-white">₹{(subscription?.plan?.price / 100).toLocaleString()}</p>
                <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">per {subscription?.interval || "month"}</p>
              </div>
            </div>

            <hr className="border-white/5" />

            <div className="grid grid-cols-2 gap-8">
               <div className="space-y-4">
                  <div className="flex items-center gap-2 text-white font-bold text-sm">
                    <ShieldCheck size={18} className="text-emerald-500" /> Subscription Features
                  </div>
                  <ul className="space-y-2">
                    {["Unlimited Contacts", "Multi-Number Support", "Custom Branding", "Priority Support"].map((f, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs text-gray-400">
                        <div className="h-1 w-1 bg-primary rounded-full" /> {f}
                      </li>
                    ))}
                  </ul>
               </div>
               <div className="space-y-4">
                  <div className="flex items-center gap-2 text-white font-bold text-sm">
                    <CreditCard size={18} className="text-blue-500" /> Payment Method
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <div className="h-8 w-12 bg-black rounded-md flex items-center justify-center font-bold text-[10px] text-white">VISA</div>
                        <div className="space-y-0.5">
                           <p className="text-xs text-white font-bold">•••• 4242</p>
                           <p className="text-[10px] text-gray-500 uppercase">Expires 12/28</p>
                        </div>
                     </div>
                     <Button variant="ghost" size="sm" className="text-primary h-8 px-2">Update</Button>
                  </div>
               </div>
            </div>

            <div className="flex gap-3 pt-4">
               <Button variant="outline" className="flex-1 h-11 border-white/10 hover:bg-white/5 rounded-xl gap-2">
                 Manage Billing Portal <ExternalLink size={14} />
               </Button>
               {subscription?.status !== "CANCELLED" && (
                 <Button variant="ghost" className="h-11 text-rose-500 hover:text-rose-400 hover:bg-rose-500/5 rounded-xl">
                   Cancel Subscription
                 </Button>
               )}
            </div>
          </Card>

          {/* Invoices */}
          <Card className="glass border-white/5 rounded-[32px] overflow-hidden">
            <div className="p-8 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <BarChart2 size={20} className="text-primary" /> Invoice History
              </h3>
            </div>
            <Table>
              <TableHeader className="bg-white/[0.02]">
                <TableRow className="border-white/5">
                  <TableHead className="text-gray-400 font-bold uppercase tracking-wider text-[10px] pl-8">Invoice #</TableHead>
                  <TableHead className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">Date</TableHead>
                  <TableHead className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">Amount</TableHead>
                  <TableHead className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">Status</TableHead>
                  <TableHead className="w-20 pr-8"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => (
                  <TableRow key={inv.id} className="border-white/5 hover:bg-white/[0.01]">
                    <TableCell className="pl-8 text-xs font-bold text-white">{inv.number}</TableCell>
                    <TableCell className="text-xs text-gray-400">{format(new Date(inv.createdAt), "MMM d, yyyy")}</TableCell>
                    <TableCell className="text-xs text-white font-medium">{(inv.amount / 100).toFixed(2)} {inv.currency}</TableCell>
                    <TableCell>
                       <Badge className="bg-emerald-500/10 text-emerald-500 border-none text-[9px] rounded-md">Paid</Badge>
                    </TableCell>
                    <TableCell className="pr-8 text-right">
                       <a href={`${api.defaults.baseURL}/billing/invoices/${inv.id}/pdf`} target="_blank" rel="noopener noreferrer">
                         <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-primary">
                           <Download size={16} />
                         </Button>
                       </a>
                    </TableCell>
                  </TableRow>
                ))}
                {invoices.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-gray-500 text-xs">No invoices found yet.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </div>

        {/* Usage Stats */}
        <div className="col-span-5">
          <Card className="glass border-white/5 p-8 rounded-[32px] space-y-8 sticky top-8">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">Usage This Period</h3>
              <p className="text-xs text-gray-500">Resets on {subscription?.currentPeriodEnd ? format(new Date(subscription.currentPeriodEnd), "MMM d") : "N/A"}</p>
            </div>

            <div className="space-y-8">
              <UsageMetric 
                label="AI Tokens" 
                used={usage?.aiTokens?.used || 0} 
                limit={usage?.aiTokens?.limit || 0} 
                percentage={usage?.aiTokens?.percentage || 0} 
                unit="tokens"
                color={getUsageColor(usage?.aiTokens?.percentage || 0)}
              />
              <UsageMetric 
                label="Total Messages" 
                used={usage?.messages?.used || 0} 
                limit={usage?.messages?.limit || 0} 
                percentage={usage?.messages?.percentage || 0} 
                unit="msgs"
                color={getUsageColor(usage?.messages?.percentage || 0)}
              />
              <UsageMetric 
                label="Active Conversations" 
                used={usage?.conversations?.used || 0} 
                limit={usage?.conversations?.limit || 0} 
                percentage={usage?.conversations?.percentage || 0} 
                unit="convs"
                color={getUsageColor(usage?.conversations?.percentage || 0)}
              />
              <UsageMetric 
                label="Cloud Storage" 
                used={usage?.storage?.used || 0} 
                limit={usage?.storage?.limit || 0} 
                percentage={usage?.storage?.percentage || 0} 
                unit="MB"
                color={getUsageColor(usage?.storage?.percentage || 0)}
              />
            </div>

            <div className="p-6 bg-primary/5 rounded-[24px] border border-primary/10 space-y-3">
               <div className="flex items-center gap-2 text-primary font-bold text-sm">
                  <ArrowUpRight size={18} /> Need more?
               </div>
               <p className="text-xs text-gray-400 leading-relaxed">
                  Upgrade to a higher plan to increase your limits and unlock premium features like AI Training and custom WhatsApp Flows.
               </p>
               <Link href="/billing/upgrade" className="block">
                  <Button className="w-full h-10 rounded-xl text-xs gap-2">
                    View Upgrade Options <ChevronRight size={14} />
                  </Button>
               </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function UsageMetric({ label, used, limit, percentage, unit, color }: any) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <p className="text-sm font-bold text-white">{label}</p>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">{percentage.toFixed(1)}% consumed</p>
        </div>
        <p className="text-xs text-gray-400">
          <span className="text-white font-bold">{used.toLocaleString()}</span> / {limit.toLocaleString()} <span className="text-[10px]">{unit}</span>
        </p>
      </div>
      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden p-[1px]">
        <div 
          className={cn("h-full rounded-full transition-all duration-1000", color)} 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
