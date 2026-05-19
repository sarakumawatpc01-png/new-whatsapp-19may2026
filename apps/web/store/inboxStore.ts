import { create } from "zustand";
import api from "@/lib/api";
import { io, Socket } from "socket.io-client";

interface Conversation {
  id: string;
  status: string;
  lastMessageAt: string;
  aiEnabled: boolean;
  aiPaused: boolean;
  contact: {
    id: string;
    name: string;
    phone: string;
    tags: any[];
  };
  assignedTo?: {
    id: string;
    name: string;
    avatar?: string;
  };
  number: {
    id: string;
    displayPhone: string;
  };
  _count?: {
    messages: number;
  };
  messages: Message[];
}

interface Message {
  id: string;
  conversationId: string;
  direction: "INBOUND" | "OUTBOUND";
  senderType: "CONTACT" | "AGENT" | "AI" | "SYSTEM";
  type: string;
  body: string;
  mediaUrl?: string;
  status: string;
  createdAt: string;
  isNote?: boolean;
}

interface InboxState {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Message[];
  typingAgents: Record<string, string[]>;
  aiTyping: Record<string, boolean>;
  loading: boolean;
  error: string | null;
  socket: Socket | null;

  // Actions
  fetchConversations: (filters?: any) => Promise<void>;
  setActiveConversation: (id: string | null) => void;
  fetchMessages: (conversationId: string, cursor?: string) => Promise<void>;
  sendMessage: (body: string, type: string, mediaUrl?: string) => Promise<void>;
  addNote: (content: string) => Promise<void>;
  updateConversationStatus: (id: string, status: string) => Promise<void>;
  assignConversation: (id: string, agentId: string | null) => Promise<void>;
  setAIEnabled: (id: string, enabled: boolean) => Promise<void>;
  initSocket: (tenantId: string) => void;
  handleSocketEvent: (event: string, data: any) => void;
}

export const useInboxStore = create<InboxState>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  messages: [],
  typingAgents: {},
  aiTyping: {},
  loading: false,
  error: null,
  socket: null,

  fetchConversations: async (filters = {}) => {
    set({ loading: true, error: null });
    try {
      const res = await api.get("/inbox/conversations", { params: filters });
      set({ conversations: res.data.data.items });
    } catch (e: any) {
      console.error("Failed to fetch conversations", e);
      set({ error: e.response?.data?.error?.message || "Failed to load conversations" });
    } finally {
      set({ loading: false });
    }
  },

  setActiveConversation: (id) => {
    const { socket, activeConversationId } = get();
    if (activeConversationId && activeConversationId !== id) {
      socket?.emit("leave:conversation", activeConversationId);
    }
    set({ activeConversationId: id, messages: [] });
    if (id) {
      get().fetchMessages(id);
      socket?.emit("join:conversation", id);
    }
  },

  fetchMessages: async (conversationId, cursor) => {
    try {
      const res = await api.get(`/inbox/conversations/${conversationId}/messages`, {
        params: { cursor }
      });
      if (cursor) {
        set({ messages: [...get().messages, ...res.data.data] });
      } else {
        set({ messages: res.data.data });
      }
    } catch (e) {
      console.error("Failed to fetch messages", e);
    }
  },

  sendMessage: async (body, type, mediaUrl) => {
    const { activeConversationId, messages } = get();
    if (!activeConversationId) return;

    const optimisticMsg: Message = {
      id: `temp-${Date.now()}`,
      conversationId: activeConversationId,
      direction: "OUTBOUND",
      senderType: "AGENT",
      type,
      body,
      mediaUrl,
      status: "PENDING",
      createdAt: new Date().toISOString(),
    };
    set({ messages: [optimisticMsg, ...messages] });

    try {
      const res = await api.post("/inbox/messages/send", {
        conversationId: activeConversationId,
        type,
        body,
        mediaUrl,
      });
      set({
        messages: get().messages.map((m) => (m.id === optimisticMsg.id ? res.data.data : m)),
      });
    } catch (e) {
      set({
        messages: get().messages.filter((m) => m.id !== optimisticMsg.id),
      });
    }
  },

  addNote: async (content) => {
    const { activeConversationId, messages } = get();
    if (!activeConversationId) return;

    try {
      const res = await api.post(`/inbox/conversations/${activeConversationId}/notes`, { content });
      set({ messages: [{ ...res.data.data, isNote: true }, ...messages] });
    } catch (e) {
      console.error("Failed to add note", e);
    }
  },

  updateConversationStatus: async (id, status) => {
    try {
      const endpoint = status === 'RESOLVED' ? 'resolve' : status === 'OPEN' ? 'reopen' : null;
      if (endpoint) {
        await api.post(`/inbox/conversations/${id}/${endpoint}`);
      } else {
        await api.patch(`/inbox/conversations/${id}`, { status });
      }
    } catch (e) {
      console.error("Failed to update status", e);
    }
  },

  assignConversation: async (id, agentId) => {
    try {
      await api.post(`/inbox/conversations/${id}/assign`, { agentId });
    } catch (e) {
      console.error("Failed to assign agent", e);
    }
  },

  setAIEnabled: async (id, enabled) => {
    try {
      await api.patch(`/inbox/conversations/${id}`, { aiEnabled: enabled });
    } catch (e) {
      console.error("Failed to toggle AI", e);
    }
  },

  initSocket: (tenantId) => {
    if (get().socket) return;
    
    const { accessToken } = useAuthStore.getState();
    const wsUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const baseUrl = wsUrl.replace("/api", "");
    
    const socket = io(`${baseUrl}/inbox`, {
      auth: { token: accessToken },
      query: { tenantId },
    });

    socket.on("message:new", (data) => get().handleSocketEvent("message:new", data));
    socket.on("conversation:update", (data) => get().handleSocketEvent("conversation:update", data));
    socket.on("conversation:assigned", (data) => get().handleSocketEvent("conversation:update", data));
    socket.on("agent:typing", (data) => get().handleSocketEvent("agent:typing", data));
    socket.on("ai:typing", (data) => get().handleSocketEvent("ai:typing", data));

    set({ socket });
  },

  handleSocketEvent: (event, data) => {
    const { activeConversationId, messages, conversations } = get();

    if (event === "message:new") {
      if (data.conversationId === activeConversationId) {
        // Avoid duplicates
        if (!messages.find(m => m.id === data.id)) {
          set({ messages: [data, ...messages] });
        }
      }
      set({
        conversations: conversations.map((c) =>
          c.id === data.conversationId
            ? { ...c, lastMessageAt: data.createdAt }
            : c
        ),
      });
    }

    if (event === "conversation:update") {
      set({
        conversations: conversations.map((c) => (c.id === data.id ? { ...c, ...data } : c)),
      });
      if (data.id === activeConversationId) {
        // Could update active conversation details here if needed
      }
    }

    if (event === "agent:typing") {
      if (data.conversationId === activeConversationId) {
        // Handle agent typing logic (add to list, then remove after 3s)
        const current = get().typingAgents[data.conversationId] || [];
        if (!current.includes(data.agentName)) {
           set({ 
             typingAgents: { 
               ...get().typingAgents, 
               [data.conversationId]: [...current, data.agentName] 
             } 
           });
           setTimeout(() => {
             const updated = (get().typingAgents[data.conversationId] || []).filter(n => n !== data.agentName);
             set({ typingAgents: { ...get().typingAgents, [data.conversationId]: updated } });
           }, 3000);
        }
      }
    }

    if (event === "ai:typing") {
       set({ aiTyping: { ...get().aiTyping, [data.conversationId]: data.isTyping } });
    }
  },
}));
