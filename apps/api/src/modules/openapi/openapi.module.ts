import { PrismaModule } from "../../prisma/prisma.module";
import { Module } from "@nestjs/common";
import { OpenApiController } from "./openapi.controller";

@Module({
  imports: [PrismaModule],
  controllers: [OpenApiController],
})
export class OpenApiModule {}
