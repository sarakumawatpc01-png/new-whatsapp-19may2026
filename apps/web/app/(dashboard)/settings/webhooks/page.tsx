"use client";

import { useState, useEffect } from "react";
import {
  Card, CardContent, Button, Input, Label, Badge, Checkbox,
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
  Skeleton, ScrollArea,
} from "@repo/ui";
import {
  Copy, Webhook, Plus, Trash2, AlertTriangle, Shield, RefreshCw,
  CheckCircle2, XCircle, Clock, Play, ExternalLink, ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow, format } from "date-fns";
import Link from "next/link";

const EVENT_GROUPS = [
  {
    label: "Conversations",
    events: ["conversation.created", "conversation.resolved", "conversation.assigned"],
  },
  {
    label: "Messages",
    events: ["message.received", "message.sent"],
  },
  {
    label: "Contacts",
    events: ["contact.created", "contact.updated", "contact.opted_out"],
  },
  {
    label: "Campaigns",
    events: ["campaign.completed", "campaign.failed"],
  },
  {
    label: "Automations",
    events: ["automation.triggered", "automation.completed", "automation.failed"],
  },
  {
    label: "Payments",
    events: ["payment.success", "payment.failed"],
  },
  {
    label: "Tickets",
    events: ["ticket.created", "ticket.resolved"],
  },
  {
    label: "AI",
    events: ["ai.reply.generated"],
  },
];

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [deliveriesLoading, setDeliveriesLoading] = useState(false);

  // Create form
  const [newUrl, setNewUrl] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => { loadWebhooks(); }, []);

  const loadWebhooks = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/developer/webhooks", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const json = await res.json();
      if (json.success) setWebhooks(json.data);
    } catch { setWebhooks([]); }
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!newUrl.trim() || selectedEvents.length === 0) return;
    setCreating(true);
    try {
      const res = await fetch("/api/developer/webhooks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ url: newUrl.trim(), events: selectedEvents, description: newDesc.trim() }),
      });
      const json = await res.json();
      if (json.success) {
        setCreatedSecret(json.data.secret);
        await loadWebhooks();
        toast.success("Webhook endpoint created");
      }
    } catch { toast.error("Failed to create webhook"); }
    setCreating(false);
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/developer/webhooks/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setWebhooks(webhooks.filter((w) => w.id !== id));
      if (detailId === id) setDetailId(null);
      toast.success("Webhook deleted");
    } catch { toast.error("Failed to delete webhook"); }
  };

  const handleTest = async (id: string) => {
    try {
      await fetch(`/api/developer/webhooks/${id}/test`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      toast.success("Test event sent");
      if (detailId === id) loadDeliveries(id);
    } catch { toast.error("Failed to send test"); }
  };

  const handleRetry = async (endpointId: string, deliveryId: string) => {
    try {
      await fetch(`/api/developer/webhooks/${endpointId}/deliveries/${deliveryId}/retry`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      toast.success("Delivery retried");
      loadDeliveries(endpointId);
    } catch { toast.error("Retry failed"); }
  };

  const loadDeliveries = async (endpointId: string) => {
    setDeliveriesLoading(true);
    try {
      const res = await fetch(`/api/developer/webhooks/${endpointId}/deliveries`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const json = await res.json();
      if (json.success) setDeliveries(json.data);
    } catch { setDeliveries([]); }
    setDeliveriesLoading(false);
  };

  const openDetail = (id: string) => {
    setDetailId(id);
    loadDeliveries(id);
  };

  const resetDialog = () => {
    setNewUrl(""); setNewDesc(""); setSelectedEvents([]); setCreatedSecret(null); setCreateOpen(false);
  };

  const toggleEvent = (event: string) => {
    setSelectedEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event],
    );
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const statusIcon = (status: string) => {
    if (status === "success") return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
    if (status === "failed") return <XCircle className="w-3.5 h-3.5 text-red-400" />;
    return <Clock className="w-3.5 h-3.5 text-amber-400" />;
  };

  const selectedEndpoint = webhooks.find((w) => w.id === detailId);

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Webhooks</h1>
          <p className="text-gray-400 mt-1">Receive real-time event notifications via HTTP POST.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/settings/api">
            <Button variant="outline" className="border-white/10 text-gray-300">
              API Keys <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </Link>
          <Dialog open={createOpen} onOpenChange={(open) => { if (!open) resetDialog(); else setCreateOpen(true); }}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-white">
                <Plus className="w-4 h-4 mr-2" /> Add Webhook
              </Button>
            </DialogTrigger>
            <DialogContent className="glass border-white/10 max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle className="text-white text-lg">
                  {createdSecret ? "Webhook Created" : "Add Webhook Endpoint"}
                </DialogTitle>
                <DialogDescription className="text-gray-400">
                  {createdSecret
                    ? "Copy the signing secret now. It will only be shown once."
                    : "Enter a URL and select events to subscribe to."}
                </DialogDescription>
              </DialogHeader>

              {!createdSecret ? (
                <ScrollArea className="flex-1 overflow-y-auto pr-4">
                  <div className="space-y-6 py-4">
                    <div className="space-y-2">
                      <Label className="text-gray-200">Endpoint URL</Label>
                      <Input value={newUrl} onChange={(e) => setNewUrl(e.target.value)}
                        placeholder="https://api.example.com/webhooks"
                        className="bg-white/5 border-white/10 text-white font-mono text-sm" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-200">Description (optional)</Label>
                      <Input value={newDesc} onChange={(e) => setNewDesc(e.target.value)}
                        placeholder="e.g. Production server"
                        className="bg-white/5 border-white/10 text-white" />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-gray-200">Events</Label>
                      <div className="space-y-4 p-4 bg-white/5 rounded-lg border border-white/10">
                        {EVENT_GROUPS.map((group) => (
                          <div key={group.label}>
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">{group.label}</p>
                            <div className="space-y-1.5">
                              {group.events.map((event) => (
                                <label key={event} className="flex items-center gap-2 cursor-pointer text-sm text-gray-300 hover:text-white transition-colors">
                                  <Checkbox checked={selectedEvents.includes(event)} onCheckedChange={() => toggleEvent(event)} />
                                  <code className="text-xs">{event}</code>
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              ) : (
                <div className="space-y-4 py-4">
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-4 h-4 text-emerald-400" />
                      <span className="text-sm font-medium text-emerald-400">Signing Secret</span>
                    </div>
                    <div className="flex items-center justify-between bg-black/30 rounded p-3">
                      <code className="text-sm font-mono text-emerald-300 break-all">{createdSecret}</code>
                      <Button variant="ghost" size="icon" onClick={() => copyToClipboard(createdSecret)} className="ml-2 shrink-0">
                        <Copy className="w-4 h-4 text-emerald-400" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                    <p className="text-sm text-amber-300">
                      This secret won't be shown again. Use it to verify webhook signatures with HMAC-SHA256.
                    </p>
                  </div>
                </div>
              )}
              <DialogFooter>
                {!createdSecret ? (
                  <Button onClick={handleCreate} disabled={!newUrl.trim() || selectedEvents.length === 0 || creating}
                    className="bg-primary hover:bg-primary/90 text-white">
                    {creating ? "Creating..." : "Create Endpoint"}
                  </Button>
                ) : (
                  <Button onClick={resetDialog}>Done</Button>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Endpoints table */}
        <div className={detailId ? "lg:col-span-3" : "lg:col-span-5"}>
          <Card className="glass border-white/10">
            <CardContent className="p-0">
              {loading ? (
                <div className="p-6 space-y-3">
                  <Skeleton className="h-10 w-full" /> <Skeleton className="h-10 w-full" /> <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-white/10">
                      <TableHead className="text-gray-300">URL</TableHead>
                      <TableHead className="text-gray-300">Events</TableHead>
                      <TableHead className="text-gray-300">Status</TableHead>
                      <TableHead className="text-gray-300">Success</TableHead>
                      <TableHead className="text-right text-gray-300">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {webhooks.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12 text-gray-500">
                          <Webhook className="w-8 h-8 mx-auto mb-2 opacity-40" />
                          <p>No webhook endpoints configured.</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      webhooks.map((wh) => (
                        <TableRow key={wh.id}
                          className={`border-white/5 hover:bg-white/5 cursor-pointer ${detailId === wh.id ? "bg-white/5" : ""}`}
                          onClick={() => openDetail(wh.id)}>
                          <TableCell className="font-mono text-sm max-w-[200px] truncate text-gray-300" title={wh.url}>
                            {wh.url}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {wh.events.slice(0, 2).map((e: string) => (
                                <Badge key={e} variant="secondary" className="text-[10px]">{e}</Badge>
                              ))}
                              {wh.events.length > 2 && (
                                <Badge variant="secondary" className="text-[10px]">+{wh.events.length - 2}</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {wh.isActive ? (
                              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">Active</Badge>
                            ) : (
                              <Badge className="bg-gray-500/10 text-gray-400 border-gray-500/20 text-[10px]">Disabled</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-400">
                              {wh.successRate !== null ? `${wh.successRate}%` : "—"}
                            </span>
                          </TableCell>
                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="icon" onClick={() => handleTest(wh.id)} title="Send test">
                                <Play className="w-3.5 h-3.5 text-gray-400" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(wh.id)}
                                className="text-red-400 hover:bg-red-500/10">
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Delivery details panel */}
        {detailId && selectedEndpoint && (
          <div className="lg:col-span-2">
            <Card className="glass border-white/10">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white">Delivery Logs</h3>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => loadDeliveries(detailId)} className="text-gray-400 h-7 px-2">
                      <RefreshCw className="w-3 h-3 mr-1" /> Refresh
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setDetailId(null)} className="text-gray-400 h-7 px-2">
                      Close
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-gray-500 font-mono truncate">{selectedEndpoint.url}</p>

                <ScrollArea className="h-[400px]">
                  {deliveriesLoading ? (
                    <div className="space-y-2 p-2">
                      <Skeleton className="h-14 w-full" /> <Skeleton className="h-14 w-full" /> <Skeleton className="h-14 w-full" />
                    </div>
                  ) : deliveries.length === 0 ? (
                    <div className="text-center text-gray-500 text-sm py-8">No deliveries yet.</div>
                  ) : (
                    <div className="space-y-2">
                      {deliveries.map((d) => (
                        <div key={d.id} className="p-3 bg-white/5 rounded-lg border border-white/5 hover:border-white/10 transition-colors">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              {statusIcon(d.status)}
                              <code className="text-xs text-gray-300">{d.event}</code>
                            </div>
                            <div className="flex items-center gap-1">
                              {d.httpStatus && (
                                <span className={`text-[10px] font-mono ${d.httpStatus < 300 ? "text-emerald-400" : "text-red-400"}`}>
                                  {d.httpStatus}
                                </span>
                              )}
                              {d.status === "failed" && (
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRetry(detailId, d.id)}>
                                  <RefreshCw className="w-3 h-3 text-amber-400" />
                                </Button>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-gray-500">
                            <span>{formatDistanceToNow(new Date(d.createdAt), { addSuffix: true })}</span>
                            <span>Attempt {d.attempts}/{d.maxAttempts}</span>
                          </div>
                          {d.errorMessage && (
                            <p className="text-[10px] text-red-400/80 mt-1 truncate" title={d.errorMessage}>
                              {d.errorMessage}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
