import { PrismaModule } from "../../prisma/prisma.module";
import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bull";
import { WhatsAppController } from "./whatsapp.controller";
import { WhatsAppService } from "./whatsapp.service";

@Module({
  imports: [PrismaModule, 
    BullModule.registerQueue({
      name: "whatsapp",
    }),
  ],
  controllers: [WhatsAppController],
  providers: [WhatsAppService],
  exports: [WhatsAppService],
})
export class WhatsAppModule {}
