import { AIFactory } from "./ai.factory";
import { AIContext, AIRequestParams, Message } from "./types";

export class AIOrchestrator {
  async generateReply(context: AIContext): Promise<{ content: string; usage?: any; confidence?: number }> {
    const config = this.resolveConfig(context, "auto_reply");
    const provider = AIFactory.getProvider(config.provider);
    const apiKey = this.getApiKey(context, config);

    if (!apiKey) {
      throw new Error("API Key not found for AI provider");
    }

    const systemPrompt = this.buildSystemPrompt(context);
    const messages: Message[] = [
      { role: "system", content: systemPrompt },
      ...context.recentMessages.map(m => ({
        role: (m.direction === "INBOUND" ? "user" : "assistant") as Message["role"],
        content: m.body || ""
      })),
      { role: "user", content: context.incomingMessage }
    ];

    const params: AIRequestParams = {
      messages,
      model: config.model,
      maxTokens: config.maxTokens,
      temperature: config.temperature,
      stream: false,
    };

    const response = await provider.sendMessage(params, apiKey);
    
    // Safety check (basic)
    if (this.containsProhibitedContent(response.content)) {
      return { content: "I'm sorry, I cannot answer that question based on the safety guidelines.", confidence: 0 };
    }

    // Local confidence scoring to avoid an extra paid model call in the hot path
    const confidence = this.scoreConfidence(response.content, context);

    return {
      content: response.content,
      usage: response.usage,
      confidence,
    };
  }

  async *streamReply(context: AIContext): AsyncIterableIterator<string> {
    const config = this.resolveConfig(context, "auto_reply");
    const provider = AIFactory.getProvider(config.provider);
    const apiKey = this.getApiKey(context, config);

    if (!apiKey) return;

    const systemPrompt = this.buildSystemPrompt(context);
    const messages: Message[] = [
      { role: "system", content: systemPrompt },
      ...context.recentMessages.map(m => ({
        role: (m.direction === "INBOUND" ? "user" : "assistant") as Message["role"],
        content: m.body || ""
      })),
      { role: "user", content: context.incomingMessage }
    ];

    const params: AIRequestParams = {
      messages,
      model: config.model,
      maxTokens: config.maxTokens,
      temperature: config.temperature,
      stream: true,
    };

    yield* provider.streamMessage(params, apiKey);
  }

  /**
   * Checks if AI confidence is above the threshold.
   * Returns true if the response should be sent, false if human handoff is needed.
   */
  shouldAutoRespond(confidence: number, context: AIContext): boolean {
    const threshold = context.tenantConfig.confidenceThreshold || 70;
    return confidence >= threshold;
  }

  /**
   * Resolve AI config respecting isLocked flag and per-task model assignment.
   * When global config isLocked=true, tenant overrides are ignored.
   */
  private resolveConfig(context: AIContext, taskType?: string) {
    const { tenantConfig, globalConfig } = context;
    const isLocked = globalConfig.isLocked === true;

    // If locked, force global config — tenants cannot override
    if (isLocked) {
      return {
        provider: globalConfig.defaultProvider || "OPENROUTER",
        model: globalConfig.defaultModel || "openai/gpt-4o-mini",
        maxTokens: globalConfig.maxTokens || 1000,
        temperature: globalConfig.temperature || 0.7,
        useSharedKey: true,
      };
    }

    // Check per-task model assignment
    if (taskType && tenantConfig.taskModels) {
      try {
        const taskModels = typeof tenantConfig.taskModels === 'string' 
          ? JSON.parse(tenantConfig.taskModels) 
          : tenantConfig.taskModels;
        const taskConfig = taskModels[taskType];
        if (taskConfig?.provider && taskConfig?.model) {
          return {
            provider: taskConfig.provider,
            model: taskConfig.model,
            maxTokens: tenantConfig.maxTokens || 1000,
            temperature: tenantConfig.temperature || 0.7,
            useSharedKey: tenantConfig.useSharedKey !== false,
          };
        }
      } catch {
        // Invalid taskModels JSON, fall through to default
      }
    }

    // Standard tenant-level override
    return {
      provider: tenantConfig.provider || globalConfig.defaultProvider || "OPENROUTER",
      model: tenantConfig.model || globalConfig.defaultModel || "openai/gpt-4o-mini",
      maxTokens: tenantConfig.maxTokens || 1000,
      temperature: tenantConfig.temperature || 0.7,
      useSharedKey: tenantConfig.useSharedKey !== false,
    };
  }

  private getApiKey(context: AIContext, resolvedConfig: any): string {
    if (resolvedConfig.useSharedKey) {
      return context.globalConfig.sharedApiKey || "";
    }
    return context.tenantConfig.apiKey || "";
  }

