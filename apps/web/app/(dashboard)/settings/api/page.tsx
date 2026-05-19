"use client";

import { useState, useEffect } from "react";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
  Button, Input, Label, Badge, Checkbox,
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Skeleton,
} from "@repo/ui";
import { Copy, Key, Plus, Trash2, Shield, AlertTriangle, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow, format } from "date-fns";
import Link from "next/link";

const SCOPE_GROUPS = [
  {
    label: "Contacts",
    scopes: [
      { value: "read:contacts", label: "Read contacts" },
      { value: "write:contacts", label: "Create/update contacts" },
    ],
  },
  {
    label: "Conversations",
    scopes: [
      { value: "read:conversations", label: "Read conversations" },
      { value: "write:conversations", label: "Update conversations" },
    ],
  },
  {
    label: "Messages",
    scopes: [
      { value: "read:messages", label: "Read messages" },
      { value: "write:messages", label: "Send messages" },
    ],
  },
  {
    label: "Templates",
    scopes: [
      { value: "read:templates", label: "Read templates" },
    ],
  },
];

const EXPIRY_OPTIONS = [
  { value: "never", label: "Never expires" },
  { value: "30", label: "30 days" },
  { value: "90", label: "90 days" },
  { value: "365", label: "1 year" },
];

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [selectedScopes, setSelectedScopes] = useState<string[]>([]);
  const [expiry, setExpiry] = useState("never");
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadKeys();
  }, []);

  const loadKeys = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/developer/api-keys", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const json = await res.json();
      if (json.success) setApiKeys(json.data);
    } catch {
      // Fallback mock for development
      setApiKeys([]);
    }
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!newKeyName.trim()) return;
    setCreating(true);
    try {
      const expiresAt = expiry === "never"
        ? undefined
        : new Date(Date.now() + parseInt(expiry) * 86400000).toISOString();

      const res = await fetch("/api/developer/api-keys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          name: newKeyName.trim(),
          permissions: selectedScopes,
          expiresAt,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setCreatedKey(json.data.key);
        await loadKeys();
        toast.success("API key created");
      }
    } catch {
      toast.error("Failed to create API key");
    }
    setCreating(false);
  };

  const handleRevoke = async (id: string) => {
    try {
      await fetch(`/api/developer/api-keys/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setApiKeys(apiKeys.filter((k) => k.id !== id));
      toast.success("API key revoked");
    } catch {
      toast.error("Failed to revoke key");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const resetDialog = () => {
    setNewKeyName("");
    setSelectedScopes([]);
    setExpiry("never");
    setCreatedKey(null);
    setCreateOpen(false);
  };

  const toggleScope = (scope: string) => {
    setSelectedScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope],
    );
  };

  return (
    <div className="p-6 space-y-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">API Keys</h1>
          <p className="text-gray-400 mt-1">
            Manage API keys for programmatic access to your workspace.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/settings/webhooks">
            <Button variant="outline" className="border-white/10 text-gray-300">
              Webhooks <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </Link>
          <Dialog open={createOpen} onOpenChange={(open) => { if (!open) resetDialog(); else setCreateOpen(true); }}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Create API Key
              </Button>
            </DialogTrigger>
            <DialogContent className="glass border-white/10 max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-white text-lg">
                  {createdKey ? "API Key Created" : "Create New API Key"}
                </DialogTitle>
                <DialogDescription className="text-gray-400">
                  {createdKey
                    ? "Copy this key now. It will only be shown once."
                    : "Configure your API key with a name, permissions, and expiry."}
                </DialogDescription>
              </DialogHeader>

              {!createdKey ? (
                <div className="space-y-6 py-4">
                  <div className="space-y-2">
                    <Label className="text-gray-200">Key Name</Label>
                    <Input
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      placeholder="e.g. Production Server"
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="text-gray-200">Scopes</Label>
                    <div className="space-y-4 p-4 bg-white/5 rounded-lg border border-white/10">
                      {SCOPE_GROUPS.map((group) => (
                        <div key={group.label}>
                          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                            {group.label}
                          </p>
                          <div className="space-y-2">
                            {group.scopes.map((scope) => (
                              <label
                                key={scope.value}
                                className="flex items-center gap-2 cursor-pointer text-sm text-gray-300 hover:text-white transition-colors"
                              >
                                <Checkbox
                                  checked={selectedScopes.includes(scope.value)}
                                  onCheckedChange={() => toggleScope(scope.value)}
                                />
                                {scope.label}
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-200">Expiration</Label>
                    <Select value={expiry} onValueChange={setExpiry}>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EXPIRY_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 py-4">
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-4 h-4 text-emerald-400" />
                      <span className="text-sm font-medium text-emerald-400">Your API Key</span>
                    </div>
                    <div className="flex items-center justify-between bg-black/30 rounded p-3">
                      <code className="text-sm font-mono text-emerald-300 break-all">
                        {createdKey}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyToClipboard(createdKey)}
                        className="ml-2 shrink-0"
                      >
                        <Copy className="w-4 h-4 text-emerald-400" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                    <p className="text-sm text-amber-300">
                      This key won't be shown again. Please copy and save it in a secure location.
                    </p>
                  </div>
                </div>
              )}

              <DialogFooter>
                {!createdKey ? (
                  <Button
                    onClick={handleCreate}
                    disabled={!newKeyName.trim() || creating}
                    className="bg-primary hover:bg-primary/90 text-white"
                  >
                    {creating ? "Creating..." : "Create Key"}
                  </Button>
                ) : (
                  <Button onClick={resetDialog}>Done</Button>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="glass border-white/10">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-white/10">
                  <TableHead className="text-gray-300">Name</TableHead>
                  <TableHead className="text-gray-300">Key Preview</TableHead>
                  <TableHead className="text-gray-300">Scopes</TableHead>
                  <TableHead className="text-gray-300">Last Used</TableHead>
                  <TableHead className="text-gray-300">Expires</TableHead>
                  <TableHead className="text-gray-300">Status</TableHead>
                  <TableHead className="text-right text-gray-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apiKeys.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-12 text-gray-500"
                    >
                      <Key className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      <p>No API keys yet. Create one to get started.</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  apiKeys.map((key) => (
                    <TableRow key={key.id} className="border-white/5 hover:bg-white/5">
                      <TableCell className="font-medium text-white">{key.name}</TableCell>
                      <TableCell>
                        <code className="bg-white/5 px-2 py-1 rounded text-xs text-gray-400 font-mono">
                          {key.keyPrefix}...
                        </code>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {(key.permissions || []).slice(0, 3).map((s: string) => (
                            <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>
                          ))}
                          {(key.permissions || []).length > 3 && (
                            <Badge variant="secondary" className="text-[10px]">
                              +{key.permissions.length - 3}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-400 text-sm">
                        {key.lastUsedAt
                          ? formatDistanceToNow(new Date(key.lastUsedAt), { addSuffix: true })
                          : "Never"}
                      </TableCell>
                      <TableCell className="text-gray-400 text-sm">
                        {key.expiresAt
                          ? format(new Date(key.expiresAt), "MMM d, yyyy")
                          : "Never"}
                      </TableCell>
                      <TableCell>
                        {key.isActive ? (
                          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                            Active
                          </Badge>
                        ) : (
                          <Badge className="bg-red-500/10 text-red-400 border-red-500/20">
                            Revoked
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {key.isActive && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRevoke(key.id)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
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
  );
}
