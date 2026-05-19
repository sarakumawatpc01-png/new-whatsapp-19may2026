"use client";

import { useEffect, useState } from "react";
import { 
  MessageSquare, 
  Plus, 
  Trash2, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  Button,
  Badge,
  Skeleton
} from "@repo/ui";
import { cn } from "@repo/ui";
import api from "@/lib/api";
import { toast } from "sonner";

declare global {
  interface Window {
    FB: any;
    fbAsyncInit: any;
  }
}

const META_APP_ID = process.env.NEXT_PUBLIC_META_APP_ID || "";
const META_CONFIG_ID = process.env.NEXT_PUBLIC_META_CONFIG_ID || "";

export default function WhatsAppSettingsPage() {
  const [numbers, setNumbers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    fetchNumbers();
    initFacebookSDK();
    setupEmbeddedSignupListener();

    return () => {
      window.removeEventListener("message", handleEmbeddedSignupMessage);
    };
  }, []);

  const initFacebookSDK = () => {
    // Load FB SDK script if not loaded
    if (!document.getElementById("facebook-jssdk")) {
      const script = document.createElement("script");
      script.id = "facebook-jssdk";
      script.src = "https://connect.facebook.net/en_US/sdk.js";
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }

    window.fbAsyncInit = function() {
      window.FB.init({
        appId: META_APP_ID,
        cookie: true,
        xfbml: true,
        version: 'v19.0'  // Updated to v19.0 per Meta 2025 compliance
      });
    };
  };

  // Capture waba_id + phone_number_id from Meta Embedded Signup postMessage
  const handleEmbeddedSignupMessage = (event: MessageEvent) => {
    if (event.origin !== "https://www.facebook.com" && event.origin !== "https://web.facebook.com") return;
    
    try {
      const data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
      if (data.type === "WA_EMBEDDED_SIGNUP") {
        const { waba_id, phone_number_id } = data.data;
        if (waba_id && phone_number_id) {
          // Store temporarily for the FB.login callback
          (window as any).__waEmbeddedSignupData = { waba_id, phone_number_id };
        }
      }
    } catch {
      // Not a valid WA embedded signup message, ignore
    }
  };

  const setupEmbeddedSignupListener = () => {
    window.addEventListener("message", handleEmbeddedSignupMessage);
  };

  const fetchNumbers = async () => {
    try {
      const res = await api.get("/whatsapp/numbers");
      setNumbers(res.data?.data || res.data || []);
    } catch (e) {
      toast.error("Failed to fetch WhatsApp numbers");
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = () => {
    if (!META_APP_ID) {
      toast.error("META_APP_ID not configured. Contact your administrator.");
      return;
    }

    setConnecting(true);
    window.FB.login((response: any) => {
      if (response.authResponse) {
        const { code } = response.authResponse;
        const embeddedData = (window as any).__waEmbeddedSignupData;
        
        if (embeddedData?.waba_id && embeddedData?.phone_number_id) {
          completeConnection(code, embeddedData.waba_id, embeddedData.phone_number_id);
          delete (window as any).__waEmbeddedSignupData;
        } else {
          toast.error("Embedded Signup did not return WABA data. Please try again.");
          setConnecting(false);
        }
      } else {
        setConnecting(false);
        toast.error("Facebook login cancelled");
      }
    }, {
      config_id: META_CONFIG_ID,
      response_type: 'code',
      override_default_response_type: true,
      scope: 'whatsapp_business_management,whatsapp_business_messaging',
      extras: {
        feature: 'whatsapp_embedded_signup',
        sessionInfoVersion: 3,
      }
    });
  };

  const completeConnection = async (code: string, wabaId: string, phoneNumberId: string) => {
    try {
      await api.post("/whatsapp/connect", {
        code,
        wabaId,
        phoneNumberId,
      });
      toast.success("WhatsApp number connected successfully!");
      fetchNumbers();
    } catch (e: any) {
      toast.error(e?.message || "Failed to complete WhatsApp connection");
    } finally {
      setConnecting(false);
    }
  };

  const handleRefreshHealth = async (id: string) => {
    try {
      const res = await api.get(`/whatsapp/numbers/${id}/health`);
      const health = res.data?.data || res.data;
      toast.success(`Quality: ${health.qualityRating || 'Unknown'}, Status: ${health.status || 'Unknown'}`);
      fetchNumbers();
    } catch (e) {
      toast.error("Failed to fetch health status");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to disconnect this number?")) return;
    try {
      await api.delete(`/whatsapp/numbers/${id}`);
      toast.success("Number disconnected");
      fetchNumbers();
    } catch (e) {
      toast.error("Failed to disconnect number");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">WhatsApp Settings</h1>
          <p className="text-gray-400 mt-1">Manage your WhatsApp Business API connections.</p>
        </div>
        <Button onClick={handleConnect} disabled={connecting} className="gap-2">
          {connecting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Plus size={18} />}
          Connect New Number
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="glass border-white/10">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
              <MessageSquare size={20} className="text-primary" />
              Connected Numbers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-16 w-full bg-white/5" />
                <Skeleton className="h-16 w-full bg-white/5" />
              </div>
            ) : numbers.length === 0 ? (
              <div className="text-center py-12 bg-white/5 rounded-2xl border border-dashed border-white/10">
                <div className="p-4 bg-primary/10 rounded-full w-fit mx-auto mb-4 text-primary">
                  <MessageSquare size={32} />
                </div>
                <h3 className="text-white font-semibold">No numbers connected</h3>
                <p className="text-gray-400 text-sm mt-1 mb-6">Connect your first WhatsApp Business number to start messaging.</p>
                <Button variant="secondary" onClick={handleConnect} className="glass border-white/10">
                  Connect WhatsApp
                </Button>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-white/10">
                <table className="w-full text-left">
                  <thead className="bg-white/5 text-gray-400 text-xs uppercase font-medium">
                    <tr>
                      <th className="px-6 py-4">Display Name</th>
                      <th className="px-6 py-4">Phone Number</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Quality</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10 text-sm">
                    {numbers.map((num) => (
                      <tr key={num.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 text-white font-medium">{num.verifiedName || num.displayName || '—'}</td>
                        <td className="px-6 py-4 text-gray-400">{num.displayPhone || num.phoneNumber || '—'}</td>
                        <td className="px-6 py-4">
                          <Badge className={
                            num.status === "ACTIVE" ? "bg-emerald-500/20 text-emerald-500" :
                            num.status === "FLAGGED" ? "bg-orange-500/20 text-orange-500" :
                            "bg-gray-500/20 text-gray-500"
                          }>
                            {num.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className={cn(
                              "w-2 h-2 rounded-full",
                              num.qualityRating === "GREEN" ? "bg-emerald-500" :
                              num.qualityRating === "YELLOW" ? "bg-orange-500" :
                              "bg-rose-500"
                            )} />
                            <span className="text-gray-300 text-xs">{num.qualityRating || "Unknown"}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-gray-400 hover:text-white"
                            onClick={() => handleRefreshHealth(num.id)}
                          >
                            <RefreshCw size={16} />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-rose-400 hover:text-rose-300 hover:bg-rose-400/10"
                            onClick={() => handleDelete(num.id)}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="glass border-white/10">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-white uppercase tracking-wider opacity-50">Webhook Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-400">Use this URL in your Meta App Dashboard to receive real-time updates.</p>
              <div className="p-3 bg-black/40 rounded-lg border border-white/10 font-mono text-xs text-primary break-all">
                {typeof window !== 'undefined' ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/webhooks/whatsapp/{TENANT_ID}` : ""}
              </div>
              <div className="flex items-center gap-2 text-xs text-blue-400 bg-blue-400/10 p-3 rounded-lg">
                <AlertCircle size={14} />
                <span>Your webhook endpoint is auto-configured per tenant. Each tenant gets a unique webhook URL.</span>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-white/10">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-white uppercase tracking-wider opacity-50">Meta Documentation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-400">Learn more about how to set up your Meta App and Embedded Signup.</p>
              <a href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started/embedded-signup" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="w-full glass border-white/10 hover:border-primary/50 gap-2">
                  <ExternalLink size={16} />
                  Meta Developer Portal
                </Button>
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
