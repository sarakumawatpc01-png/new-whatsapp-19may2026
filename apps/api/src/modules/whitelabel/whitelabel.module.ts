import { Module } from "@nestjs/common";
import { WhitelabelController } from "./whitelabel.controller";
import { WhitelabelService } from "./whitelabel.service";
import { PrismaModule } from "../../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [WhitelabelController],
  providers: [WhitelabelService],
})
export class WhitelabelModule {}
