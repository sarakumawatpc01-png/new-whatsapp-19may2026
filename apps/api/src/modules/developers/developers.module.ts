import { Module } from "@nestjs/common";
import { DevelopersController } from "./developers.controller";
import { DevelopersService } from "./developers.service";
import { PrismaModule } from "../../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [DevelopersController],
  providers: [DevelopersService],
})
export class DevelopersModule {}
