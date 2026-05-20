import { InjectQueue, Process, Processor } from "@nestjs/bull";
import { Logger, Inject } from "@nestjs/common";
import { type Job, type Queue } from "bull";
import { PrismaService } from "../prisma/prisma.service";
import { AIOrchestrator } from "@repo/ai";
import { getEnv } from "@repo/config";
import { createEncryptor } from "@repo/shared";
import * as crypto from "crypto";
import { MessageDirection, MessageStatus, MessageType, MessageSender } from "@repo/database";
import { RealtimePublisher } from "../realtime/realtime.publisher";
import axios from "axios";
import pdfParse from "pdf-parse";
import * as mammoth from "mammoth";

@Processor("ai")
export class AIProcessor {
  private readonly logger = new Logger(AIProcessor.name);
  private orchestrator = new AIOrchestrator();
  private readonly encryptor = createEncryptor(getEnv().ENCRYPTION_KEY);

  constructor(
    @Inject(PrismaService) private prisma: PrismaService,
    @InjectQueue("whatsapp") private whatsappQueue: Queue,
    private realtime: RealtimePublisher
  ) {}

  @Process("processing")
  async handleAIProcessing(job: Job<any>) {
    const { tenantId, conversationId, numberId } = job.data;
    this.logger.log(`Processing AI reply for conversation: ${conversationId}`);
    const startedAt = Date.now();

    let messageId: string | null = null;
    try {
      const [conversation, tenantConfig, globalConfigRaw] = await Promise.all([
        this.prisma.conversation.findUnique({
          where: { id: conversationId },
          include: { 
            contact: true,
            number: true,
            messages: { orderBy: { createdAt: "desc" }, take: 20 }
          }
        }),
        this.prisma.tenantAIConfig.findUnique({ where: { tenantId } }),
        this.prisma.globalAIConfig.findFirst({ where: { isDefault: true } })
      ]);

      if (!conversation || !tenantConfig) return;

      const incomingMessage = conversation.messages[0]?.body || "";

      const context = {
        tenantId,
        conversationId,
        numberId,
        incomingMessage,
        contact: {
          name: conversation.contact.name || "Contact",
          phone: conversation.contact.phone || "",
          tags: [],
        },
        recentMessages: conversation.messages.slice(1).reverse().map(m => ({
          direction: m.direction,
          body: m.body
        })),
        conversationSummary: conversation.summary,
        tenantConfig: {
          ...tenantConfig,
          apiKey: tenantConfig.apiKeyEncrypted ? this.decrypt(tenantConfig.apiKeyEncrypted) : null,
        },
        globalConfig: {
          defaultProvider: globalConfigRaw?.provider || "OPENROUTER",
          defaultModel: globalConfigRaw?.modelChat || "openai/gpt-4o-mini",
          sharedApiKey: globalConfigRaw?.apiKeyEncrypted ? this.decrypt(globalConfigRaw.apiKeyEncrypted) : "",
        },
      };

      // --- VECTOR SEARCH (RAG) ---
      try {
        const queryEmbedding = await this.orchestrator.generateEmbeddings(incomingMessage, context as any);
        const topChunks: any[] = await this.prisma.$queryRawUnsafe(
          `SELECT content FROM "AIDocumentChunk" 
           WHERE "tenantId" = $1 
           ORDER BY embedding <-> $2::vector 
           LIMIT 5`,
          tenantId,
          `[${queryEmbedding.join(",")}]`
        );

        if (topChunks.length > 0) {
          const ragContext = topChunks.map(c => c.content).join("\n---\n");
          context.tenantConfig.systemPrompt = `${context.tenantConfig.systemPrompt || ""}\n\nRELEVANT DOCUMENT CONTEXT:\n${ragContext}`;
        }
      } catch (ragError) {
        this.logger.warn(`Vector search failed for ${conversationId}: ${ragError}`);
      }
      // ---------------------------

      const result = await this.orchestrator.generateReply(context as any);

      const isInsideCsw = conversation.cswExpiresAt ? new Date() < conversation.cswExpiresAt : false;
      
      const message = await this.prisma.message.create({
        data: {
          tenantId,
          conversationId,
          numberId,
          direction: MessageDirection.OUTBOUND,
          senderType: MessageSender.AI,
          type: MessageType.TEXT,
          body: result.content,
          status: MessageStatus.PENDING,
          isInsideCsw,
          messageCategory: isInsideCsw ? "SERVICE" : "UTILITY",
          messageCost: isInsideCsw ? 0.00 : 0.05,
        },
      });
      messageId = message.id;

      // Log Usage
      if (result.usage) {
        const modelName = tenantConfig.model || globalConfigRaw?.modelChat || "UNKNOWN";
        const inputTokens = Number(result.usage.promptTokens || 0);
        const outputTokens = Number(result.usage.completionTokens || 0);
        const totalTokens = Number(result.usage.totalTokens || (inputTokens + outputTokens));
        const costUsd = this.calculateCostUsd(modelName, inputTokens, outputTokens);

        await this.prisma.aIUsageLog.create({
          data: {
            tenantId,
            conversationId,
            provider: (tenantConfig.provider || globalConfigRaw?.provider || "OPENROUTER") as any,
            model: modelName,
            inputTokens,
            outputTokens,
            totalTokens,
            costUsd,
            latencyMs: Date.now() - startedAt,
          },
        });
      }

      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date() }
      });

      await this.realtime.publish(tenantId, "message:new", message);
      await this.realtime.publish(tenantId, "conversation:update", {
        id: conversationId,
        lastMessage: message,
        lastMessageAt: message.createdAt,
      });

      await this.whatsappQueue.add("outgoing", {
        messageId: message.id,
        tenantId,
        phoneNumberId: conversation.number.phoneNumberId,
        to: conversation.contact.phone,
        type: "TEXT",
        body: result.content,
      }, {
        attempts: 3,
        backoff: { type: "exponential", delay: 2000 },
      });

      this.logger.log(`AI reply sent for conversation: ${conversationId}`);
    } catch (error: any) {
      if (messageId) {
        const failed = await this.prisma.message.update({
          where: { id: messageId },
          data: {
            status: MessageStatus.FAILED,
            failedAt: new Date(),
            failureReason: error?.message || "AI processing failed",
          },
        });
        await this.realtime.publish(tenantId, "message:update", failed);
      }
      this.logger.error(`Failed to process AI reply: ${error.stack}`);
    }
  }

  @Process("document_process")
  async handleDocumentProcess(job: Job<any>) {
    const { docId, tenantId } = job.data;
    this.logger.log(`Processing AI document: ${docId}`);

    try {
      const doc = await this.prisma.aIDocument.findUnique({
        where: { id: docId, tenantId }
      });

      if (!doc) return;

      let content = doc.content;
      if (!content && doc.fileUrl) {
        content = await this.extractDocumentContent(doc.fileUrl, doc.name);
        await this.prisma.aIDocument.update({
          where: { id: docId },
          data: { content }
        });
      }

      if (!content) return;

      const tenantConfig = await this.prisma.tenantAIConfig.findUnique({ where: { tenantId } });
      const globalConfigRaw = await this.prisma.globalAIConfig.findFirst({ where: { isDefault: true } });

      if (!tenantConfig) return;

      const context = {
        tenantId,
        tenantConfig: {
          ...tenantConfig,
          apiKey: tenantConfig.apiKeyEncrypted ? this.decrypt(tenantConfig.apiKeyEncrypted) : null,
        },
        globalConfig: {
          defaultProvider: globalConfigRaw?.provider || "OPENROUTER",
          sharedApiKey: globalConfigRaw?.apiKeyEncrypted ? this.decrypt(globalConfigRaw.apiKeyEncrypted) : "",
        },
      };

      // 1. Simple Chunking
      const chunkSize = 1000;
      const overlap = 200;
      const chunks: string[] = [];
      let start = 0;
      
      while (start < content.length) {
        const end = Math.min(start + chunkSize, content.length);
        chunks.push(content.substring(start, end));
        start += (chunkSize - overlap);
      }

      // 2. Generate Embeddings and Save
      for (const content of chunks) {
        const embedding = await this.orchestrator.generateEmbeddings(content, context as any);
        
        // Use raw SQL for PGVector insert
        await this.prisma.$executeRawUnsafe(
          `INSERT INTO "AIDocumentChunk" ("id", "documentId", "tenantId", "content", "embedding", "createdAt") 
           VALUES ($1, $2, $3, $4, $5::vector, NOW())`,
          crypto.randomUUID(),
          docId,
          tenantId,
          content,
          `[${embedding.join(",")}]`
        );
      }

      await this.prisma.aIDocument.update({
        where: { id: docId },
        data: { processed: true, processedAt: new Date() }
      });

      this.logger.log(`Document ${docId} processed with ${chunks.length} chunks.`);
      await this.compileSystemPrompt(tenantId);
    } catch (error: any) {
      this.logger.error(`Failed to process document: ${error.stack}`);
    }
  }

  private async compileSystemPrompt(tenantId: string) {
    const config = await this.prisma.tenantAIConfig.findUnique({ 
      where: { tenantId },
      include: { faqs: true }
    });

    if (!config) return;

    let compiled = `You are an AI assistant for ${config.businessName || 'our business'}.\n`;
    if (config.businessOverview) {
      compiled += `Business Overview: ${config.businessOverview}\n`;
    }
    
    if (config.faqs.length > 0) {
      compiled += "\nFrequently Asked Questions:\n";
      config.faqs.forEach((f: any) => {
        compiled += `Q: ${f.question}\nA: ${f.answer}\n\n`;
      });
    }

    compiled += `\nGuidelines:\n${config.doInstructions || ""}\n${config.dontInstructions || ""}`;

    await this.prisma.tenantAIConfig.update({
      where: { tenantId },
      data: { systemPrompt: compiled },
    });
  }

  private decrypt(text: string): string {
    return this.encryptor.decrypt(text);
  }

  private async extractDocumentContent(fileUrl: string, fileName?: string | null): Promise<string> {
    this.assertSafeDocumentUrl(fileUrl);

    try {
      const response = await axios.get<ArrayBuffer>(fileUrl, {
        responseType: "arraybuffer",
        timeout: 15000,
        maxContentLength: 10 * 1024 * 1024,
      });
      if (response.status < 200 || response.status >= 300) {
        throw new Error(`Unexpected HTTP status ${response.status}`);
      }

      const buffer = Buffer.from(response.data);
      const name = (fileName || fileUrl).toLowerCase();
      const contentType = String(response.headers["content-type"] || "").toLowerCase();
      const isOctetStream = contentType.includes("application/octet-stream");

      if (name.endsWith(".pdf")) {
        if (!isOctetStream && !contentType.includes("application/pdf")) {
          throw new Error(`Unexpected content-type for PDF: ${contentType || "unknown"}`);
        }
        const parsed = await pdfParse(buffer);
        return (parsed.text || "").trim();
      }

      if (name.endsWith(".docx")) {
        if (!isOctetStream && !contentType.includes("application/vnd.openxmlformats-officedocument.wordprocessingml.document")) {
          throw new Error(`Unexpected content-type for DOCX: ${contentType || "unknown"}`);
        }
        const parsed = await mammoth.extractRawText({ buffer });
        return (parsed.value || "").trim();
      }

      if (!isOctetStream && !contentType.startsWith("text/plain")) {
        throw new Error(`Unexpected content-type for text document: ${contentType || "unknown"}`);
      }
      return buffer.toString("utf8").trim();
    } catch (error: any) {
      throw new Error(`Document extraction failed: ${error?.message || "unknown error"}`);
    }
  }

  private assertSafeDocumentUrl(fileUrl: string) {
    const parsed = new URL(fileUrl);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      throw new Error("Document URL protocol must be http or https");
    }

    const host = parsed.hostname.toLowerCase();
    if (host === "localhost" || host === "127.0.0.1" || host === "::1" || host.endsWith(".local")) {
      throw new Error("Document URL host is not allowed");
    }

    if (this.isPrivateIpv4(host) || this.isPrivateIpv6(host)) {
      throw new Error("Document URL private network hosts are not allowed");
    }
  }

  private isPrivateIpv4(host: string): boolean {
    const parts = host.split(".").map((p) => Number(p));
    if (parts.length !== 4 || parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) {
      return false;
    }
    if (parts[0] === 10) return true;
    if (parts[0] === 127) return true;
    if (parts[0] === 169 && parts[1] === 254) return true;
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    if (parts[0] === 192 && parts[1] === 168) return true;
    return false;
  }

  private isPrivateIpv6(host: string): boolean {
    const normalized = host.toLowerCase();
    return (
      normalized === "::1" ||
      normalized.startsWith("fc") ||
      normalized.startsWith("fd") ||
      normalized.startsWith("fe80:")
    );
  }

  private calculateCostUsd(model: string, inputTokens: number, outputTokens: number): number {
    const normalizedModel = (model || "").toLowerCase();
    const pricing = this.resolveModelPricing(normalizedModel);
    const inputCost = (inputTokens / 1_000_000) * pricing.inputPerMillionUsd;
    const outputCost = (outputTokens / 1_000_000) * pricing.outputPerMillionUsd;
    return Number((inputCost + outputCost).toFixed(6));
  }

  private resolveModelPricing(model: string): { inputPerMillionUsd: number; outputPerMillionUsd: number } {
    const knownRates: Array<{ match: RegExp; inputPerMillionUsd: number; outputPerMillionUsd: number }> = [
      { match: /gpt-4o-mini/, inputPerMillionUsd: 0.15, outputPerMillionUsd: 0.60 },
      { match: /gpt-4o/, inputPerMillionUsd: 2.50, outputPerMillionUsd: 10.00 },
      { match: /gpt-4\.1-mini/, inputPerMillionUsd: 0.40, outputPerMillionUsd: 1.60 },
      { match: /gpt-4\.1/, inputPerMillionUsd: 2.00, outputPerMillionUsd: 8.00 },
      { match: /claude-3-5-haiku|claude-3-7-haiku|haiku/, inputPerMillionUsd: 0.80, outputPerMillionUsd: 4.00 },
      { match: /claude-3-5-sonnet|claude-3-7-sonnet|sonnet/, inputPerMillionUsd: 3.00, outputPerMillionUsd: 15.00 },
      { match: /gemini-1\.5-flash|gemini-2.*flash/, inputPerMillionUsd: 0.35, outputPerMillionUsd: 1.05 },
      { match: /gemini-1\.5-pro|gemini-2.*pro/, inputPerMillionUsd: 3.50, outputPerMillionUsd: 10.50 },
    ];

    for (const rate of knownRates) {
      if (rate.match.test(model)) {
        return {
          inputPerMillionUsd: rate.inputPerMillionUsd,
          outputPerMillionUsd: rate.outputPerMillionUsd,
        };
      }
    }

    return { inputPerMillionUsd: 1.0, outputPerMillionUsd: 3.0 };
  }
}
