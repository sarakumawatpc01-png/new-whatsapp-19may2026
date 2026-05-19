import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bull";
import { getEnv } from "@repo/config";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./modules/auth/auth.module";
import { BootstrapModule } from "./modules/bootstrap/bootstrap.module";
import { WhatsAppModule } from "./modules/whatsapp/whatsapp.module";
import { InboxModule } from "./modules/inbox/inbox.module";
import { AIModule } from "./modules/ai/ai.module";
import { AutomationsModule } from "./modules/automations/automations.module";
import { ContactsModule } from "./modules/contacts/contacts.module";
import { CampaignsModule } from "./modules/campaigns/campaigns.module";
import { BillingModule } from "./modules/billing/billing.module";
import { AdminModule } from "./modules/admin/admin.module";
import { WhitelabelModule } from "./modules/whitelabel/whitelabel.module";
import { AppAnalyticsModule } from "./modules/analytics/analytics.module";
import { DevelopersModule } from "./modules/developers/developers.module";
import { OpenApiModule } from "./modules/openapi/openapi.module";
import { WebhooksModule } from "./modules/webhooks/webhook.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { SystemModule } from "./modules/system/system.module";
import { RedisModule } from "./redis/redis.module";
import { AuditLogInterceptor } from "./middleware/audit-log.interceptor";
import { URL } from "url";

import { MiddlewareConsumer, NestModule } from "@nestjs/common";
import { DomainMiddleware } from "./middleware/domain.middleware";
import { RateLimitMiddleware } from "./middleware/rate-limit.middleware";

@Module({
  imports: [
    BullModule.forRoot({
      redis: {
        host: new URL(getEnv().REDIS_URL).hostname,
        port: parseInt(new URL(getEnv().REDIS_URL).port),
        maxRetriesPerRequest: null,
        retryStrategy: (times) => {
          return 5000; // Keep retrying quietly every 5s instead of throwing
        }
      },
    }),
    RedisModule,
    PrismaModule,
    AuthModule,
    BootstrapModule,
    WhatsAppModule,
    InboxModule,
    AIModule,
    AutomationsModule,
    ContactsModule,
    CampaignsModule,
    BillingModule,
    AdminModule,
    WhitelabelModule,
    AppAnalyticsModule,
    DevelopersModule,
    OpenApiModule,
    WebhooksModule,
    NotificationsModule,
    SystemModule,
  ],
  providers: [
    {
      provide: "APP_INTERCEPTOR",
      useClass: AuditLogInterceptor,
    }
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(DomainMiddleware).forRoutes("*");
    consumer.apply(RateLimitMiddleware).forRoutes("openapi");
  }
}
