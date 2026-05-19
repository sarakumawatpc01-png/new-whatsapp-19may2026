"use client";

import { useState, useEffect } from "react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger,
  Button,
  Badge,
  ScrollArea
} from "@repo/ui";
import { Bell, Check, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

export function NotificationPanel() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Mock data for now.
    const mock = [
      { id: "1", title: "New Lead", body: "Someone sent you a message", isRead: false, createdAt: new Date().toISOString() },
      { id: "2", title: "AI Quota", body: "You are almost at your limit", isRead: true, createdAt: new Date(Date.now() - 3600000).toISOString() },
    ];
    setNotifications(mock);
    setUnreadCount(mock.filter(n => !n.isRead).length);
  }, []);

  const handleMarkAsRead = (id: string) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const handleMarkAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
    toast.success("All caught up!");
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button className="p-2 rounded-lg hover:bg-white/5 text-gray-400 relative transition-colors">
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
              {unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 glass border-white/10 mt-2 p-0 overflow-hidden">
        <div className="p-4 flex items-center justify-between border-b border-white/10 bg-white/5">
          <DropdownMenuLabel className="p-0 text-white font-semibold">Notifications</DropdownMenuLabel>
          <Button variant="ghost" size="sm" className="h-7 text-[10px] px-2 hover:bg-white/10" onClick={handleMarkAllRead}>
            Mark all read
          </Button>
        </div>
        
        <ScrollArea className="h-[350px]">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">
              All clear! No new notifications.
            </div>
          ) : (
            notifications.map((n) => (
              <div 
                key={n.id} 
                className={`p-4 border-b border-white/5 hover:bg-white/5 transition-colors group cursor-pointer ${!n.isRead ? "bg-primary/5" : ""}`}
                onClick={() => handleMarkAsRead(n.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h4 className={`text-sm font-medium ${!n.isRead ? "text-white" : "text-gray-400"}`}>{n.title}</h4>
                    <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{n.body}</p>
                    <span className="text-[10px] text-gray-600 mt-1 block">
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  {!n.isRead && (
                    <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
                  )}
                </div>
              </div>
            ))
          )}
        </ScrollArea>
        
        <div className="p-2 border-t border-white/10 bg-white/5">
          <Link href="/notifications" onClick={() => setOpen(false)}>
            <Button variant="ghost" className="w-full text-xs text-gray-400 hover:text-white hover:bg-transparent">
              View all notifications <ExternalLink className="ml-2 w-3 h-3" />
            </Button>
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
