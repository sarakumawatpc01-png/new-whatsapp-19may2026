import { PrismaModule } from "../../prisma/prisma.module";
import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bull";
import { HealthController } from "./health.controller";

@Module({
  imports: [PrismaModule, 
    BullModule.registerQueue({ name: "whatsapp" }),
  ],
  controllers: [HealthController],
})
export class SystemModule {}
