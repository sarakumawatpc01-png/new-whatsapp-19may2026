import { Injectable, Inject } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class UsageService {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  async getUsage(tenantId: string) {
    const sub = await this.prisma.subscription.findFirst({
      where: { tenantId },
      include: { plan: true },
    });

    if (!sub || !sub.plan) {
      return {
        aiTokens: { used: 0, limit: 0, percentage: 0 },
        messages: { used: 0, limit: 0, percentage: 0 },
        conversations: { used: 0, limit: 0, percentage: 0 },
        storage: { used: 0, limit: 0, percentage: 0 },
      };
    }

    // In a real app, these would be fetched from usage logs or denormalized counters
    // Using placeholders for now
    const plan = sub.plan as any;
    
    // Fetch actual counts
    const messageCount = await this.prisma.message.count({ where: { tenantId } });
    const conversationCount = await this.prisma.conversation.count({ where: { tenantId } });
    
    return {
      aiTokens: { 
        used: 45000, 
        limit: plan.aiTokenLimit || 100000, 
        percentage: Math.min(100, (45000 / (plan.aiTokenLimit || 100000)) * 100) 
      },
      messages: { 
        used: messageCount, 
        limit: plan.messageLimit || 5000, 
        percentage: Math.min(100, (messageCount / (plan.messageLimit || 5000)) * 100) 
      },
      conversations: { 
        used: conversationCount, 
        limit: plan.conversationLimit || 500, 
        percentage: Math.min(100, (conversationCount / (plan.conversationLimit || 500)) * 100) 
      },
      storage: { 
        used: 120, // MB
        limit: plan.storageLimit || 1024, 
        percentage: Math.min(100, (120 / (plan.storageLimit || 1024)) * 100) 
      },
    };
  }
}
