"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Badge, Checkbox, Tabs, TabsContent, TabsList, TabsTrigger, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui";
import { Check, Trash2, Bell, Filter, MoreVertical, Mail, MessageSquare, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filterType, setFilterType] = useState("all");
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    // Mock load
    const mock = [
      { id: "1", type: "new_conversation", title: "New Conversation", body: "A new lead is waiting for response.", read: false, createdAt: new Date().toISOString() },
      { id: "2", type: "ai_quota_warning", title: "AI Quota Warning", body: "You have used 80% of your AI tokens.", read: true, createdAt: new Date(Date.now() - 3600000).toISOString() },
      { id: "3", type: "payment_failed", title: "Payment Failed", body: "Your last subscription payment failed.", read: false, createdAt: new Date(Date.now() - 86400000).toISOString() },
    ];
    setNotifications(mock);
    setLoading(false);
  }, []);

  const filteredNotifications = notifications.filter(n => {
    const tabMatch = activeTab === "all" ? true : activeTab === "unread" ? !n.read : n.read;
    const typeMatch = filterType === "all" ? true : n.type === filterType;
    return tabMatch && typeMatch;
  });

  const handleMarkAsRead = (id: string) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
    toast.success("Notification marked as read");
  };

  const handleMarkAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
    toast.success("All notifications marked as read");
  };

  const handleDelete = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
    toast.success("Notification deleted");
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredNotifications.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredNotifications.map(n => n.id));
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "new_conversation": return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case "ai_quota_warning": return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case "payment_failed": return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">Manage your alerts and system updates.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleMarkAllRead}>Mark all read</Button>
          <Button variant="destructive" size="sm" disabled={selectedIds.length === 0}>Delete Selected</Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-[400px]">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="unread">Unread</TabsTrigger>
                <TabsTrigger value="read">Read</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="new_conversation">Conversations</SelectItem>
                  <SelectItem value="ai_quota_warning">AI Alerts</SelectItem>
                  <SelectItem value="payment_failed">Billing</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-0 border rounded-md">
            <div className="flex items-center p-4 border-b bg-muted/50">
              <Checkbox 
                checked={selectedIds.length > 0 && selectedIds.length === filteredNotifications.length}
                onCheckedChange={toggleSelectAll}
              />
              <span className="ml-4 text-sm font-medium">
                {selectedIds.length > 0 ? `${selectedIds.length} selected` : "Select all"}
              </span>
            </div>
            
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No notifications found.
              </div>
            ) : (
              filteredNotifications.map((n) => (
                <div key={n.id} className={`flex items-start p-4 border-b last:border-0 hover:bg-muted/30 transition-colors ${!n.read ? "bg-blue-50/30 dark:bg-blue-900/10" : ""}`}>
                  <div className="flex items-center mt-1">
                    <Checkbox 
                      checked={selectedIds.includes(n.id)}
                      onCheckedChange={() => toggleSelect(n.id)}
                    />
                  </div>
                  <div className="flex-1 ml-4 space-y-1">
                    <div className="flex items-center gap-2">
                      {getIcon(n.type)}
                      <span className={`text-sm font-semibold ${!n.read ? "text-primary" : "text-muted-foreground"}`}>{n.title}</span>
                      {!n.read && <Badge variant="default" className="h-4 px-1.5 text-[10px]">NEW</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{n.body}</p>
                    <p className="text-xs text-muted-foreground">{new Date(n.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!n.read && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleMarkAsRead(n.id)}>
                        <Check className="w-4 h-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleDelete(n.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
