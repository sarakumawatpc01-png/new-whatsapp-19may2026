import { Injectable, Logger, HttpException, HttpStatus, Inject } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { WhatsAppService } from "../whatsapp/whatsapp.service";
import axios from "axios";
import { TemplateStatus, TemplateCategory } from "@repo/database";

@Injectable()
export class TemplatesService {
  private readonly logger = new Logger(TemplatesService.name);

  constructor(@Inject(PrismaService) private prisma: PrismaService, @Inject(WhatsAppService) private whatsappService: WhatsAppService) {}

  async findAll(tenantId: string) {
    return this.prisma.whatsAppTemplate.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
  }

  async findOne(tenantId: string, id: string) {
    const template = await this.prisma.whatsAppTemplate.findUnique({
      where: { id, tenantId },
    });
    if (!template) throw new HttpException("Template not found", HttpStatus.NOT_FOUND);
    return template;
  }

  async create(tenantId: string, data: any) {
    return this.prisma.whatsAppTemplate.create({
      data: {
        ...data,
        tenantId,
        status: TemplateStatus.DRAFT,
      },
    });
  }

  async update(tenantId: string, id: string, data: any) {
    const template = await this.findOne(tenantId, id);
    if (template.status !== TemplateStatus.DRAFT && template.status !== TemplateStatus.REJECTED) {
      throw new HttpException("Only draft or rejected templates can be updated", HttpStatus.BAD_REQUEST);
    }
    return this.prisma.whatsAppTemplate.update({
      where: { id, tenantId },
      data,
    });
  }

  async delete(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    return this.prisma.whatsAppTemplate.delete({
      where: { id, tenantId },
    });
  }

  async submitToMeta(tenantId: string, id: string) {
    const template = await this.findOne(tenantId, id);
    const whatsappNumber = await this.prisma.whatsAppNumber.findFirst({
      where: { tenantId, status: "ACTIVE" },
      include: { account: true },
    });

    if (!whatsappNumber) {
      throw new HttpException("No active WhatsApp number found for tenant", HttpStatus.BAD_REQUEST);
    }

    const token = this.whatsappService.decrypt(whatsappNumber.account.accessToken);
    const url = `https://graph.facebook.com/v18.0/${whatsappNumber.account.wabaId}/message_templates`;

    try {
      const response = await axios.post(url, {
        name: template.name,
        category: template.category,
        language: template.language,
        components: template.header ? [
          { type: "HEADER", ...(template.header as any) },
          { type: "BODY", text: template.body },
          ...(template.footer ? [{ type: "FOOTER", text: template.footer }] : []),
          ...(template.buttons ? [{ type: "BUTTONS", buttons: template.buttons }] : []),
        ] : [
          { type: "BODY", text: template.body },
        ],
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      return this.prisma.whatsAppTemplate.update({
        where: { id },
        data: {
          metaTemplateId: response.data.id,
          status: TemplateStatus.PENDING_APPROVAL,
        },
      });
    } catch (e: any) {
      this.logger.error(`Meta Template Error: ${JSON.stringify(e.response?.data || e.message)}`);
      throw new HttpException(
        e.response?.data?.error?.message || "Failed to submit template to Meta",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async syncStatus(tenantId: string, id: string) {
    const template = await this.findOne(tenantId, id);
    if (!template.metaTemplateId) {
      throw new HttpException("Template not yet submitted to Meta", HttpStatus.BAD_REQUEST);
    }

    const whatsappNumber = await this.prisma.whatsAppNumber.findFirst({
      where: { tenantId, status: "ACTIVE" },
      include: { account: true },
    });

    if (!whatsappNumber) {
      throw new HttpException("No active WhatsApp number", HttpStatus.BAD_REQUEST);
    }

    const token = this.whatsappService.decrypt(whatsappNumber.account.accessToken);
    const url = `https://graph.facebook.com/v18.0/${template.metaTemplateId}`;

    try {
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const metaStatus = response.data.status;
      let status: any = TemplateStatus.PENDING_APPROVAL;
      if (metaStatus === "APPROVED") status = TemplateStatus.APPROVED;
      if (metaStatus === "REJECTED") status = TemplateStatus.REJECTED;
      if (metaStatus === "DISABLED") status = TemplateStatus.DISABLED;

      return this.prisma.whatsAppTemplate.update({
        where: { id },
        data: {
          status,
          rejectionReason: response.data.rejection_reason || null,
        },
      });
    } catch (e: any) {
      this.logger.error(`Meta Sync Error: ${JSON.stringify(e.response?.data || e.message)}`);
      throw new HttpException("Failed to sync status from Meta", HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
