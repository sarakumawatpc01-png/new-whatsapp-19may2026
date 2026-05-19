import { PrismaModule } from "../../prisma/prisma.module";
import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bull";
import { WebhookService } from "./webhook.service";

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue({ name: "webhooks" }),
  ],
  providers: [WebhookService],
  exports: [WebhookService],
})
export class WebhooksModule {}
