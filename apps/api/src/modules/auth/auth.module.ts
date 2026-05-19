import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtStrategy } from "./jwt.strategy";
import { JwtAuthGuard, RolesGuard } from "./guards";
import { PrismaModule } from "../../prisma/prisma.module";
import { RedisModule } from "../../redis/redis.module";
import { PassportModule } from "@nestjs/passport";
import { BullModule } from "@nestjs/bull";

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: "jwt" }),
    BullModule.registerQueue({ name: "email:send" }),
    PrismaModule,
    RedisModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtAuthGuard, RolesGuard],
  exports: [JwtAuthGuard, RolesGuard],
})
export class AuthModule {}
