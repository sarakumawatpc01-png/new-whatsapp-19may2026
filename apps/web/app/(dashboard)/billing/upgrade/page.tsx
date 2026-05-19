"use client";

import { useState, useEffect } from "react";
import { 
  ChevronLeft, 
  Check, 
  Zap, 
  Shield, 
  Crown, 
  Clock,
  ArrowRight,
  Info
} from "lucide-react";
import { 
  Button, 
  Card, 
  Badge, 
  Skeleton,
  Switch,
  Label
} from "@repo/ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@repo/ui";

export default function UpgradePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<any[]>([]);
  const [subscription, setSubscription] = useState<any>(null);
  const [isYearly, setIsYearly] = useState(false);
  const [currency, setCurrency] = useState("INR");
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [plansRes, subRes] = await Promise.all([
        api.get("/billing/plans"),
        api.get("/billing/subscription")
      ]);
      setPlans(plansRes.data.data);
      setSubscription(subRes.data.data);
    } catch (e) {
      toast.error("Failed to load plans");
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planId: string) => {
    if (subscription?.planId === planId) {
       toast.info("You are already on this plan");
       return;
    }

    setProcessingId(planId);
    try {
      if (subscription) {
        // Change plan
        await api.post("/billing/subscription/change-plan", { planId });
        toast.success("Plan updated successfully!");
        router.push("/billing");
      } else {
        // New checkout
        const res = await api.post("/billing/subscription/checkout", {
          planId,
          provider: "stripe", // Default to stripe for now
          interval: isYearly ? "yearly" : "monthly",
          currency
        });
        window.location.href = res.data.data.url;
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to process upgrade");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
        <Skeleton className="h-10 w-48 bg-white/5" />
        <div className="grid grid-cols-3 gap-8">
           {[1, 2, 3].map(i => <Skeleton key={i} className="h-[600px] bg-white/5 rounded-[32px]" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12 animate-in fade-in duration-500">
      <div className="flex flex-col items-center text-center space-y-4">
        <Link href="/billing" className="self-start">
          <Button variant="ghost" className="gap-2 text-gray-400 hover:text-white rounded-xl">
            <ChevronLeft size={20} />
            Back to Billing
          </Button>
        </Link>
        <Badge className="bg-primary/10 text-primary border-primary/20 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
          Choose Your Path
        </Badge>
        <h1 className="text-5xl font-bold text-white tracking-tight">Flexible plans for every team</h1>
        <p className="text-gray-400 max-w-xl text-lg">
          Start for free, upgrade when you need scale. All plans include our core AI-native features.
        </p>

        <div className="flex items-center gap-6 pt-8">
          <div className="flex items-center gap-3">
             <Label className={cn("text-sm font-bold transition-colors", !isYearly ? "text-white" : "text-gray-500")}>Monthly</Label>
             <Switch checked={isYearly} onCheckedChange={setIsYearly} className="bg-white/10" />
             <Label className={cn("text-sm font-bold transition-colors", isYearly ? "text-white" : "text-gray-500")}>Yearly</Label>
          </div>
          <Badge className="bg-emerald-500 text-black border-none font-bold text-[10px] h-6">SAVE 20%</Badge>
          
          <div className="h-8 w-px bg-white/10" />
          
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
             <button 
               onClick={() => setCurrency("INR")}
               className={cn("px-4 py-1.5 rounded-lg text-xs font-bold transition-all", currency === "INR" ? "bg-white text-black shadow-xl" : "text-gray-500 hover:text-white")}
             >
               INR
             </button>
             <button 
               onClick={() => setCurrency("USD")}
               className={cn("px-4 py-1.5 rounded-lg text-xs font-bold transition-all", currency === "USD" ? "bg-white text-black shadow-xl" : "text-gray-500 hover:text-white")}
             >
               USD
             </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-8">
        {plans.map((plan) => (
          <PricingCard 
            key={plan.id}
            plan={plan}
            isYearly={isYearly}
            isCurrent={subscription?.planId === plan.id}
            onUpgrade={() => handleUpgrade(plan.id)}
            loading={processingId === plan.id}
            currency={currency}
          />
        ))}
      </div>

      <div className="max-w-4xl mx-auto glass border-white/5 p-8 rounded-[40px] flex items-center justify-between bg-gradient-to-r from-primary/10 to-transparent">
         <div className="space-y-2">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
               <Crown size={24} className="text-amber-500" /> Enterprise Custom
            </h3>
            <p className="text-sm text-gray-400">Need more tokens, dedicated hosting, or custom AI models?</p>
         </div>
         <Button variant="outline" className="h-12 px-8 border-white/10 rounded-2xl gap-2 font-bold hover:bg-white/5 transition-all">
            Contact Sales <ArrowRight size={18} />
         </Button>
      </div>

      <div className="text-center space-y-4 pt-8">
         <p className="text-gray-500 text-xs flex items-center justify-center gap-2">
            <Shield size={14} /> Secure checkout powered by Stripe & Razorpay
         </p>
         <div className="flex justify-center gap-8 opacity-30 grayscale contrast-125">
            <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" alt="Stripe" className="h-6" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/8/89/Razorpay_logo.svg" alt="Razorpay" className="h-6" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="PayPal" className="h-6" />
         </div>
      </div>
    </div>
  );
}

function PricingCard({ plan, isYearly, isCurrent, onUpgrade, loading, currency }: any) {
  const price = isYearly ? plan.priceYearly : plan.price;
  const features = (plan.features as string[]) || [
    "AI-Native Automation",
    "Multi-Number WhatsApp",
    "Real-time Analytics",
    "Unlimited Contact Storage",
    "Priority 24/7 Support"
  ];

  const isPopular = plan.name === "Growth";

  return (
    <Card className={cn(
      "glass border-white/5 p-10 rounded-[48px] flex flex-col gap-8 transition-all duration-500 relative group overflow-hidden",
      isPopular ? "border-primary/50 shadow-2xl shadow-primary/10 scale-105 z-10 bg-primary/5" : "hover:border-white/20 hover:scale-[1.02]"
    )}>
      {isPopular && (
        <div className="absolute top-6 right-10">
           <Badge className="bg-primary text-white font-bold px-3 py-1 text-[10px] rounded-full shadow-lg shadow-primary/20 animate-pulse">POPULAR</Badge>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-2xl font-bold text-white group-hover:text-primary transition-colors">{plan.name}</h3>
        <p className="text-sm text-gray-500 leading-relaxed min-h-[40px]">{plan.description || "Perfect for businesses getting started with WhatsApp automation."}</p>
      </div>

      <div className="flex items-baseline gap-1">
        <span className="text-5xl font-bold text-white tracking-tighter">{currency === "INR" ? "₹" : "$"}{(price / 100).toLocaleString()}</span>
        <span className="text-gray-500 text-sm font-medium">/ {isYearly ? "year" : "month"}</span>
      </div>

      <div className="space-y-6 flex-1">
        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Included Features</div>
        <ul className="space-y-4">
          {features.map((feature, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
              <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <Check size={12} className="text-primary" />
              </div>
              {feature}
            </li>
          ))}
        </ul>
      </div>

      <Button 
        className={cn(
          "h-14 rounded-2xl font-bold text-lg shadow-xl transition-all duration-300",
          isCurrent ? "bg-white/5 text-gray-400 border border-white/10" : "shadow-primary/20"
        )}
        variant={isCurrent ? "ghost" : "default"}
        onClick={onUpgrade}
        disabled={loading || isCurrent}
      >
        {loading ? "Processing..." : isCurrent ? "Current Plan" : isYearly ? "Get Annual Plan" : "Get Started Now"}
      </Button>

      {isPopular && (
        <div className="p-4 bg-primary/10 rounded-[24px] border border-primary/20 flex items-start gap-3 mt-4">
           <Info size={20} className="text-primary shrink-0" />
           <p className="text-[10px] text-primary leading-relaxed">
             Our most loved plan. Includes advanced AI training and multi-reseller support options.
           </p>
        </div>
      )}
    </Card>
  );
}
