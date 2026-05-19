import { PrismaModule } from "../../prisma/prisma.module";
import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bull";
import { AIController } from "./ai.controller";
import { AIService } from "./ai.service";
import { VectorService } from "./vector.service";
import { AIProcessor } from "./ai.processor";

@Module({
  imports: [PrismaModule, 
    BullModule.registerQueue({
      name: "ai",
    }),
  ],
  controllers: [AIController],
  providers: [AIService, VectorService, AIProcessor],
  exports: [AIService, VectorService],
})
export class AIModule {}
