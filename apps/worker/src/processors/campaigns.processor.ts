import { Process, Processor } from "@nestjs/bull";
import { Logger, Inject } from "@nestjs/common";
import type { Job } from "bull";
import { PrismaService } from "../prisma/prisma.service";
import axios from "axios";
import { CampaignStatus, MessageStatus } from "@repo/database";
import * as crypto from "crypto";

@Processor("campaigns")
export class CampaignsProcessor {
  private readonly logger = new Logger(CampaignsProcessor.name);

  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  @Process("process-campaign")
  async handleProcess(job: Job<{ campaignId: string; tenantId: string }>) {
    const { campaignId, tenantId } = job.data;
    
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      include: { number: { include: { account: true } } },
    });

    if (!campaign || campaign.status === CampaignStatus.CANCELLED) {
      this.logger.warn(`Campaign ${campaignId} not found or cancelled. Skipping.`);
      return;
    }

    const whatsappNumber = campaign.number;
    if (!whatsappNumber || !whatsappNumber.account?.accessToken) {
      this.logger.error(`Campaign ${campaignId} missing number or access token`);
      return;
    }

    const token = this.decrypt(whatsappNumber.account.accessToken);

    const messages = await this.prisma.campaignMessage.findMany({
      where: { campaignId, status: MessageStatus.PENDING },
      include: { template: true },
      take: 100,
    });

    for (const msg of messages) {
      try {
        const contact = await this.prisma.contact.findUnique({ where: { id: msg.contactId } });
        if (!contact) continue;

        const payload = {
          messaging_product: "whatsapp",
          to: contact.phone,
          type: "template",
          template: {
            name: msg.template.name,
            language: { code: (msg.template as any).language || "en" },
            components: []
          },
        };

        const url = `https://graph.facebook.com/v18.0/${whatsappNumber.phoneNumberId}/messages`;
        await axios.post(url, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });

        await this.prisma.campaignMessage.update({
          where: { id: msg.id },
          data: {
            status: MessageStatus.SENT,
            sentAt: new Date(),
          }
        });

        await this.prisma.campaign.update({
          where: { id: campaignId },
          data: { sent: { increment: 1 } }
        });

      } catch (e: any) {
        this.logger.error(`Failed to send message ${msg.id}: ${e.message}`);
        await this.prisma.campaignMessage.update({
          where: { id: msg.id },
          data: {
            status: MessageStatus.FAILED,
            failedAt: new Date(),
          }
        });
        await this.prisma.campaign.update({
          where: { id: campaignId },
          data: { failed: { increment: 1 } }
        });
      }
    }

    const remaining = await this.prisma.campaignMessage.count({
      where: { campaignId, status: MessageStatus.PENDING }
    });

    if (remaining === 0) {
      await this.prisma.campaign.update({
        where: { id: campaignId },
        data: {
          status: CampaignStatus.COMPLETED,
          completedAt: new Date(),
        }
      });
    }
  }

  private decrypt(text: string): string {
    const key = Buffer.from(process.env.ENCRYPTION_KEY || "fallback-key-at-least-32-chars-long-!!!", "utf8").slice(0, 32);
    const textParts = text.split(":");
    const iv = Buffer.from(textParts.shift()!, "hex");
    const encryptedText = Buffer.from(textParts.join(":"), "hex");
    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  }
}
