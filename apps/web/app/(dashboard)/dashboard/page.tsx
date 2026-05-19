"use client";

import { OnboardingChecklist } from "@/components/dashboard/OnboardingChecklist";
import { 
  Users, 
  MessageSquare, 
  Send, 
  Zap, 
  ArrowUpRight,
  MoreVertical,
  Search,
  FileText,
  Settings
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  Button,
  Badge,
  Avatar,
  AvatarImage,
  AvatarFallback,
  Skeleton
} from "@repo/ui";
import { cn } from "@repo/ui";
import { motion } from "framer-motion";
import { useEffect, useState, useMemo } from "react";
import { useAuthStore } from "@/store/authStore";

const stats = [
  { label: "Total Contacts", value: "12,840", change: "+12%", icon: Users, color: "text-blue-500" },
  { label: "Active Conversations", value: "842", change: "+5.4%", icon: MessageSquare, color: "text-purple-500" },
  { label: "Messages Sent Today", value: "45,210", change: "+18%", icon: Send, color: "text-emerald-500" },
  { label: "AI Replies Today", value: "38,402", change: "+24%", icon: Zap, color: "text-orange-500" },
];

const recentChats = [
  { name: "John Smith", message: "Thanks for the help!", time: "2m ago", status: "online", unread: 2 },
  { name: "Sarah Parker", message: "Is the product available?", time: "15m ago", status: "away", unread: 0 },
  { name: "Alex Johnson", message: "Can I get a discount?", time: "1h ago", status: "online", unread: 0 },
  { name: "Emma Wilson", message: "The app is great!", time: "3h ago", status: "offline", unread: 5 },
];

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const user = useAuthStore((s) => s.user);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">{greeting}, {user?.name || "there"}</h1>
          <p className="text-gray-400 mt-1">Here&apos;s what&apos;s happening with your workspace today.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" className="glass border-white/10">
            Download Report
          </Button>
          <Button>Create Campaign</Button>
        </div>
      </div>

      <OnboardingChecklist />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="glass border-white/10 hover:border-primary/50 transition-all group overflow-hidden">
              <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowUpRight size={16} className="text-gray-500" />
              </div>
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className={`p-3 rounded-2xl bg-white/5 ${stat.color}`}>
                    <stat.icon size={24} />
                  </div>
                  <div className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full">
                    {stat.change}
                  </div>
                </div>
                {loading ? (
                  <Skeleton className="h-8 w-24 bg-white/5" />
                ) : (
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                )}
                <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="glass border-white/10 h-full">
            <CardHeader className="flex flex-row items-center justify-between border-b border-white/10 pb-4">
              <CardTitle className="text-lg font-bold text-white">Recent Conversations</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input 
                    placeholder="Search chats..." 
                    className="bg-white/5 border border-white/10 rounded-lg py-1.5 pl-8 pr-3 text-xs text-white outline-none focus:border-primary/50 w-48"
                  />
                </div>
                <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-white/5">
                  <MoreVertical size={16} className="text-gray-500" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-white/10">
                {loading ? (
                  Array(4).fill(0).map((_, i) => (
                    <div key={i} className="p-4 flex items-center gap-4">
                      <Skeleton className="h-10 w-10 rounded-full bg-white/5" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-32 bg-white/5" />
                        <Skeleton className="h-3 w-48 bg-white/5" />
                      </div>
                    </div>
                  ))
                ) : (
                  recentChats.map((chat) => (
                    <div key={chat.name} className="p-4 flex items-center gap-4 hover:bg-white/5 transition-colors cursor-pointer group">
                      <div className="relative">
                        <Avatar className="h-11 w-11 border border-white/10">
                          <AvatarImage src={`https://avatar.vercel.sh/${chat.name}`} />
                          <AvatarFallback>{chat.name[0]}</AvatarFallback>
                        </Avatar>
                        <span className={cn(
                          "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#030712]",
                          chat.status === "online" ? "bg-emerald-500" : chat.status === "away" ? "bg-orange-500" : "bg-gray-500"
                        )} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-semibold text-white text-sm truncate">{chat.name}</h4>
                          <span className="text-[10px] text-gray-500">{chat.time}</span>
                        </div>
                        <p className="text-xs text-gray-400 truncate group-hover:text-gray-300 transition-colors">
                          {chat.message}
                        </p>
                      </div>
                      {chat.unread > 0 && (
                        <Badge className="bg-primary text-[10px] h-5 min-w-[20px] flex items-center justify-center rounded-full">
                          {chat.unread}
                        </Badge>
                      )}
                    </div>
                  ))
                )}
              </div>
              <div className="p-4 text-center border-t border-white/10">
                <Button variant="link" className="text-primary text-xs hover:no-underline">
                  View all conversations
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="glass border-white/10">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-white">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start gap-3 h-12 glass border-white/10 hover:border-primary/50">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                  <Users size={16} />
                </div>
                <span>Import Contacts</span>
              </Button>
              <Button className="w-full justify-start gap-3 h-12 glass border-white/10 hover:border-primary/50">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                  <Zap size={16} />
                </div>
                <span>Auto-Reply Rules</span>
              </Button>
              <Button className="w-full justify-start gap-3 h-12 glass border-white/10 hover:border-primary/50">
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
                  <FileText size={16} />
                </div>
                <span>Design Templates</span>
              </Button>
              <Button className="w-full justify-start gap-3 h-12 glass border-white/10 hover:border-primary/50">
                <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
                  <Settings size={16} />
                </div>
                <span>Tenant Settings</span>
              </Button>
            </CardContent>
          </Card>

          <Card className="glass border-white/10 mt-8 bg-primary/5 overflow-hidden relative group">
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-primary/20 rounded-full blur-2xl group-hover:bg-primary/30 transition-all" />
            <CardContent className="p-6">
              <h3 className="font-bold text-white mb-2 relative z-10">AI Native Features</h3>
              <p className="text-sm text-gray-400 mb-4 relative z-10 leading-relaxed">
                Unlock the power of automated conversations with our AI-native engine.
              </p>
              <Button variant="link" className="text-primary p-0 text-xs h-auto relative z-10">
                Learn more about AI integration →
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
