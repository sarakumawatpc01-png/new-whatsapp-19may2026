import { Injectable, Logger, Inject } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { InjectQueue } from "@nestjs/bull";
import { type Queue } from "bull";
import { RedisService } from "../../redis/redis.service";
import { MessageDirection, MessageStatus, MessageType, MessageSender, ConversationStatus } from "@repo/database";

@Injectable()
export class InboxService {
  private readonly logger = new Logger(InboxService.name);

  constructor(@Inject(PrismaService) private prisma: PrismaService, @Inject('REDIS_SERVICE') private redisService: RedisService,
    @InjectQueue("whatsapp") private whatsappQueue: Queue
  ) {}

  async getConversations(tenantId: string, filters: any) {
    const { status, assignedToId, numberId, tag, search, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * Number(limit);
    const take = Number(limit);

    const where: any = { tenantId };

    if (status) where.status = status;
    if (assignedToId) {
      if (assignedToId === "unassigned") where.assignedToId = null;
      else if (assignedToId === "me") { /* handled by controller or passed as ID */ }
      else where.assignedToId = assignedToId;
    }
    if (numberId) where.numberId = numberId;
    if (tag) {
      where.contact = {
        tags: { some: { tag: { name: tag } } }
      };
    }

    if (search) {
      where.OR = [
        { contact: { name: { contains: search, mode: "insensitive" } } },
        { contact: { phone: { contains: search } } },
        { messages: { some: { body: { contains: search, mode: "insensitive" } } } }
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where,
        include: {
          contact: { include: { tags: { include: { tag: true } } } },
          assignedTo: { select: { id: true, name: true, avatar: true } },
          number: { select: { id: true, displayPhone: true, verifiedName: true } },
          _count: {
            select: {
              messages: {
                where: { readAt: null, direction: MessageDirection.INBOUND },
              },
            },
          },
        },
        orderBy: { lastMessageAt: "desc" },
        skip,
        take,
      }),
      this.prisma.conversation.count({ where }),
    ]);

    return { items, total, page: Number(page), limit: take };
  }

  async getConversation(tenantId: string, id: string) {
    return this.prisma.conversation.findUnique({
      where: { id, tenantId },
      include: {
        contact: { include: { tags: { include: { tag: true } } } },
        assignedTo: { select: { id: true, name: true, avatar: true } },
        number: true,
        messages: {
          orderBy: { createdAt: "desc" },
          take: 50,
        },
      },
    });
  }

  async updateConversation(tenantId: string, id: string, data: any) {
    const { status, assignedToId, aiEnabled, aiPaused, snoozedUntil, resolvedAt } = data;
    return this.prisma.conversation.update({
      where: { id, tenantId },
      data: {
        ...(status && { status }),
        ...(assignedToId !== undefined && { assignedToId }),
        ...(aiEnabled !== undefined && { aiEnabled }),
        ...(aiPaused !== undefined && { aiPaused }),
        ...(snoozedUntil !== undefined && { snoozedUntil }),
        ...(resolvedAt !== undefined && { resolvedAt }),
      },
      include: { contact: true, assignedTo: { select: { id: true, name: true, avatar: true } }, number: true }
    });
  }

  async assignAgent(tenantId: string, id: string, userId: string | null) {
    return this.prisma.conversation.update({
      where: { id, tenantId },
      data: { assignedToId: userId },
      include: { assignedTo: { select: { id: true, name: true, avatar: true } } }
    });
  }

  async snooze(tenantId: string, id: string, until: Date) {
    return this.prisma.conversation.update({
      where: { id, tenantId },
      data: {
        status: ConversationStatus.SNOOZED,
        snoozedUntil: until,
      },
      include: { contact: true, assignedTo: { select: { id: true, name: true, avatar: true } }, number: true }
    });
  }

  async getMessages(tenantId: string, conversationId: string, cursor?: string, limit = 50) {
    return this.prisma.message.findMany({
      where: { conversationId, tenantId },
      take: Number(limit),
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: "desc" },
    });
  }

  async sendMessage(tenantId: string, params: { conversationId: string; type: MessageType; body: string; mediaUrl?: string }) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: params.conversationId, tenantId },
      include: { number: { include: { account: true } }, contact: true },
    });

    if (!conversation) throw new Error("Conversation not found");

    const message = await this.prisma.message.create({
      data: {
        tenantId,
        conversationId: conversation.id,
        numberId: conversation.numberId,
        direction: MessageDirection.OUTBOUND,
        senderType: MessageSender.AGENT,
        type: params.type,
        body: params.body,
        mediaUrl: params.mediaUrl,
        status: MessageStatus.PENDING,
      },
    });

    await this.whatsappQueue.add("outgoing", {
      messageId: message.id,
      tenantId,
      phoneNumberId: conversation.number.phoneNumberId,
      to: conversation.contact.phone,
      type: params.type,
      body: params.body,
      mediaUrl: params.mediaUrl,
    }, {
      attempts: 3,
      backoff: { type: "exponential", delay: 2000 },
    });

    return message;
  }

  async addNote(tenantId: string, conversationId: string, authorId: string, content: string) {
    const note = await this.prisma.conversationNote.create({
      data: {
        tenantId,
        conversationId,
        authorId,
        content,
      },
    });
    
    // Fetch author manually since relation might be missing in schema
    const author = await this.prisma.user.findUnique({
      where: { id: authorId },
      select: { id: true, name: true, avatar: true }
    });

    return { ...note, author };
  }

  async setTyping(conversationId: string, agentName: string) {
    const redis = this.redisService.getClient();
    const key = `typing:${conversationId}:${agentName}`;
    await redis.set(key, "1", "EX", 3);
  }

  async registerViewer(conversationId: string, agentId: string) {
    const redis = this.redisService.getClient();
    const key = `viewers:${conversationId}:${agentId}`;
    await redis.set(key, "1", "EX", 30);
  }

  async getViewers(conversationId: string): Promise<string[]> {
    const redis = this.redisService.getClient();
    const keys = await redis.keys(`viewers:${conversationId}:*`);
    return keys.map(k => k.split(":").pop()!);
  }
}