  private buildSystemPrompt(context: AIContext): string {
    const { tenantConfig, contact, conversationSummary } = context;
    
    const parts = [
      "## SYSTEM INSTRUCTIONS",
      tenantConfig.systemPrompt || "You are a professional AI assistant.",
      
      "## BUSINESS CONTEXT",
      `Business Name: ${tenantConfig.businessName || "Our Business"}`,
      tenantConfig.businessOverview ? `Overview: ${tenantConfig.businessOverview}` : "",
      
      "## CONTACT CONTEXT",
      `Talking to: ${contact.name}`,
      contact.tags.length > 0 ? `Contact Tags: ${contact.tags.join(", ")}` : "",
      
      "## MEMORY",
      conversationSummary ? `Conversation Summary: ${conversationSummary}` : "",
      
      "## GUIDELINES",
      tenantConfig.doInstructions ? `Do's:\n${tenantConfig.doInstructions}` : "",
      tenantConfig.dontInstructions ? `Don'ts:\n${tenantConfig.dontInstructions}` : "",
      
      "## TONE",
      `Maintain a ${tenantConfig.tone || "professional"}, helpful, and concise tone at all times.`,
    ];

    return parts.filter(Boolean).join("\n\n");
  }

  private containsProhibitedContent(text: string): boolean {
    const lower = text.toLowerCase();

    const directSecretDisclosurePatterns: RegExp[] = [
      /\b(my|the|your)\s+password\s+is\s+\S+/i,
      /\b(passcode|otp|cvv|cvc)\s*(is|:)\s*\d{3,8}\b/i,
      /\bssn\s*(is|:)\s*\d{3}-?\d{2}-?\d{4}\b/i,
      /\bsocial\s+security\s+number\s*(is|:)\s*\d{3}-?\d{2}-?\d{4}\b/i,
      /\b(card\s+number|credit\s+card)\s*(is|:)\s*(?:\d[\s-]?){13,19}\b/i,
    ];
    if (directSecretDisclosurePatterns.some((pattern) => pattern.test(lower))) {
      return true;
    }

    const maybeCard = text.replace(/[\s-]/g, "");
    if (/\b\d{13,19}\b/.test(maybeCard)) {
      return true;
    }

    return false;
  }

  /**
   * Score confidence of the AI response (0-100).
   * Uses local heuristics to avoid a second paid model call on each message.
   */
  private scoreConfidence(response: string, context: AIContext): number {
    const content = (response || "").trim();
    if (!content) return 0;

    let score = 80;
    if (content.length < 12) score -= 25;
    else if (content.length < 40) score -= 10;
    else if (content.length > 1200) score -= 5;

    const lower = content.toLowerCase();
    if (lower.includes("i don't know") || lower.includes("not sure") || lower.includes("cannot")) score -= 15;
    if (lower.includes("http://") || lower.includes("https://")) score += 3;
    if (this.containsProhibitedContent(content)) score = Math.min(score, 20);

    if (!context.incomingMessage?.trim()) score -= 20;

    return Math.max(0, Math.min(100, score));
  }

  async generateEmbeddings(text: string, context: AIContext): Promise<number[]> {
    const config = this.resolveConfig(context, "document_analysis");
    const provider = AIFactory.getProvider(config.provider);
    const apiKey = this.getApiKey(context, config);
    
    if (!apiKey) {
      throw new Error("API Key not found for AI provider");
    }

    return provider.generateEmbeddings(text, apiKey);
  }

  /**
   * Generate a conversation summary using the summarization task model.
   */
  async summarize(context: AIContext, messages: { role: string; content: string }[]): Promise<string> {
    const config = this.resolveConfig(context, "summary");
    const provider = AIFactory.getProvider(config.provider);
    const apiKey = this.getApiKey(context, config);

    if (!apiKey) throw new Error("API Key not found");

    const prompt: Message[] = [
      { role: "system", content: "Summarize the following conversation in 2-3 concise sentences. Focus on key topics, decisions, and any pending actions." },
      { role: "user", content: messages.map(m => `${m.role}: ${m.content}`).join("\n") }
    ];

    const result = await provider.sendMessage({
      messages: prompt,
      model: config.model,
      maxTokens: 200,
      temperature: 0.3,
      stream: false,
    }, apiKey);

    return result.content;
  }

  /**
   * Translate text using the translation task model.
   */
  async translate(context: AIContext, text: string, targetLang: string): Promise<string> {
    const config = this.resolveConfig(context, "translation");
    const provider = AIFactory.getProvider(config.provider);
    const apiKey = this.getApiKey(context, config);

    if (!apiKey) throw new Error("API Key not found");

    const prompt: Message[] = [
      { role: "system", content: `Translate the following text to ${targetLang}. Return only the translated text, no explanations.` },
      { role: "user", content: text }
    ];

    const result = await provider.sendMessage({
      messages: prompt,
      model: config.model,
      maxTokens: 500,
      temperature: 0.2,
      stream: false,
    }, apiKey);

    return result.content;
  }
}
