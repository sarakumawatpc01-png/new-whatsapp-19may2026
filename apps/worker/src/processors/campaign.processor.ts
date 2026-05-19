import { InjectQueue, Process, Processor } from "@nestjs/bull";
import { Logger, Inject } from "@nestjs/common";
import { type Job, type Queue } from "bull";
import { PrismaService } from "../prisma/prisma.service";
import { CampaignStatus, MessageStatus } from "@repo/database";

@Processor("campaigns")
export class CampaignProcessor {
  private readonly logger = new Logger(CampaignProcessor.name);

  constructor(@Inject(PrismaService) private prisma: PrismaService, @InjectQueue("whatsapp") private whatsappQueue: Queue
  ) {}

  @Process("process-campaign")
  async handleProcessCampaign(job: Job<any>) {
    const { campaignId, tenantId } = job.data;
    this.logger.log(`Processing campaign messages for: ${campaignId}`);

    try {
      const campaign = await this.prisma.campaign.findUnique({
        where: { id: campaignId, tenantId },
        include: { number: true }
      });

      if (!campaign || campaign.status !== CampaignStatus.RUNNING) {
        this.logger.log(`Campaign ${campaignId} is not in RUNNING status. Skipping.`);
        return;
      }

      // Fetch a batch of pending messages
      const pendingMessages = await this.prisma.campaignMessage.findMany({
        where: {
          campaignId,
          status: MessageStatus.PENDING,
        },
        include: {
          contact: true,
          template: true,
        },
        take: 50, // Process in batches of 50
      });

      if (pendingMessages.length === 0) {
        // Check if all messages are done
        const remaining = await this.prisma.campaignMessage.count({
          where: { campaignId, status: MessageStatus.PENDING }
        });

        if (remaining === 0) {
          await this.prisma.campaign.update({
            where: { id: campaignId },
            data: { status: CampaignStatus.COMPLETED, completedAt: new Date() }
          });
          this.logger.log(`Campaign ${campaignId} marked as COMPLETED.`);
        }
        return;
      }

      for (const msg of pendingMessages) {
        // Re-check campaign status inside loop to handle pauses
        const currentCampaign = await this.prisma.campaign.findUnique({
           where: { id: campaignId },
           select: { status: true }
        });
        if (currentCampaign?.status !== CampaignStatus.RUNNING) break;

        try {
          // Push to WhatsApp queue for actual sending
          await this.whatsappQueue.add("outgoing", {
            tenantId,
            to: msg.contact.phone,
            type: "TEMPLATE",
            templateName: msg.template.name,
            languageCode: msg.template.language || "en_US",
            components: msg.variables || [],
            campaignId,
            campaignMessageId: msg.id,
          }, { 
            delay: Math.floor(Math.random() * 2000), // Tiny jitter
            attempts: 3,
            backoff: 5000
          });

          await this.prisma.campaignMessage.update({
            where: { id: msg.id },
            data: { status: MessageStatus.SENT, sentAt: new Date() }
          });

        } catch (e: any) {
          this.logger.error(`Failed to queue campaign message ${msg.id}: ${e.message}`);
          await this.prisma.campaignMessage.update({
            where: { id: msg.id },
            data: { status: MessageStatus.FAILED, failureReason: e.message }
          });
        }
      }

      // Re-queue the job to process the next batch if still running
      const stillRunning = await this.prisma.campaign.findUnique({
        where: { id: campaignId },
        select: { status: true }
      });

      if (stillRunning?.status === CampaignStatus.RUNNING) {
        await job.queue.add("process-campaign", { campaignId, tenantId }, { delay: 5000 });
      }

    } catch (error: any) {
      this.logger.error(`Campaign processor failed: ${error.stack}`);
    }
  }
}
