"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MessageSquare, 
  Users, 
  Megaphone, 
  Zap, 
  BarChart3, 
  FileText, 
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Sparkles,
  LayoutDashboard,
  Phone
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@repo/ui";
import { useAuthStore } from "@/store/authStore";
import { Avatar, AvatarFallback, AvatarImage, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@repo/ui";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: MessageSquare, label: "Inbox", href: "/inbox" },
  { icon: Users, label: "Contacts", href: "/contacts" },
  { icon: Megaphone, label: "Campaigns", href: "/campaigns" },
  { icon: Zap, label: "Automations", href: "/automations" },
  { icon: FileText, label: "Templates", href: "/templates" },
  { icon: BarChart3, label: "Analytics", href: "/analytics" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

export function Sidebar() {
  const [expanded, setExpanded] = useState(true);
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const handleLogout = () => {
    clearAuth();
    window.location.href = '/login';
  };

  return (
    <TooltipProvider delayDuration={0}>
      <motion.aside
        initial={false}
        animate={{ width: expanded ? 240 : 80 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="flex flex-col h-screen bg-[#0a0a0f]/80 backdrop-blur-xl border-r border-white/10 z-40 relative"
      >
        <div className="p-4 flex items-center justify-between h-16 border-b border-white/5">
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex items-center gap-2"
              >
                <div className="h-8 w-8 bg-gradient-to-tr from-indigo-500 to-violet-500 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
                  <MessageSquare className="text-white" size={16} />
                </div>
                <span className="font-bold text-lg tracking-tight text-white">PLATFORM</span>
              </motion.div>
            )}
          </AnimatePresence>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-2 rounded-lg hover:bg-white/5 text-gray-400 transition-colors"
          >
            {expanded ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            
            const linkContent = (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative",
                  isActive 
                    ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/20" 
                    : "text-gray-400 hover:bg-white/5 hover:text-white border border-transparent"
                )}
              >
                <item.icon size={20} className="shrink-0" />
                {expanded && (
                  <span className="font-medium text-sm whitespace-nowrap">{item.label}</span>
                )}
              </Link>
            );

            if (!expanded) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    {linkContent}
                  </TooltipTrigger>
                  <TooltipContent side="right" className="bg-gray-900 border-white/10 text-white">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return linkContent;
          })}
        </nav>

        <div className="p-4 border-t border-white/5">
          <div className={cn(
            "flex items-center gap-3",
            !expanded && "justify-center"
          )}>
            <Avatar className="h-9 w-9 border border-white/10">
              <AvatarImage src={`https://avatar.vercel.sh/${user?.email}`} />
              <AvatarFallback className="bg-indigo-500/10 text-indigo-400 text-xs font-bold">
                {user?.name?.substring(0, 2).toUpperCase() || "US"}
              </AvatarFallback>
            </Avatar>
            {expanded && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
            )}
          </div>
          {expanded && (
            <button 
              onClick={handleLogout}
              className="mt-3 w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-rose-400 hover:bg-rose-400/5 rounded-lg transition-colors"
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          )}
        </div>
      </motion.aside>
    </TooltipProvider>
  );
}
