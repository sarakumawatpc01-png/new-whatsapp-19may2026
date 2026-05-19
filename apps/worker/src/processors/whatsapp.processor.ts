import { Process, Processor } from "@nestjs/bull";
import { Logger, Inject } from "@nestjs/common";
import { type Job } from "bull";
import { InjectQueue } from "@nestjs/bull";
import { type Queue } from "bull";
import { PrismaService } from "../prisma/prisma.service";
import { TriggerMatcherService } from "./trigger-matcher.service";
import { MessageDirection, MessageStatus, MessageType, ConversationStatus, MessageSender } from "@repo/database";

@Processor("whatsapp")
export class WhatsAppProcessor {
  private readonly logger = new Logger(WhatsAppProcessor.name);
  // Simple in-memory dedup set (in production, use Redis SET NX)
  private processedWebhookIds = new Set<string>();

  constructor(
    @Inject(PrismaService) private prisma: PrismaService, 
    private triggerMatcher: TriggerMatcherService,
    @InjectQueue("ai") private aiQueue: Queue,
  ) {}

  @Process("webhook")
  async handleWebhook(job: Job<{ tenantId: string; payload: any }>) {
    const { tenantId, payload } = job.data;
    
    const entry = payload.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;

    if (!value) return;

    if (value.messages) {
      for (const msg of value.messages) {
        await this.processMessage(tenantId, value.metadata.phone_number_id, msg, value.contacts?.[0]);
      }
    }

    if (value.statuses) {
      for (const status of value.statuses) {
        await this.processStatus(tenantId, status);
      }
    }
  }

  private async processMessage(tenantId: string, phoneId: string, msg: any, contactInfo: any) {
    // Idempotency check — skip duplicate webhook deliveries
    const dedupeKey = `msg:${msg.id}`;
    if (this.processedWebhookIds.has(dedupeKey)) {
      this.logger.log(`Skipping duplicate message ${msg.id}`);
      return;
    }
    
    // Check DB for existing message with same whatsappId
    const existing = await this.prisma.message.findFirst({
      where: { whatsappId: msg.id }
    });
    if (existing) {
      this.logger.log(`Message ${msg.id} already processed, skipping`);
      this.processedWebhookIds.add(dedupeKey);
      return;
    }

    const waNumber = await this.prisma.whatsAppNumber.findUnique({
      where: { phoneNumberId: phoneId }
    });

    if (!waNumber) {
      this.logger.error(`WhatsApp number ${phoneId} not found for tenant ${tenantId}`);
      return;
    }

    const contact = await this.prisma.contact.upsert({
      where: { 
        tenantId_phone: { 
          tenantId,
          phone: msg.from,
        } 
      },
      update: { name: contactInfo?.profile?.name },
      create: {
        tenantId,
        phone: msg.from,
        name: contactInfo?.profile?.name || msg.from,
      }
    });

    let conversation = await this.prisma.conversation.findFirst({
      where: {
        tenantId,
        numberId: waNumber.id,
        contactId: contact.id,
        status: { not: ConversationStatus.RESOLVED }
      },
      orderBy: { updatedAt: 'desc' }
    });

    const isNewConversation = !conversation;

    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: {
          tenantId,
          numberId: waNumber.id,
          contactId: contact.id,
          status: ConversationStatus.OPEN,
        }
      });
    }

    const body = msg.text?.body || msg.caption || "";
    const message = await this.prisma.message.create({
      data: {
        tenantId,
        conversationId: conversation.id,
        numberId: waNumber.id,
        whatsappId: msg.id,
        direction: MessageDirection.INBOUND,
        senderType: MessageSender.CONTACT,
        type: this.mapMessageType(msg.type),
        body,
        status: MessageStatus.DELIVERED,
      }
    });

    // Mark as processed for idempotency
    this.processedWebhookIds.add(dedupeKey);
    // Keep set bounded (evict oldest after 10k entries)
    if (this.processedWebhookIds.size > 10000) {
      const first = this.processedWebhookIds.values().next().value;
      if (first) this.processedWebhookIds.delete(first);
    }

    const cswExpiresAt = new Date();
    cswExpiresAt.setHours(cswExpiresAt.getHours() + 24);

    await this.prisma.conversation.update({
      where: { id: conversation.id },
      data: { 
        lastMessageAt: new Date(),
        updatedAt: new Date(),
        cswExpiresAt
      }
    });

    // Trigger automation matching
    await this.triggerMatcher.matchAndExecute(tenantId, "message.received", {
      messageId: message.id,
      conversationId: conversation.id,
      contactId: contact.id,
      content: body,
      from: msg.from,
      numberId: waNumber.id,
    });

    if (isNewConversation) {
      await this.triggerMatcher.matchAndExecute(tenantId, "conversation.created", {
        conversationId: conversation.id,
        contactId: contact.id,
        numberId: waNumber.id,
      });
    }

    // Push to AI processing queue if AI is enabled
    try {
      const aiConfig = await this.prisma.tenantAIConfig.findFirst({
        where: { tenantId }
      });

      const aiEnabled = aiConfig?.autoReply !== false;
      const aiPaused = (conversation as any).aiPaused === true;

      if (aiEnabled && !aiPaused && body) {
        await this.aiQueue.add("process", {
          tenantId,
          conversationId: conversation.id,
          messageId: message.id,
          numberId: waNumber.id,
          contactId: contact.id,
          incomingMessage: body,
          from: msg.from,
        }, {
          jobId: `ai-${message.id}`,
          delay: 500, // Small delay to batch rapid messages
        });
        this.logger.log(`Queued AI processing for message ${msg.id}`);
      }
    } catch (aiErr: any) {
      this.logger.warn(`AI queue push failed (non-critical): ${aiErr.message}`);
    }

    this.logger.log(`Processed inbound message ${msg.id} from ${msg.from}`);
  }

  private async processStatus(tenantId: string, status: any) {
    const message = await this.prisma.message.findFirst({
      where: { whatsappId: status.id }
    });

    if (message) {
      const newStatus = this.mapMessageStatus(status.status);
      await this.prisma.message.update({
        where: { id: message.id },
        data: {
          status: newStatus,
        }
      });
      this.logger.log(`Updated message ${status.id} status to ${status.status}`);

      // Emit WebSocket event for real-time status updates
      // Note: InboxGateway is injected at the module level
      // We emit via a Redis pub/sub or direct reference
      // For now, we can use BullMQ event pattern
      try {
        await this.aiQueue.add("status-update", {
          tenantId,
          conversationId: message.conversationId,
          messageId: message.id,
          status: newStatus,
        }, {
          jobId: `status-${status.id}-${status.status}`,
        }).catch(() => {});
      } catch {
        // Non-critical
      }
    }
  }

  private mapMessageType(type: string): MessageType {
    const map: any = {
      text: MessageType.TEXT,
      image: MessageType.IMAGE,
      video: MessageType.VIDEO,
      audio: MessageType.AUDIO,
      document: MessageType.DOCUMENT,
      sticker: MessageType.STICKER,
      location: MessageType.LOCATION,
      interactive: MessageType.INTERACTIVE,
      template: MessageType.TEMPLATE,
    };
    return map[type] || MessageType.TEXT;
  }

  private mapMessageStatus(status: string): MessageStatus {
    const map: any = {
      sent: MessageStatus.SENT,
      delivered: MessageStatus.DELIVERED,
      read: MessageStatus.READ,
      failed: MessageStatus.FAILED,
    };
    return map[status] || MessageStatus.SENT;
  }
}
