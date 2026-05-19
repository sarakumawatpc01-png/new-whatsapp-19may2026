"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Progress } from "@repo/ui";
import { CreditCard, ArrowUpRight, Download, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

export default function BillingPage() {
  const [plan, setPlan] = useState<any>(null);
  const [usage, setUsage] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    loadBillingData();
  }, []);

  const loadBillingData = async () => {
    try {
      const [subRes, usageRes, invRes] = await Promise.allSettled([
        api.get('/billing/subscription'),
        api.get('/billing/usage'),
        api.get('/billing/invoices'),
      ]);

      if (subRes.status === 'fulfilled') {
        const sub = subRes.value?.data?.data || subRes.value?.data || subRes.value;
        setPlan(sub);
      }
      if (usageRes.status === 'fulfilled') {
        const u = usageRes.value?.data?.data || usageRes.value?.data || usageRes.value;
        setUsage(u);
      }
      if (invRes.status === 'fulfilled') {
        const inv = invRes.value?.data?.data || invRes.value?.data || invRes.value;
        setInvoices(Array.isArray(inv) ? inv : []);
      }
    } catch {
      // Partial load is OK
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? It will remain active until the end of your billing period.')) return;
    setCancelling(true);
    try {
      await api.post('/billing/subscription/cancel');
      toast.success('Subscription cancelled. Active until end of billing period.');
      loadBillingData();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to cancel subscription');
    } finally {
      setCancelling(false);
    }
  };

  const handleUpgrade = async () => {
    try {
      const res = await api.post('/billing/subscription/checkout', {
        planId: 'upgrade',
        successUrl: `${window.location.origin}/settings/billing?success=true`,
        cancelUrl: `${window.location.origin}/settings/billing`,
      });
      const url = res.data?.data?.url || res.data?.url || (res as any).url;
      if (url && !url.startsWith('razorpay://')) {
        window.location.href = url;
      } else if (url?.startsWith('razorpay://')) {
        // Handle Razorpay modal checkout
        const orderId = new URL(url).searchParams.get('order_id');
        toast.info('Razorpay checkout will open. Please complete payment.');
      } else {
        toast.error('Could not initiate checkout');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to start upgrade');
    }
  };

  const handleDownloadInvoice = async (invoiceId: string) => {
    try {
      const res = await api.get(`/billing/invoices/${invoiceId}/pdf`, {
        responseType: 'blob' as any,
      });
      const blob = new Blob([res.data || res], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${invoiceId}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Invoice PDF not available yet');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  const planName = plan?.plan?.name || plan?.planName || plan?.name || 'Free';
  const planPrice = plan?.plan?.price || plan?.price || '₹0/mo';
  const planStatus = plan?.status || 'ACTIVE';
  const renewalDate = plan?.currentPeriodEnd 
    ? new Date(plan.currentPeriodEnd).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
    : plan?.renewalDate || '—';

  const usageMeters = usage ? [
    { key: 'messages', label: 'Messages', used: usage.messagesUsed || 0, limit: usage.messagesLimit || 100000 },
    { key: 'contacts', label: 'Contacts', used: usage.contactsUsed || 0, limit: usage.contactsLimit || 25000 },
    { key: 'aiReplies', label: 'AI Replies', used: usage.aiRepliesUsed || 0, limit: usage.aiRepliesLimit || 50000 },
    { key: 'storage', label: 'Storage (GB)', used: usage.storageUsedGb || 0, limit: usage.storageLimitGb || 10 },
  ] : [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Billing</h1>
          <p className="text-gray-400 mt-1">Manage your subscription and invoices.</p>
        </div>
      </div>

      {/* Current Plan */}
      <Card className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        <CardContent className="p-8">
          <div className="flex items-start justify-between mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-white">{planName} Plan</h2>
                <Badge className={`border ${planStatus === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : planStatus === 'CANCELLED' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'}`}>
                  {planStatus}
                </Badge>
              </div>
              <p className="text-3xl font-black text-white tabular-nums">{typeof planPrice === 'number' ? `₹${(planPrice / 100).toLocaleString()}/mo` : planPrice}</p>
              <p className="text-sm text-zinc-500 mt-1">Renews on {renewalDate}</p>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="border-white/10 rounded-xl text-sm"
                onClick={handleCancel}
                disabled={cancelling || planStatus === 'CANCELLED'}
              >
                {cancelling ? 'Cancelling...' : 'Cancel Plan'}
              </Button>
              <Button 
                className="bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl gap-2 text-sm"
                onClick={handleUpgrade}
              >
                Upgrade <ArrowUpRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Usage Meters */}
          {usageMeters.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {usageMeters.map((meter) => {
                const pct = meter.limit > 0 ? Math.round((meter.used / meter.limit) * 100) : 0;
                const isHigh = pct >= 90;
                return (
                  <div key={meter.key} className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-zinc-400 uppercase tracking-wider">{meter.label}</span>
                      <span className={`tabular-nums ${isHigh ? 'text-red-400 font-bold' : 'text-zinc-500'}`}>{pct}%</span>
                    </div>
                    <Progress value={pct} className={`h-2 ${isHigh ? 'bg-red-500/20' : 'bg-white/5'}`} />
                    <p className="text-[10px] text-zinc-600 tabular-nums">
                      {meter.used > 1000 ? `${(meter.used / 1000).toFixed(1)}k` : meter.used} / {meter.limit > 1000 ? `${(meter.limit / 1000).toFixed(0)}k` : meter.limit}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {usageMeters.length === 0 && (
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <AlertCircle className="w-4 h-4" />
              Usage data will appear once your subscription is active.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoices */}
      <Card className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-white/5 p-6">
          <CardTitle className="text-lg font-semibold text-white">Invoice History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {invoices.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 text-sm">
              No invoices yet. Your first invoice will appear after your first billing cycle.
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {invoices.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between p-5 hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-zinc-400">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{inv.invoiceNumber || inv.id}</p>
                      <p className="text-xs text-zinc-500">{inv.date ? new Date(inv.date).toLocaleDateString() : '—'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-semibold text-white tabular-nums">
                      {typeof inv.amount === 'number' ? `₹${(inv.amount / 100).toLocaleString()}` : inv.amount || '—'}
                    </span>
                    <Badge className={`text-[10px] ${inv.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'}`}>
                      {inv.status || 'PENDING'}
                    </Badge>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-zinc-400 hover:text-white h-8 px-2"
                      onClick={() => handleDownloadInvoice(inv.id)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
