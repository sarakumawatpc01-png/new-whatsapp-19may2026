"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Switch, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui";
import { toast } from "sonner";
import { Save, Loader2 } from "lucide-react";
import api from "@/lib/api";

const NOTIFICATION_TYPES = [
  { id: "NEW_CONVERSATION", label: "New Conversation", description: "When a new chat starts" },
  { id: "MESSAGE_UNASSIGNED", label: "Unassigned Message", description: "When a message remains unassigned" },
  { id: "AI_QUOTA_WARNING", label: "AI Quota Warning", description: "When AI usage reaches 80%" },
  { id: "AI_QUOTA_EXCEEDED", label: "AI Quota Exceeded", description: "When AI limits are reached" },
  { id: "PAYMENT_FAILED", label: "Payment Failed", description: "When a subscription payment fails" },
  { id: "PAYMENT_SUCCESS", label: "Payment Success", description: "When a payment is processed" },
  { id: "SUBSCRIPTION_RENEWAL", label: "Subscription Renewal", description: "Upcoming plan renewal" },
  { id: "TRIAL_ENDING", label: "Trial Ending", description: "3 days before trial ends" },
  { id: "WHATSAPP_QUALITY_DROP", label: "WhatsApp Quality Drop", description: "When account quality score falls" },
  { id: "CAMPAIGN_COMPLETED", label: "Campaign Completed", description: "When a bulk campaign finishes" },
  { id: "AUTOMATION_FAILED", label: "Automation Failed", description: "When a flow error occurs" },
];

export default function NotificationSettingsPage() {
  const [preferences, setPreferences] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const res = await api.get('/notifications/preferences');
        const savedPrefs = res.data?.data || res.data || [];
        
        // Merge saved prefs with defaults
        const merged = NOTIFICATION_TYPES.map(t => {
          const saved = savedPrefs.find((p: any) => p.notificationType === t.id);
          return {
            type: t.id,
            inApp: saved ? saved.inApp : true,
            email: saved ? saved.email : (t.id.includes("PAYMENT") || t.id.includes("QUOTA")),
            whatsapp: saved ? saved.whatsapp : (t.id === "AI_QUOTA_EXCEEDED" || t.id === "PAYMENT_FAILED")
          };
        });
        setPreferences(merged);
      } catch {
        // Fallback to default
        setPreferences(NOTIFICATION_TYPES.map(t => ({
          type: t.id,
          inApp: true,
          email: t.id.includes("PAYMENT") || t.id.includes("QUOTA"),
          whatsapp: t.id === "AI_QUOTA_EXCEEDED" || t.id === "PAYMENT_FAILED"
        })));
      } finally {
        setLoading(false);
      }
    };
    loadPreferences();
  }, []);

  const handleToggle = (type: string, channel: "inApp" | "email" | "whatsapp") => {
    setPreferences(prev => prev.map(p => 
      p.type === type ? { ...p, [channel]: !p[channel] } : p
    ));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post('/notifications/preferences', { preferences });
      toast.success("Preferences updated successfully");
    } catch (e: any) {
      toast.error(e?.message || "Failed to update preferences");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Notification Settings</h1>
          <p className="text-gray-400 mt-1">Configure how and when you want to be notified.</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-primary text-white hover:bg-primary/90">
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <Card className="glass border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Preferences</CardTitle>
          <CardDescription className="text-gray-400">Manage alerts across different channels.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-white/10">
                <TableHead className="text-gray-300">Notification Type</TableHead>
                <TableHead className="text-center text-gray-300">In-App</TableHead>
                <TableHead className="text-center text-gray-300">Email</TableHead>
                <TableHead className="text-center text-gray-300">WhatsApp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {NOTIFICATION_TYPES.map((t) => {
                const pref = preferences.find(p => p.type === t.id) || { inApp: false, email: false, whatsapp: false };
                return (
                  <TableRow key={t.id} className="border-white/5 hover:bg-white/5">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-white">{t.label}</span>
                        <span className="text-xs text-gray-500">{t.description}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <Switch 
                          checked={pref.inApp} 
                          onCheckedChange={() => handleToggle(t.id, "inApp")} 
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <Switch 
                          checked={pref.email} 
                          onCheckedChange={() => handleToggle(t.id, "email")} 
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <Switch 
                          checked={pref.whatsapp} 
                          onCheckedChange={() => handleToggle(t.id, "whatsapp")} 
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
