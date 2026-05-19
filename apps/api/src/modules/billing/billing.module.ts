import { PrismaModule } from "../../prisma/prisma.module";
import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bull";
import { PlansService } from "./plans.service";
import { PlansController } from "./plans.controller";
import { SubscriptionsService } from "./subscriptions.service";
import { SubscriptionsController } from "./subscriptions.controller";
import { UsageService } from "./usage.service";
import { UsageController } from "./usage.controller";
import { InvoicesService } from "./invoices.service";
import { InvoicesController } from "./invoices.controller";
import { WebhooksController } from "./webhooks.controller";

@Module({
  imports: [PrismaModule, 
    BullModule.registerQueue({
      name: "billing",
    }),
  ],
  controllers: [
    PlansController,
    SubscriptionsController,
    UsageController,
    InvoicesController,
    WebhooksController,
  ],
  providers: [
    PlansService,
    SubscriptionsService,
    UsageService,
    InvoicesService,
  ],
  exports: [UsageService],
})
export class BillingModule {}
