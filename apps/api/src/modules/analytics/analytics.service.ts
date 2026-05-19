import { Injectable, Inject } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { MessageDirection, ConversationStatus } from "@repo/database";

@Injectable()
export class AnalyticsService {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  async getOverview(tenantId: string) {
    const contactCount = await this.prisma.contact.count({ where: { tenantId } });
    const conversationCount = await this.prisma.conversation.count({ where: { tenantId } });
    const messageCount = await this.prisma.message.count({ where: { tenantId } });

    // Real AI resolution rate from conversations
    const resolvedByAI = await this.prisma.conversation.count({
      where: { tenantId, status: ConversationStatus.RESOLVED, aiEnabled: true },
    });
    const totalResolved = await this.prisma.conversation.count({
      where: { tenantId, status: ConversationStatus.RESOLVED },
    });
    const aiResolutionRate = totalResolved > 0
      ? Math.round((resolvedByAI / totalResolved) * 100)
      : 0;

    // Real avg response time from messages (outbound replies within 24h of inbound)
    const recentOutbound = await this.prisma.message.findMany({
      where: {
        tenantId,
        direction: MessageDirection.OUTBOUND,
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
      select: { conversationId: true, createdAt: true },
      orderBy: { createdAt: "asc" },
      take: 200,
    });

    let totalResponseMs = 0;
    let responseCount = 0;
    for (const outMsg of recentOutbound) {
      const lastInbound = await this.prisma.message.findFirst({
        where: {
          tenantId,
          conversationId: outMsg.conversationId,
          direction: MessageDirection.INBOUND,
          createdAt: { lt: outMsg.createdAt },
        },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      });
      if (lastInbound) {
        const diff = outMsg.createdAt.getTime() - lastInbound.createdAt.getTime();
        if (diff < 24 * 60 * 60 * 1000) {
          totalResponseMs += diff;
          responseCount++;
        }
      }
    }
    const avgResponseMs = responseCount > 0 ? totalResponseMs / responseCount : 0;
    const avgResponseMin = Math.floor(avgResponseMs / 60000);
    const avgResponseSec = Math.floor((avgResponseMs % 60000) / 1000);
    const avgResponseTime = responseCount > 0
      ? `${avgResponseMin}m ${avgResponseSec}s`
      : "N/A";

    // Growth: compare last 7 days vs previous 7 days
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const [contactsThisWeek, contactsLastWeek] = await Promise.all([
      this.prisma.contact.count({ where: { tenantId, createdAt: { gte: sevenDaysAgo } } }),
      this.prisma.contact.count({ where: { tenantId, createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo } } }),
    ]);
    const [convsThisWeek, convsLastWeek] = await Promise.all([
      this.prisma.conversation.count({ where: { tenantId, createdAt: { gte: sevenDaysAgo } } }),
      this.prisma.conversation.count({ where: { tenantId, createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo } } }),
    ]);
    const [msgsThisWeek, msgsLastWeek] = await Promise.all([
      this.prisma.message.count({ where: { tenantId, createdAt: { gte: sevenDaysAgo } } }),
      this.prisma.message.count({ where: { tenantId, createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo } } }),
    ]);

    const growthPct = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? "+100%" : "0%";
      const pct = Math.round(((current - previous) / previous) * 100);
      return pct >= 0 ? `+${pct}%` : `${pct}%`;
    };

    return {
      totalContacts: contactCount,
      totalConversations: conversationCount,
      totalMessages: messageCount,
      aiResolutionRate: `${aiResolutionRate}%`,
      avgResponseTime,
      growth: {
        contacts: growthPct(contactsThisWeek, contactsLastWeek),
        conversations: growthPct(convsThisWeek, convsLastWeek),
        messages: growthPct(msgsThisWeek, msgsLastWeek),
      },
    };
  }

  async getDailyRollup(tenantId: string, days: number = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // Try to fetch from AnalyticsDailyRollup first
    const rollups = await this.prisma.analyticsDailyRollup.findMany({
      where: {
        tenantId,
        date: { gte: startDate },
      },
      orderBy: { date: "asc" },
    });

    if (rollups.length > 0) {
      return rollups.map((r: any) => ({
        date: r.date.toISOString().split("T")[0],
        inbound: r.messagesReceived,
        outbound: r.messagesSent,
        aiHandled: r.aiReplies,
      }));
    }

    // Fallback: compute from raw message data
    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const dayStart = new Date();
      dayStart.setDate(dayStart.getDate() - i);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      const [inbound, outbound, aiHandled] = await Promise.all([
        this.prisma.message.count({
          where: { tenantId, direction: MessageDirection.INBOUND, createdAt: { gte: dayStart, lte: dayEnd } },
        }),
        this.prisma.message.count({
          where: { tenantId, direction: MessageDirection.OUTBOUND, createdAt: { gte: dayStart, lte: dayEnd } },
        }),
        this.prisma.message.count({
          where: { tenantId, senderType: "AI" as any, createdAt: { gte: dayStart, lte: dayEnd } },
        }),
      ]);

      data.push({
        date: dayStart.toISOString().split("T")[0],
        inbound,
        outbound,
        aiHandled,
      });
    }
    return data;
  }
}

