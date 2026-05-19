import { Injectable, Logger } from "@nestjs/common";
import { RedisService } from "../redis/redis.service";

interface RealtimePayload {
  event: string;
  data: any;
}

@Injectable()
export class RealtimePublisher {
  private readonly logger = new Logger(RealtimePublisher.name);

  constructor(private redisService: RedisService) {}

  async publish(tenantId: string, event: string, data: any) {
    const payload: RealtimePayload = { event, data };
    try {
      await this.redisService
        .getClient()
        .publish(`inbox:tenant:${tenantId}`, JSON.stringify(payload));
    } catch (error: any) {
      this.logger.warn(`Realtime publish failed: ${error.message}`);
    }
  }
}
