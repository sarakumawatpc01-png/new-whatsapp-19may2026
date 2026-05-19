import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bull";
import { AutomationsController } from "./automations.controller";
import { AutomationsService } from "./automations.service";
import { AutomationProcessor } from "./automation.processor";
import { AIModule } from "../ai/ai.module";
import { WhatsAppModule } from "../whatsapp/whatsapp.module";
import { PrismaModule } from "../../prisma/prisma.module";

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue({
      name: "automations",
    }),
    AIModule,
    WhatsAppModule,
  ],
  controllers: [AutomationsController],
  providers: [AutomationsService, AutomationProcessor],
  exports: [AutomationsService],
})
export class AutomationsModule {}
