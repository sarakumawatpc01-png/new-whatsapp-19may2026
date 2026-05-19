import { PrismaModule } from "../../prisma/prisma.module";
import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bull";
import { CampaignsController } from "./campaigns.controller";
import { CampaignsService } from "./campaigns.service";
import { TemplatesController } from "./templates.controller";
import { TemplatesService } from "./templates.service";
import { WhatsAppModule } from "../whatsapp/whatsapp.module";

@Module({
  imports: [PrismaModule, 
    WhatsAppModule,
    BullModule.registerQueue({
      name: "campaigns",
    }),
  ],
  controllers: [CampaignsController, TemplatesController],
  providers: [CampaignsService, TemplatesService],
  exports: [CampaignsService, TemplatesService],
})
export class CampaignsModule {}
