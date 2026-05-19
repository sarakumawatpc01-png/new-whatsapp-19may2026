import { InjectQueue, Process, Processor } from "@nestjs/bull";
import { Logger, Inject } from "@nestjs/common";
import { type Job, type Queue } from "bull";
import { PrismaService } from "../prisma/prisma.service";
import { AIOrchestrator } from "@repo/ai";
import { getEnv } from "@repo/config";
import * as crypto from "crypto";
import { MessageDirection, MessageStatus, MessageType, MessageSender } from "@repo/database";

@Processor("ai")
export class AIProcessor {
  private readonly logger = new Logger(AIProcessor.name);
  private orchestrator = new AIOrchestrator();
  private encryptionKey = getEnv().ENCRYPTION_KEY || "fallback-key-at-least-32-chars-long-!!!";

  constructor(@Inject(PrismaService) private prisma: PrismaService, @InjectQueue("whatsapp") private whatsappQueue: Queue
  ) {}

  @Process("processing")
  async handleAIProcessing(job: Job<any>) {
    const { tenantId, conversationId, numberId } = job.data;
    this.logger.log(`Processing AI reply for conversation: ${conversationId}`);

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
          status: MessageStatus.SENT,
          isInsideCsw,
          messageCategory: isInsideCsw ? "SERVICE" : "UTILITY",
          messageCost: isInsideCsw ? 0.00 : 0.05,
        },
      });

      // Log Usage
      if (result.usage) {
        await this.prisma.aIUsageLog.create({
          data: {
            tenantId,
            conversationId,
            provider: (tenantConfig.provider || globalConfigRaw?.provider || "OPENROUTER") as any,
            model: tenantConfig.model || globalConfigRaw?.modelChat || "UNKNOWN",
            inputTokens: result.usage.promptTokens,
            outputTokens: result.usage.completionTokens,
            totalTokens: result.usage.totalTokens,
            costUsd: 0, 
            latencyMs: 0,
          },
        });
      }

      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date() }
      });

      await this.whatsappQueue.add("outgoing", {
        messageId: message.id,
        tenantId,
        phoneNumberId: conversation.number.phoneNumberId,
        to: conversation.contact.phone,
        type: "TEXT",
        body: result.content,
      });

      this.logger.log(`AI reply sent for conversation: ${conversationId}`);
    } catch (error: any) {
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
        // In a real app, you would download the file and use a library like pdf-parse
        content = `Extracted text from ${doc.name} (${doc.fileUrl}). The system is fully operational.`;
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
    const key = Buffer.from(this.encryptionKey.slice(0, 32), "utf8");
    const textParts = text.split(":");
    const iv = Buffer.from(textParts.shift()!, "hex");
    const encryptedText = Buffer.from(textParts.join(":"), "hex");
    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  }
}
