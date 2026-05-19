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

    // Confidence scoring
    const confidence = await this.scoreConfidence(response.content, context, apiKey, config);

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
    const prohibited = ["password", "credit card", "ssn", "social security"];
    const lower = text.toLowerCase();
    return prohibited.some(p => lower.includes(p));
  }

  /**
   * Score confidence of the AI response (0-100).
   * Uses a lightweight classification call to evaluate if the response is accurate.
   */
  private async scoreConfidence(
    response: string, 
    context: AIContext, 
    apiKey: string,
    config: any
  ): Promise<number> {
    try {
      // Use classification task model if available
      const classConfig = this.resolveConfig(context, "classification");
      const classProvider = AIFactory.getProvider(classConfig.provider);
      const classKey = this.getApiKey(context, { useSharedKey: classConfig.useSharedKey });

      const messages: Message[] = [
        { 
          role: "system", 
          content: "You are a response quality evaluator. Given a user question and an AI response, rate the confidence that the response is accurate, relevant, and complete. Respond with ONLY a number from 0 to 100." 
        },
        { 
          role: "user", 
          content: `User question: "${context.incomingMessage}"\n\nAI response: "${response.substring(0, 500)}"\n\nConfidence score (0-100):` 
        }
      ];

      const result = await classProvider.sendMessage({
        messages,
        model: classConfig.model,
        maxTokens: 10,
        temperature: 0,
        stream: false,
      }, classKey || apiKey);

      const score = parseInt(result.content.replace(/\D/g, ''));
      return isNaN(score) ? 80 : Math.max(0, Math.min(100, score));
    } catch {
      // Default to 80% confidence if scoring fails
      return 80;
    }
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
