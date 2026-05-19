export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AIRequestParams {
  messages: Message[];
  model: string;
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
}

export interface AIResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface AIModel {
  id: string;
  name: string;
  provider: string;
}

export interface AIContext {
  tenantId: string;
  conversationId: string;
  numberId: string;
  incomingMessage: string;
  contact: {
    name: string;
    phone: string;
    tags: string[];
  };
  recentMessages: { direction: "INBOUND" | "OUTBOUND"; body: string }[];
  conversationSummary: string | null;
  tenantConfig: {
    provider?: string;
    model?: string;
    apiKey?: string | null;
    maxTokens?: number;
    temperature?: number;
    businessName?: string;
    businessOverview?: string;
    doInstructions?: string;
    dontInstructions?: string;
    systemPrompt?: string;
    useSharedKey?: boolean;
    tone?: string;
    confidenceThreshold?: number;
    handoffMessage?: string;
    taskModels?: string | Record<string, { provider: string; model: string }>;
  };
  globalConfig: {
    defaultProvider: string;
    defaultModel: string;
    sharedApiKey: string;
    isLocked?: boolean;
    maxTokens?: number;
    temperature?: number;
  };
}
