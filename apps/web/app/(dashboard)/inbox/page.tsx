"use client";

import { useEffect } from "react";
import ConversationList from "@/components/inbox/ConversationList";
import ChatWindow from "@/components/inbox/ChatWindow";
import ContextPanel from "@/components/inbox/ContextPanel";
import { useInboxStore } from "@/store/inboxStore";
import { useAuthStore } from "@/store/authStore";

export default function InboxPage() {
  const { initSocket, fetchConversations } = useInboxStore();
  const { tenant } = useAuthStore();

  useEffect(() => {
    if (tenant?.id) {
      initSocket(tenant.id);
      fetchConversations();
    }
  }, [tenant, initSocket, fetchConversations]);

  return (
    <div className="flex h-[calc(100vh-80px)] w-full overflow-hidden glass rounded-3xl border border-white/10">
      {/* Sidebar: Conversation List */}
      <div className="w-[320px] border-r border-white/10 flex flex-col bg-black/20">
        <ConversationList />
      </div>

      {/* Main: Chat Window */}
      <div className="flex-1 flex flex-col bg-black/10">
        <ChatWindow />
      </div>

      {/* Right Sidebar: Context Panel */}
      <div className="w-[360px] border-l border-white/10 flex flex-col bg-black/20">
        <ContextPanel />
      </div>
    </div>
  );
}
