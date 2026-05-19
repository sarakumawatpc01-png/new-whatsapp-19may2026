import { Inject } from "@nestjs/common";
import { Process, Processor } from "@nestjs/bull";
import type { Job, Queue } from "bull";
import { PrismaService } from "../prisma/prisma.service";
import { InjectQueue } from "@nestjs/bull";

@Processor("notifications:send")
export class NotificationProcessor {
  constructor(@Inject(PrismaService) private prisma: PrismaService, @InjectQueue("email:send") private emailQueue: Queue,
    @InjectQueue("whatsapp") private whatsappQueue: Queue
  ) {}

  @Process("send")
  async handleSend(job: Job<any>) {
    const { tenantId, userId, type, title, body, data, channels: forcedChannels } = job.data;

    // 1. Load user preferences
    const preferences = await this.prisma.notificationPreference.findUnique({
      where: { userId_notificationType: { userId, notificationType: type } }
    });

    // 2. Determine channels
    const channels = forcedChannels || [];
    if (preferences) {
      if (preferences.inApp) channels.push("in_app");
      if (preferences.email) channels.push("email");
      if (preferences.whatsapp) channels.push("whatsapp");
    } else if (!forcedChannels) {
      channels.push("in_app");
    }

    const uniqueChannels = channels.filter((v: string, i: number, a: string[]) => a.indexOf(v) === i);

    for (const channel of uniqueChannels) {
      try {
        if (channel === "in_app") {
          await this.prisma.notification.create({
            data: {
              tenantId,
              userId,
              type,
              title,
              body,
              data: data || {},
              read: false,
            }
          });
        } else if (channel === "email") {
          await this.emailQueue.add("send", {
            tenantId,
            userId,
            template: type,
            title,
            body,
            data
          });
        } else if (channel === "whatsapp") {
          // Send via WhatsApp logic if needed
        }
      } catch (error) {
        console.error(`Failed to send notification via ${channel}:`, error);
      }
    }
  }
}
