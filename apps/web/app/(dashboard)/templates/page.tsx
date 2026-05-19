"use client";

import { useState, useEffect } from "react";
import { 
  Layout, 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Send,
  RefreshCw,
  Trash2,
  ExternalLink
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

export default function TemplatesPage() {
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await api.get("/templates");
      setTemplates(res.data.data);
    } catch (e) {
      toast.error("Failed to load templates");
    } finally {
      setLoading(false);
    }
  };

  const syncStatus = async (id: string) => {
    try {
      await api.get(`/templates/${id}/status`);
      toast.success("Status synced from Meta");
      fetchTemplates();
    } catch (e) {
      toast.error("Failed to sync status");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 gap-1.5"><CheckCircle2 size={12} /> Approved</Badge>;
      case "PENDING_REVIEW":
        return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 gap-1.5"><Clock size={12} /> Pending</Badge>;
      case "REJECTED":
        return <Badge className="bg-rose-500/10 text-rose-500 border-rose-500/20 gap-1.5"><XCircle size={12} /> Rejected</Badge>;
      case "DRAFT":
        return <Badge className="bg-gray-500/10 text-gray-400 border-gray-500/20 gap-1.5"><FileText size={12} /> Draft</Badge>;
      default:
        return <Badge className="bg-gray-500/10 text-gray-500 border-gray-500/20">{status}</Badge>;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <div className="h-10 w-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary shadow-2xl shadow-primary/20">
              <FileText size={24} />
            </div>
            Message Templates
          </h1>
          <p className="text-gray-400">Manage your WhatsApp message templates for campaigns.</p>
        </div>
        <Link href="/templates/create">
          <Button className="h-12 px-6 gap-2 rounded-2xl shadow-xl shadow-primary/20">
            <Plus size={20} />
            Create Template
          </Button>
        </Link>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 glass p-2 rounded-2xl border-white/5">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            <Input 
              placeholder="Search templates..." 
              className="pl-10 bg-white/5 border-white/10 h-11 rounded-xl"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="ghost" className="gap-2 text-gray-400 hover:text-white rounded-xl h-11 px-4">
            <Filter size={18} />
            Filter
          </Button>
        </div>
        <Button variant="ghost" className="text-gray-400 hover:text-white gap-2" onClick={fetchTemplates}>
          <RefreshCw size={16} /> Refresh
        </Button>
      </div>

      <Card className="glass border-white/5 overflow-hidden rounded-3xl">
        {loading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 w-full bg-white/5 rounded-2xl" />)}
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-white/[0.02]">
              <TableRow className="hover:bg-transparent border-white/5">
                <TableHead className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">Name</TableHead>
                <TableHead className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">Category</TableHead>
                <TableHead className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">Language</TableHead>
                <TableHead className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">Status</TableHead>
                <TableHead className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">Used</TableHead>
                <TableHead className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">Created At</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((template) => (
                <TableRow key={template.id} className="hover:bg-white/[0.02] border-white/5 group transition-colors">
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-bold text-white text-sm">{template.displayName || template.name}</span>
                      <span className="text-[10px] text-gray-500 font-mono">{template.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-white/5 border-white/10 text-gray-400 font-medium rounded-lg">
                      {template.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-400 text-xs font-mono">{template.language}</TableCell>
                  <TableCell>{getStatusBadge(template.status)}</TableCell>
                  <TableCell className="text-gray-400 text-xs">{template.timesUsed} times</TableCell>
                  <TableCell className="text-gray-400 text-[10px]">
                    {format(new Date(template.createdAt), "MMM d, yyyy · HH:mm")}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-white">
                          <MoreHorizontal size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="glass border-white/10 w-48">
                        <DropdownMenuItem asChild>
                          <Link href={`/templates/${template.id}`} className="gap-2 cursor-pointer">
                            <FileText size={14} /> View Details
                          </Link>
                        </DropdownMenuItem>
                        {template.status === "PENDING_REVIEW" && (
                          <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => syncStatus(template.id)}>
                            <RefreshCw size={14} /> Sync Status
                          </DropdownMenuItem>
                        )}
                        {template.status === "DRAFT" && (
                          <DropdownMenuItem className="gap-2 text-primary cursor-pointer">
                            <Send size={14} /> Submit to Meta
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem className="gap-2 text-rose-500 cursor-pointer">
                          <Trash2 size={14} /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {templates.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="h-16 w-16 bg-white/5 rounded-3xl flex items-center justify-center text-gray-600">
                        <FileText size={32} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-white font-bold text-lg">No templates found</p>
                        <p className="text-gray-500 text-sm">Create your first template to start sending campaigns.</p>
                      </div>
                      <Link href="/templates/create">
                        <Button variant="outline" className="border-white/10 hover:bg-white/5 rounded-xl">
                          Create Template
                        </Button>
                      </Link>
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
