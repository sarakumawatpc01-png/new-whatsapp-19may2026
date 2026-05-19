"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Input, Label, Switch, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Badge, Textarea } from "@repo/ui";
import { toast } from "sonner";
import { Eye } from "lucide-react";
import api from "@/lib/api";
import { useEffect } from "react";

export default function WhiteLabelSettingsPage() {
  const user = useAuthStore(state => state.user);
  const [loading, setLoading] = useState(false);
  
  const [domainStatus, setDomainStatus] = useState<"Pending" | "DNS Verified" | "SSL Pending" | "Active" | "Error">("Pending");
  const [emailProvider, setEmailProvider] = useState<"Platform Default" | "Resend" | "Custom SMTP">("Platform Default");
  const [customCss, setCustomCss] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#0f172a");

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await api.get('/whitelabel/branding');
        const data = res.data?.data || res.data || {};
        if (data.primaryColor) setPrimaryColor(data.primaryColor);
        if (data.customCss) setCustomCss(data.customCss);
      } catch (e) {
        console.error("Failed to load branding", e);
      }
    };
    loadData();
  }, []);

  if (!user || (user.role !== "TENANT_OWNER" && user.role !== "RESELLER_ADMIN")) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-bold text-red-500">Access Denied</h2>
        <p>You do not have permission to view this page.</p>
      </div>
    );
  }

  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Sanitize CSS
    if (customCss.toLowerCase().includes("javascript:") || 
        customCss.toLowerCase().includes("expression(") || 
        customCss.toLowerCase().includes("@import")) {
      toast.error("Invalid CSS: contains blocked expressions");
      return;
    }

    setLoading(true);
    try {
      await api.put('/whitelabel/branding', {
        customCss,
        primaryColor,
      });
      toast.success("Branding updated successfully");
    } catch (e: any) {
      toast.error(e?.message || "Failed to update branding");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyDomain = async () => {
    toast.info("Verifying domain...");
    try {
      await api.post('/whitelabel/domain/verify', { domain: "app.yourdomain.com" });
      setDomainStatus("DNS Verified");
      toast.success("Domain verified successfully");
      setTimeout(() => setDomainStatus("Active"), 2000); // Simulate SSL provisioning
    } catch {
      setDomainStatus("Error");
      toast.error("Domain verification failed");
    }
  };

  const renderDomainBadge = () => {
    switch(domainStatus) {
      case "Pending": return <Badge variant="secondary">Pending DNS</Badge>;
      case "DNS Verified": return <Badge className="bg-blue-500 text-white">DNS Verified</Badge>;
      case "SSL Pending": return <Badge className="bg-yellow-500 text-white">SSL Pending</Badge>;
      case "Active": return <Badge className="bg-green-500 text-white">Active</Badge>;
      case "Error": return <Badge variant="destructive">Error</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">White-Label & Custom Domain</h1>
          <p className="text-muted-foreground">Customize the platform appearance and domain.</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Eye className="w-4 h-4" /> Preview as Tenant
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Branding Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Branding</CardTitle>
              <CardDescription>Customize colors, logos, fonts, and themes.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveBranding} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Logo (Light Mode)</Label>
                    <Input type="file" accept="image/*" />
                  </div>
                  <div className="space-y-2">
                    <Label>Logo (Dark Mode)</Label>
                    <Input type="file" accept="image/*" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="primaryColor">Primary Color</Label>
                    <div className="flex gap-2">
                      <Input id="primaryColor" type="color" className="w-12 h-10 p-1" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="secondaryColor">Secondary Color</Label>
                    <div className="flex gap-2">
                      <Input id="secondaryColor" type="color" className="w-12 h-10 p-1" defaultValue="#1e293b" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accentColor">Accent Color</Label>
                    <div className="flex gap-2">
                      <Input id="accentColor" type="color" className="w-12 h-10 p-1" defaultValue="#3b82f6" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="theme">Default Theme</Label>
                    <Select defaultValue="light">
                      <SelectTrigger>
                        <SelectValue placeholder="Select theme" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fontFamily">Google Font Name</Label>
                    <Input id="fontFamily" defaultValue="Inter" placeholder="e.g. Roboto, Inter, Outfit" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customCss">Custom CSS</Label>
                  <Textarea 
                    id="customCss" 
                    placeholder="/* Inject custom CSS variables or overrides here */" 
                    value={customCss}
                    onChange={(e) => setCustomCss(e.target.value)}
                    className="font-mono text-sm h-24"
                  />
                </div>

                <div className="flex items-center justify-between py-2 border-t">
                  <div className="space-y-0.5">
                    <Label>Hide "Powered by" Badge</Label>
                    <p className="text-sm text-muted-foreground">Remove platform branding from the footer</p>
                  </div>
                  <Switch />
                </div>

                <Button type="submit" disabled={loading}>
                  {loading ? "Saving..." : "Save Branding"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Custom Domain Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Custom Domain</CardTitle>
              <CardDescription>Host the platform on your own domain.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="domain">Domain Name</Label>
                <div className="flex gap-2">
                  <Input id="domain" placeholder="app.yourdomain.com" />
                  <Button variant="outline">Add Domain</Button>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4">
                <span className="text-sm font-medium">Status</span>
                {renderDomainBadge()}
              </div>

              <div className="bg-muted p-4 rounded-md space-y-2 border mt-4">
                <h4 className="text-sm font-medium">DNS Instructions</h4>
                <p className="text-sm text-muted-foreground">Create a CNAME record pointing to our platform:</p>
                <code className="text-xs bg-background p-2 rounded block">CNAME  app.yourdomain.com  {'->'}  cname.saasplatform.com</code>
              </div>

              <Button onClick={handleVerifyDomain} className="w-full">Verify Domain</Button>
            </CardContent>
          </Card>

          {/* Email Provider Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Email Configuration</CardTitle>
              <CardDescription>Configure how emails are sent to your tenants.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="emailProvider">Email Provider</Label>
                <Select value={emailProvider} onValueChange={(v: any) => setEmailProvider(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Platform Default">Platform Default</SelectItem>
                    <SelectItem value="Resend">Resend</SelectItem>
                    <SelectItem value="Custom SMTP">Custom SMTP</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {emailProvider === "Resend" && (
                <div className="space-y-2 pt-2 border-t">
                  <Label htmlFor="resendApiKey">Resend API Key</Label>
                  <Input id="resendApiKey" type="password" placeholder="re_..." />
                </div>
              )}

              {emailProvider === "Custom SMTP" && (
                <div className="space-y-4 pt-2 border-t">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="smtpHost">SMTP Host</Label>
                      <Input id="smtpHost" placeholder="smtp.mailgun.org" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtpPort">SMTP Port</Label>
                      <Input id="smtpPort" placeholder="587" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="smtpUser">Username</Label>
                      <Input id="smtpUser" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtpPass">Password</Label>
                      <Input id="smtpPass" type="password" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="smtpFrom">From Email</Label>
                      <Input id="smtpFrom" placeholder="noreply@yourdomain.com" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtpFromName">From Name</Label>
                      <Input id="smtpFromName" placeholder="Your Brand" />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button>Save Settings</Button>
                {emailProvider !== "Platform Default" && (
                  <Button variant="secondary">Send Test Email</Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live Preview Panel */}
        <div className="md:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Live Preview</CardTitle>
              <CardDescription>How it looks to your users.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md p-4 bg-background shadow-sm space-y-4">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-8 h-8 rounded bg-[#0f172a]"></div>
                  <span className="font-bold">Your Brand</span>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </div>
                <Button className="w-full bg-[#3b82f6] text-white hover:bg-[#3b82f6]/90 mt-4">
                  Primary Action
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
