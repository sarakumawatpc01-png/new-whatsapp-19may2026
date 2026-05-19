import { RedisModule } from "../../redis/redis.module";
import { PrismaModule } from "../../prisma/prisma.module";
import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bull";
import { InboxController } from "./inbox.controller";
import { InboxService } from "./inbox.service";
import { InboxGateway } from "../../gateways/inbox.gateway";

@Module({
  imports: [RedisModule, PrismaModule, 
    BullModule.registerQueue({
      name: "whatsapp",
    }),
  ],
  controllers: [InboxController],
  providers: [InboxService, InboxGateway],
  exports: [InboxService, InboxGateway],
})
export class InboxModule {}
