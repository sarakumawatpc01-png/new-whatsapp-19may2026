import { Injectable, OnModuleDestroy, Logger } from "@nestjs/common";
import { Redis } from "ioredis";
import { getEnv } from "@repo/config";

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;

  constructor() {
    this.logger.log(`Initializing Redis connection`);
    const redisUrl = getEnv().REDIS_URL || 'redis://localhost:6379';
    
    this.client = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
      retryStrategy: (times) => {
        if (times > 3) {
          this.logger.error(`Connection failed after 3 attempts. Continuing without Redis.`);
          return null; // Stop retrying
        }
        return Math.min(times * 50, 2000);
      }
    });

    this.client.on('error', (err) => {
      this.logger.warn(`Redis error: ${err.message}. Background tasks may be unavailable.`);
    });
  }

  getClient(): Redis {
    return this.client;
  }

  onModuleDestroy() {
    try {
      this.client.disconnect();
    } catch (e) {
      // Ignore
    }
  }
}

