"use client";

import { Search, Bell, Moon, Sun, User, Settings, LogOut } from "lucide-react";
import { NotificationPanel } from "./NotificationPanel";
import { useUIStore } from "@/store/uiStore";
import { useAuthStore } from "@/store/authStore";
import { useTheme } from "next-themes";
import {
  Button,
  Avatar,
  AvatarFallback,
  AvatarImage,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@repo/ui";

export function Topbar() {
  const toggleCommandPalette = useUIStore((s: any) => s.toggleCommandPalette);
  const tenant = useAuthStore((s: any) => s.tenant);
  const user = useAuthStore((s: any) => s.user);
  const clearAuth = useAuthStore((s: any) => s.clearAuth);
  const { theme, setTheme } = useTheme();

  return (
    <header className="h-16 glass border-b border-white/10 px-6 flex items-center justify-between z-30 relative">
      <div className="flex items-center gap-4">
        <button
          onClick={() => toggleCommandPalette()}
          className="flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-white transition-all w-64 text-sm group"
        >
          <Search size={16} className="group-hover:text-primary transition-colors" />
          <span>Search anything...</span>
          <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-white/10 bg-white/5 px-1.5 font-mono text-[10px] font-medium opacity-100">
            <span className="text-xs">⌘</span>K
          </kbd>
        </button>
        <div className="h-6 w-[1px] bg-white/10 mx-2" />
        <span className="text-sm font-semibold text-white tracking-tight">
          {tenant?.name || "Workspace"}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="p-2 rounded-lg hover:bg-white/5 text-gray-400 transition-colors"
        >
          {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <NotificationPanel />

        <div className="h-6 w-[1px] bg-white/10 mx-1" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 pl-2 rounded-lg hover:bg-white/5 transition-colors group">
              <Avatar className="h-8 w-8 border border-white/10 group-hover:border-primary/50 transition-colors">
                <AvatarImage src={`https://avatar.vercel.sh/${user?.email}`} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {user?.name?.[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 glass border-white/10 mt-2">
            <DropdownMenuLabel className="text-white font-medium">My Account</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem className="text-gray-300 focus:bg-white/10 focus:text-white cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="text-gray-300 focus:bg-white/10 focus:text-white cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem 
              onClick={() => { clearAuth(); window.location.href = '/login'; }}
              className="text-rose-400 focus:bg-rose-400/10 focus:text-rose-400 cursor-pointer"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
