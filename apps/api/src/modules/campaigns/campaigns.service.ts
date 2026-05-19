import { Injectable, Logger, HttpException, HttpStatus, Inject } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CampaignStatus, CampaignType, MessageStatus } from "@repo/database";
import { InjectQueue } from "@nestjs/bull";
import type { Queue } from "bull";

@Injectable()
export class CampaignsService {
  private readonly logger = new Logger(CampaignsService.name);

  constructor(@Inject(PrismaService) private prisma: PrismaService, @InjectQueue("campaigns") private campaignQueue: Queue
  ) {}

  async findAll(tenantId: string) {
    return this.prisma.campaign.findMany({
      where: { tenantId },
      include: { 
        number: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findOne(tenantId: string, id: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id, tenantId },
      include: { 
        number: true,
        _count: {
          select: { messages: true }
        }
      },
    });
    if (!campaign) throw new HttpException("Campaign not found", HttpStatus.NOT_FOUND);
    return campaign;
  }

  async create(tenantId: string, data: any) {
    return this.prisma.campaign.create({
      data: {
        tenantId,
        numberId: data.numberId,
        name: data.name,
        type: data.type || CampaignType.BROADCAST,
        audienceType: data.audienceType || "all",
        audienceFilter: data.audienceFilter || {},
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
        status: CampaignStatus.DRAFT,
      },
    });
  }

  async update(tenantId: string, id: string, data: any) {
    const campaign = await this.findOne(tenantId, id);
    if (campaign.status !== CampaignStatus.DRAFT) {
      throw new HttpException("Only draft campaigns can be updated", HttpStatus.BAD_REQUEST);
    }
    return this.prisma.campaign.update({
      where: { id, tenantId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.numberId && { numberId: data.numberId }),
        ...(data.audienceType && { audienceType: data.audienceType }),
        ...(data.audienceFilter && { audienceFilter: data.audienceFilter }),
        ...(data.scheduledAt && { scheduledAt: new Date(data.scheduledAt) }),
      },
    });
  }

  async delete(tenantId: string, id: string) {
    const campaign = await this.findOne(tenantId, id);
    if (campaign.status !== CampaignStatus.DRAFT) {
      throw new HttpException("Only draft campaigns can be deleted", HttpStatus.BAD_REQUEST);
    }
    return this.prisma.campaign.delete({
      where: { id, tenantId },
    });
  }

  async launch(tenantId: string, id: string, templateId: string) {
    const campaign = await this.findOne(tenantId, id);
    if (campaign.status !== CampaignStatus.DRAFT && campaign.status !== CampaignStatus.SCHEDULED) {
      throw new HttpException("Campaign cannot be launched in current status", HttpStatus.BAD_REQUEST);
    }

    const contactIds = await this.resolveAudience(tenantId, campaign);
    if (contactIds.length === 0) {
      throw new HttpException("No eligible contacts found for this campaign", HttpStatus.BAD_REQUEST);
    }

    await this.prisma.campaign.update({
      where: { id },
      data: {
        status: CampaignStatus.RUNNING,
        startedAt: new Date(),
        totalRecipients: contactIds.length,
      }
    });

    await this.prisma.campaignMessage.createMany({
      data: contactIds.map(contactId => ({
        campaignId: id,
        contactId,
        templateId,
        status: MessageStatus.PENDING,
      })),
      skipDuplicates: true,
    });

    await this.campaignQueue.add("process-campaign", {
      campaignId: id,
      tenantId,
    });

    return { success: true, recipientsCount: contactIds.length };
  }

  async pause(tenantId: string, id: string) {
    const campaign = await this.findOne(tenantId, id);
    if (campaign.status !== CampaignStatus.RUNNING) {
      throw new HttpException("Only running campaigns can be paused", HttpStatus.BAD_REQUEST);
    }
    return this.prisma.campaign.update({
      where: { id },
      data: { status: CampaignStatus.PAUSED }
    });
  }

  async resume(tenantId: string, id: string) {
    const campaign = await this.findOne(tenantId, id);
    if (campaign.status !== CampaignStatus.PAUSED) {
      throw new HttpException("Only paused campaigns can be resumed", HttpStatus.BAD_REQUEST);
    }
    
    await this.prisma.campaign.update({
      where: { id },
      data: { status: CampaignStatus.RUNNING }
    });

    await this.campaignQueue.add("process-campaign", {
      campaignId: id,
      tenantId,
    });

    return { success: true };
  }

  async cancel(tenantId: string, id: string) {
    const campaign = await this.findOne(tenantId, id);
    return this.prisma.campaign.update({
      where: { id },
      data: { status: CampaignStatus.CANCELLED }
    });
  }

  private async resolveAudience(tenantId: string, campaign: any): Promise<string[]> {
    const where: any = {
      tenantId,
      optedOut: false,
    };

    if (campaign.audienceType === "tag") {
      const tagId = campaign.audienceFilter?.tagId;
      if (tagId) {
        where.contactTags = { some: { tagId } };
      }
    }

    const contacts = await this.prisma.contact.findMany({
      where,
      select: { id: true }
    });

    return contacts.map((c: any) => c.id);
  }
}
