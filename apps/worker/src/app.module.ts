import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bull";
import { getEnv } from "@repo/config";
import { PrismaModule } from "./prisma/prisma.module";
import { WhatsAppProcessor } from "./processors/whatsapp.processor";
import { AIProcessor } from "./processors/ai.processor";
import { AutomationProcessor } from "./processors/automation.processor";
import { TriggerMatcherService } from "./processors/trigger-matcher.service";
import { CampaignProcessor } from "./processors/campaign.processor";
import { BillingProcessor } from "./processors/billing.processor";
import { AnalyticsProcessor } from "./processors/analytics.processor";
import { NotificationProcessor } from "./processors/notification.processor";
import { WebhookProcessor } from "./processors/webhook.processor";
import { EmailProcessor } from "./processors/email.processor";
import { RedisModule } from "./redis/redis.module";
import { RealtimePublisher } from "./realtime/realtime.publisher";
import { URL } from "url";

@Module({
  imports: [
    BullModule.forRoot({
      redis: {
        host: new URL(getEnv().REDIS_URL).hostname,
        port: parseInt(new URL(getEnv().REDIS_URL).port),
      },
    }),
    BullModule.registerQueue(
      { name: "whatsapp" },
      { name: "ai" },
      { name: "automations" },
      { name: "campaigns" },
      { name: "billing" },
      { name: "analytics:aggregate" },
      { name: "notifications:send" },
      { name: "email:send" },
      { name: "webhooks" },
    ),
    RedisModule,
    PrismaModule,
  ],
  controllers: [],
  providers: [
    WhatsAppProcessor,
    AIProcessor,
    AutomationProcessor,
    TriggerMatcherService,
    CampaignProcessor,
    BillingProcessor,
    AnalyticsProcessor,
    NotificationProcessor,
    WebhookProcessor,
    EmailProcessor,
    RealtimePublisher,
  ],
})
export class AppModule {}
