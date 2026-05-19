import { Injectable, Logger, Inject } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { AIOrchestrator, AIFactory } from "@repo/ai";
import { getEnv } from "@repo/config";
import { createEncryptor } from "@repo/shared";
import { InjectQueue } from "@nestjs/bull";
import { type Queue } from "bull";
import { VectorService } from "./vector.service";

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);
  private orchestrator = new AIOrchestrator();
  private readonly encryptor = createEncryptor(getEnv().ENCRYPTION_KEY);

  constructor(@Inject(PrismaService) private prisma: PrismaService, private vector: VectorService, @InjectQueue("ai") private aiQueue: Queue
  ) {}

  async getConfig(tenantId: string) {
    let config = await this.prisma.tenantAIConfig.findUnique({
      where: { tenantId },
    });

    if (!config) {
      config = await this.prisma.tenantAIConfig.create({
        data: { tenantId },
      });
    }

    return {
      ...config,
      apiKey: config.apiKeyEncrypted ? "********" : null,
    };
  }

  async updateConfig(tenantId: string, data: any) {
    if (data.apiKey && data.apiKey !== "********") {
      data.apiKeyEncrypted = this.encrypt(data.apiKey);
    }
    delete data.apiKey;

    const updated = await this.prisma.tenantAIConfig.upsert({
      where: { tenantId },
      update: data,
      create: { ...data, tenantId },
    });

    await this.compileSystemPrompt(tenantId);
    return updated;
  }

  async getProviders() {
    return AIFactory.getAvailableProviders();
  }

  async getModels(providerName: string, tenantId: string) {
    const config = await this.prisma.tenantAIConfig.findUnique({ where: { tenantId } });
    const globalConfig = await this.getGlobalConfig();
    
    let apiKey = "";
    if (config?.provider?.toUpperCase() === providerName.toUpperCase() && config?.apiKeyEncrypted) {
      apiKey = this.decrypt(config.apiKeyEncrypted);
    } else if (globalConfig.defaultProvider.toUpperCase() === providerName.toUpperCase()) {
      apiKey = globalConfig.sharedApiKey;
    }

    const provider = AIFactory.getProvider(providerName);
    return provider.listModels(apiKey);
  }

  async testConfig(tenantId: string, message: string) {
    const conversationId = "test-" + Date.now();
    const config = await this.prisma.tenantAIConfig.findUnique({ where: { tenantId } });
    const globalConfig = await this.getGlobalConfig();

    // RAG: Search for relevant document chunks
    const chunks = await this.vector.search(tenantId, message, 5);
    const knowledgeContext = chunks.map(c => c.content).join("\n---\n");

    const context = {
      tenantId,
      conversationId,
      numberId: "test",
      incomingMessage: message,
      contact: { name: "Test User", phone: "1234567890", tags: ["test"] },
      recentMessages: [],
      conversationSummary: null,
      tenantConfig: {
        ...config,
        apiKey: config?.apiKeyEncrypted ? this.decrypt(config.apiKeyEncrypted) : null,
        systemPrompt: (config?.systemPrompt || "") + (knowledgeContext ? `\n\nRELEVANT KNOWLEDGE:\n${knowledgeContext}` : ""),
      },
      globalConfig,
    };

    return this.orchestrator.generateReply(context as any);
  }

  async getUsage(tenantId: string) {
    const logs = await this.prisma.aIUsageLog.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const stats = await this.prisma.aIUsageLog.aggregate({
      where: { tenantId },
      _sum: {
        inputTokens: true,
        outputTokens: true,
        totalTokens: true,
        costUsd: true,
      },
    });

    return { logs, stats: stats._sum };
  }

  async getFAQs(tenantId: string) {
    const config = await this.prisma.tenantAIConfig.findUnique({ where: { tenantId } });
    if (!config) return [];
    return this.prisma.aIFAQ.findMany({
      where: { configId: config.id },
    });
  }

  async createFAQ(tenantId: string, data: { question: string; answer: string }) {
    const config = await this.getConfig(tenantId);
    const doc = await this.prisma.aIFAQ.create({
      data: {
        configId: config.id,
        question: data.question,
        answer: data.answer,
      },
    });
    await this.compileSystemPrompt(tenantId);
    return doc;
  }

  async updateFAQ(tenantId: string, id: string, data: { question?: string; answer?: string }) {
    const doc = await this.prisma.aIFAQ.update({
      where: { id },
      data: {
        question: data.question,
        answer: data.answer,
      },
    });
    await this.compileSystemPrompt(tenantId);
    return doc;
  }

  async deleteFAQ(tenantId: string, id: string) {
    await this.prisma.aIFAQ.delete({
      where: { id },
    });
    await this.compileSystemPrompt(tenantId);
  }

  async getDocuments(tenantId: string) {
    return this.prisma.aIDocument.findMany({
      where: { tenantId },
    });
  }

  async uploadDocument(tenantId: string, name: string, fileUrl: string, fileType: string, fileSize: number) {
    const config = await this.getConfig(tenantId);
    const doc = await this.prisma.aIDocument.create({
      data: {
        tenantId,
        configId: config.id,
        name,
        fileUrl,
        fileType,
        fileSize,
      },
    });

    await this.aiQueue.add("document_process", { docId: doc.id, tenantId });
    
    return doc;
  }

  async deleteDocument(tenantId: string, id: string) {
    await this.prisma.aIDocument.delete({
      where: { id, tenantId },
    });
    await this.compileSystemPrompt(tenantId);
  }

  async compileSystemPrompt(tenantId: string) {
    const config = await this.prisma.tenantAIConfig.findUnique({ 
      where: { tenantId },
      include: { faqs: true }
    });

    if (!config) return;

    let compiled = `You are an AI assistant for ${config.businessName || 'our business'}.\n`;
    if (config.businessOverview) {
      compiled += `Business Overview: ${config.businessOverview}\n`;
    }
    if (config.doInstructions) {
      compiled += `Do's:\n${config.doInstructions}\n`;
    }
    if (config.dontInstructions) {
      compiled += `Don'ts:\n${config.dontInstructions}\n`;
    }

    if (config.faqs.length > 0) {
      compiled += "\nFrequently Asked Questions:\n";
      config.faqs.forEach((f: any) => {
        compiled += `Q: ${f.question}\nA: ${f.answer}\n\n`;
      });
    }

    await this.prisma.tenantAIConfig.update({
      where: { tenantId },
      data: { systemPrompt: compiled },
    });
  }

  async generateOnboarding(tenantId: string, data: { businessName: string; industry: string; services: string; tone: string }) {
    const globalConfig = await this.getGlobalConfig();
    
    const prompt = `Generate a starter AI training configuration for a business with the following details:
Business Name: ${data.businessName}
Industry: ${data.industry}
Services: ${data.services}
Tone: ${data.tone}

Return a JSON object with:
- businessOverview: A 2-3 sentence business overview
- doInstructions: Core AI behavior instructions (3-5 bullet points)
- faqs: An array of 5 FAQ objects with { question, answer }

Format exactly as JSON.`;

    const result = await this.orchestrator.generateReply({
      tenantId,
      conversationId: "onboarding",
      numberId: "onboarding",
      incomingMessage: prompt,
      contact: { name: "Owner", phone: "", tags: [] },
      recentMessages: [],
      conversationSummary: null,
      tenantConfig: {
        provider: "OPENROUTER",
        model: "openai/gpt-4o-mini",
        useSharedKey: true,
      },
      globalConfig,
    } as any);

    try {
      return JSON.parse(result.content);
    } catch (e) {
      throw new Error("Failed to parse AI response: " + result.content);
    }
  }

  async getSuggestions(tenantId: string, conversationId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId, tenantId },
      include: {
        contact: true,
        messages: { orderBy: { createdAt: "desc" }, take: 10 },
      },
    });

    if (!conversation) throw new Error("Conversation not found");

    const tenantConfig = await this.prisma.tenantAIConfig.findUnique({ where: { tenantId } });
    const globalConfig = await this.getGlobalConfig();

    const context = {
      tenantId,
      conversationId,
      numberId: conversation.numberId || "",
      incomingMessage: "",
      contact: {
        name: conversation.contact.name || "Contact",
        phone: conversation.contact.phone || "",
        tags: [],
      },
      recentMessages: conversation.messages,
      conversationSummary: conversation.summary,
      tenantConfig: {
        ...tenantConfig,
        apiKey: tenantConfig?.apiKeyEncrypted ? this.decrypt(tenantConfig.apiKeyEncrypted) : null,
      },
      globalConfig,
    };

    const prompt = "Based on the conversation history, suggest 3 short, professional, and helpful replies that an agent could send to the user. Format as a JSON array of strings.";
    
    const result = await this.orchestrator.generateReply({
      ...context,
      incomingMessage: prompt,
    } as any);

    try {
      return JSON.parse(result.content);
    } catch (e) {
      return [result.content];
    }
  }

  async summarize(tenantId: string, conversationId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId, tenantId },
      include: {
        messages: { orderBy: { createdAt: "desc" }, take: 50 },
      },
    });

    if (!conversation) throw new Error("Conversation not found");

    const tenantConfig = await this.prisma.tenantAIConfig.findUnique({ where: { tenantId } });
    const globalConfig = await this.getGlobalConfig();

    const result = await this.orchestrator.generateReply({
      tenantId,
      conversationId,
      numberId: conversation.numberId || "",
      incomingMessage: "Summarize this entire conversation concisely in 3-5 sentences.",
      contact: { name: "", phone: "", tags: [] },
      recentMessages: conversation.messages,
      conversationSummary: null,
      tenantConfig: {
        ...tenantConfig,
        apiKey: tenantConfig?.apiKeyEncrypted ? this.decrypt(tenantConfig.apiKeyEncrypted) : null,
      },
      globalConfig,
    } as any);

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { 
        summary: result.content,
        summaryUpdatedAt: new Date()
      },
    });

    return result.content;
  }

  private async getGlobalConfig() {
    const config = await this.prisma.globalAIConfig.findFirst({
      where: { isDefault: true }
    });

    return {
      defaultProvider: config?.provider || "OPENROUTER",
      defaultModel: config?.modelChat || "openai/gpt-4o-mini",
      sharedApiKey: config?.apiKeyEncrypted ? this.decrypt(config.apiKeyEncrypted) : "",
    };
  }

  private encrypt(text: string): string {
    return this.encryptor.encrypt(text);
  }

  private decrypt(text: string): string {
    return this.encryptor.decrypt(text);
  }
}
