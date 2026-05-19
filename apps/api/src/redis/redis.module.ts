import { Global, Module } from "@nestjs/common";
import { RedisService } from "./redis.service";

@Global()
@Module({
  providers: [
    {
      provide: 'REDIS_SERVICE',
      useClass: RedisService,
    },
  ],
  exports: ['REDIS_SERVICE'],
})
export class RedisModule {}
