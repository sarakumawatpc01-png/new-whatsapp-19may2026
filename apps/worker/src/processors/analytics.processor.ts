import { Inject } from "@nestjs/common";
import { Process, Processor } from "@nestjs/bull";
import type { Job } from "bull";
import { PrismaService } from "../prisma/prisma.service";

@Processor("analytics:aggregate")
export class AnalyticsProcessor {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  @Process()
  async handleAggregation(job: Job) {
    const now = new Date();
    const date = new Date(now.setHours(0, 0, 0, 0));

    const tenants = await this.prisma.tenant.findMany({ select: { id: true } });

    for (const tenant of tenants) {
      await this.prisma.analyticsDailyRollup.upsert({
        where: {
          tenantId_date: {
            tenantId: tenant.id,
            date
          }
        },
        update: {
          // Increment or set values based on daily totals
        },
        create: {
          tenantId: tenant.id,
          date,
          messagesSent: 0,
          messagesReceived: 0,
          aiReplies: 0,
          aiTokensUsed: 0,
          aiCostUsd: 0,
          conversationsCreated: 0,
          conversationsResolved: 0,
          contactsCreated: 0,
          campaignsSent: 0,
          automationRuns: 0
        }
      });
    }
  }
}
