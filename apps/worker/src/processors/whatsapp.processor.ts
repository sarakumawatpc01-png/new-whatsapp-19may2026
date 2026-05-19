import { Process, Processor } from "@nestjs/bull";
import { Logger, Inject } from "@nestjs/common";
import { type Job } from "bull";
import { InjectQueue } from "@nestjs/bull";
import { type Queue } from "bull";
import { PrismaService } from "../prisma/prisma.service";
import { TriggerMatcherService } from "./trigger-matcher.service";
import { MessageDirection, MessageStatus, MessageType, ConversationStatus, MessageSender } from "@repo/database";
import { RealtimePublisher } from "../realtime/realtime.publisher";
import { createEncryptor } from "@repo/shared";
import { getEnv } from "@repo/config";
import { metaClient } from "@repo/whatsapp";

@Processor("whatsapp")
export class WhatsAppProcessor {
  private readonly logger = new Logger(WhatsAppProcessor.name);
  // Simple in-memory dedup set (in production, use Redis SET NX)
  private processedWebhookIds = new Set<string>();
  private readonly encryptor = createEncryptor(getEnv().ENCRYPTION_KEY);

  constructor(
    @Inject(PrismaService) private prisma: PrismaService, 
    private triggerMatcher: TriggerMatcherService,
    @InjectQueue("ai") private aiQueue: Queue,
    private realtime: RealtimePublisher,
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

  @Process("outgoing")
  async handleOutgoing(job: Job<any>) {
    const payload = job.data || {};
    const tenantId = payload.tenantId || payload.tenant_id;

    if (!tenantId) {
      this.logger.error("Outgoing job missing tenantId");
      return;
    }

    const to = payload.to;
    if (!to) {
      throw new Error("Outgoing job missing recipient");
    }

    const type = String(payload.type || "TEXT").toUpperCase();
    const body = payload.body ?? payload.content ?? "";
    const mediaUrl = payload.mediaUrl ?? payload.media_url;
    const templateName = payload.templateName ?? payload.template_name;
    const languageCode = payload.languageCode ?? payload.templateLanguage ?? payload.language ?? "en_US";
    const components = payload.components ?? payload.templateComponents ?? payload.template_components;

    const number = await this.resolveWhatsAppNumber(payload, tenantId);
    if (!number || !number.account?.accessToken) {
      throw new Error("WhatsApp number not found or missing access token");
    }
    if (number.tenantId !== tenantId) {
      throw new Error(`WhatsApp number tenant mismatch for ${tenantId}`);
    }

    const token = this.encryptor.decrypt(number.account.accessToken);

    try {
      let response: any;
      switch (type) {
        case "TEXT":
          response = await metaClient.sendTextMessage(number.phoneNumberId, token, to, body);
          break;
        case "IMAGE":
        case "VIDEO":
        case "AUDIO":
        case "DOCUMENT":
          if (!mediaUrl) throw new Error("Media URL required for media message");
          response = await metaClient.sendMediaMessage(
            number.phoneNumberId,
            token,
            to,
            type.toLowerCase() as any,
            mediaUrl,
            body
          );
          break;
        case "TEMPLATE":
          if (!templateName) throw new Error("Template name required for template message");
          response = await metaClient.sendTemplateMessage(
            number.phoneNumberId,
            token,
            to,
            templateName,
            languageCode,
            components
          );
          break;
        default:
          throw new Error(`Unsupported outgoing message type: ${type}`);
      }

      await this.handleOutgoingSuccess(payload, tenantId, response);
      this.logger.log(`Outgoing message delivered to ${to} (${type})`);
    } catch (error: any) {
      await this.handleOutgoingFailure(payload, tenantId, error);
      this.logger.error(`Outgoing message failed: ${error.message}`);
      throw error;
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

      await this.realtime.publish(tenantId, "message:new", message);
      await this.realtime.publish(tenantId, "conversation:update", {
        id: conversation.id,
        lastMessage: message,
        lastMessageAt: message.createdAt,
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
        await this.aiQueue.add("processing", {
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
      const updated = await this.prisma.message.update({
        where: { id: message.id },
        data: {
          status: newStatus,
          sentAt: newStatus === MessageStatus.SENT ? new Date() : message.sentAt,
          deliveredAt: newStatus === MessageStatus.DELIVERED ? new Date() : message.deliveredAt,
          readAt: newStatus === MessageStatus.READ ? new Date() : message.readAt,
          failedAt: newStatus === MessageStatus.FAILED ? new Date() : message.failedAt,
        }
      });
      this.logger.log(`Updated message ${status.id} status to ${status.status}`);
      await this.realtime.publish(tenantId, "message:update", updated);

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

  private async resolveWhatsAppNumber(payload: any, tenantId: string) {
    const phoneNumberId = payload.phoneNumberId || payload.phone_number_id;
    if (phoneNumberId) {
      const number = await this.prisma.whatsAppNumber.findUnique({
        where: { phoneNumberId },
        include: { account: true },
      });
      if (number) return number;
    }

    if (payload.numberId) {
      const number = await this.prisma.whatsAppNumber.findUnique({
        where: { id: payload.numberId },
        include: { account: true },
      });
      if (number) return number;
    }

    if (payload.messageId) {
      const message = await this.prisma.message.findUnique({
        where: { id: payload.messageId },
        include: { number: { include: { account: true } } },
      });
      if (message?.number) return message.number;
    }

    if (payload.campaignId) {
      const campaign = await this.prisma.campaign.findUnique({
        where: { id: payload.campaignId, tenantId },
        include: { number: { include: { account: true } } },
      });
      if (campaign?.number) return campaign.number;
    }

    return null;
  }

  private async handleOutgoingSuccess(payload: any, tenantId: string, response: any) {
    if (payload.messageId) {
      const updated = await this.prisma.message.update({
        where: { id: payload.messageId },
        data: {
          status: MessageStatus.SENT,
          whatsappId: response?.messages?.[0]?.id,
          sentAt: new Date(),
        },
      });
      await this.prisma.conversation.update({
        where: { id: updated.conversationId },
        data: { lastMessageAt: new Date() },
      });
      await this.realtime.publish(tenantId, "message:update", updated);
      await this.realtime.publish(tenantId, "conversation:update", {
        id: updated.conversationId,
        lastMessage: updated,
        lastMessageAt: updated.createdAt,
      });
    }

    if (payload.campaignMessageId) {
      await this.prisma.campaignMessage.update({
        where: { id: payload.campaignMessageId },
        data: {
          status: MessageStatus.SENT,
          sentAt: new Date(),
        },
      });
    }
  }

  private async handleOutgoingFailure(payload: any, tenantId: string, error: any) {
    if (payload.messageId) {
      const updated = await this.prisma.message.update({
        where: { id: payload.messageId },
        data: {
          status: MessageStatus.FAILED,
          failedAt: new Date(),
          failureReason: error?.message || "Unknown error",
        },
      });
      await this.realtime.publish(tenantId, "message:update", updated);
    }

    if (payload.campaignMessageId) {
      await this.prisma.campaignMessage.update({
        where: { id: payload.campaignMessageId },
        data: {
          status: MessageStatus.FAILED,
          failedAt: new Date(),
          failureReason: error?.message || "Unknown error",
        },
      });
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
