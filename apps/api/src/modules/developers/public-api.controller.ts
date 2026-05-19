import { Controller, Get, Post, Body, Param, UseGuards, Req, Query, Inject } from "@nestjs/common";
import { ApiKeyAuthGuard } from "../auth/guards/api-key-auth.guard";
import { Scopes } from "../auth/decorators";
import { PrismaService } from "../../prisma/prisma.service";
import { InjectQueue } from "@nestjs/bull";
import type { Queue } from "bull";

@Controller("v1")
@UseGuards(ApiKeyAuthGuard)
export class PublicApiController {
  constructor(@Inject(PrismaService) private prisma: PrismaService, @InjectQueue("whatsapp") private whatsappQueue: Queue,
  ) {}

  // ── CONTACTS ────────────────────────────────────────

  @Get("contacts")
  @Scopes("read:contacts")
  async listContacts(@Req() req: any, @Query() query: any) {
    const page = parseInt(query.page) || 1;
    const limit = Math.min(parseInt(query.limit) || 50, 100);
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.contact.findMany({
        where: { tenantId: req.user.tenant_id },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.contact.count({
        where: { tenantId: req.user.tenant_id },
      }),
    ]);

    return {
      success: true,
      data,
      meta: { page, limit, total, hasMore: skip + limit < total },
    };
  }

  @Post("contacts")
  @Scopes("write:contacts")
  async createContact(@Req() req: any, @Body() body: any) {
    const data = await this.prisma.contact.create({
      data: {
        tenantId: req.user.tenant_id,
        name: body.name,
        phone: body.phone || body.phoneNumber,
        email: body.email,
        customFields: body.customFields || {},
      },
    });
    return { success: true, data };
  }

  // ── CONVERSATIONS ───────────────────────────────────

  @Get("conversations")
  @Scopes("read:conversations")
  async listConversations(@Req() req: any, @Query() query: any) {
    const page = parseInt(query.page) || 1;
    const limit = Math.min(parseInt(query.limit) || 50, 100);
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where: { tenantId: req.user.tenant_id },
        skip,
        take: limit,
        orderBy: { lastMessageAt: "desc" },
        include: { contact: true },
      }),
      this.prisma.conversation.count({
        where: { tenantId: req.user.tenant_id },
      }),
    ]);

    return {
      success: true,
      data,
      meta: { page, limit, total, hasMore: skip + limit < total },
    };
  }

  @Get("conversations/:id")
  @Scopes("read:conversations")
  async getConversation(@Req() req: any, @Param("id") id: string) {
    const data = await this.prisma.conversation.findFirst({
      where: { id, tenantId: req.user.tenant_id },
      include: {
        contact: true,
        messages: { take: 50, orderBy: { createdAt: "desc" } },
      },
    });

    if (!data) {
      return { success: false, error: { code: "NOT_FOUND", message: "Conversation not found" } };
    }

    return { success: true, data };
  }

  // ── MESSAGES ────────────────────────────────────────

  @Post("messages/send")
  @Scopes("write:messages")
  async sendMessage(@Req() req: any, @Body() body: any) {
    const { to, type, content, numberId } = body;

    if (!to || !type || !content || !numberId) {
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Required fields: to, type, content, numberId",
        },
      };
    }

    const number = await this.prisma.whatsAppNumber.findFirst({
      where: { id: numberId, tenantId: req.user.tenant_id },
      include: { account: true },
    });

    if (!number) {
      return {
        success: false,
        error: { code: "NUMBER_NOT_FOUND", message: "WhatsApp number not found" },
      };
    }

    await this.whatsappQueue.add("outgoing", {
      tenantId: req.user.tenant_id,
      phoneNumberId: number.phoneNumberId,
      to,
      type,
      body: content,
    }, {
      attempts: 3,
      backoff: { type: "exponential", delay: 2000 },
    });

    return { success: true, data: { status: "queued", to, type } };
  }

  // ── TEMPLATES ───────────────────────────────────────

  @Get("templates")
  @Scopes("read:templates")
  async listTemplates(@Req() req: any) {
    const data = await this.prisma.whatsAppTemplate.findMany({
      where: { tenantId: req.user.tenant_id },
      orderBy: { createdAt: "desc" },
    });
    return { success: true, data };
  }
}
