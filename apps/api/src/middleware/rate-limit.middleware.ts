import { Injectable, NestMiddleware, HttpException, HttpStatus, Inject } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { RedisService } from "../redis/redis.service";

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  constructor(@Inject('REDIS_SERVICE') private redis: RedisService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const apiKey = req.headers["x-api-key"] as string;
    const ip = req.ip || req.socket.remoteAddress;
    const identifier = apiKey ? `api_key:${apiKey}` : `ip:${ip}`;
    
    const key = `rate_limit:${identifier}`;
    const limit = apiKey ? 100 : 20; // higher limit for API keys
    const window = 60; // 1 minute

    try {
      const current = await this.redis.getClient().incr(key);
      if (current === 1) {
        await this.redis.getClient().expire(key, window);
      }

      if (current > limit) {
        throw new HttpException("Too Many Requests", HttpStatus.TOO_MANY_REQUESTS);
      }

      res.setHeader("X-RateLimit-Limit", limit);
      res.setHeader("X-RateLimit-Remaining", Math.max(0, limit - current));
    } catch (e: any) {
      if (e instanceof HttpException) throw e;
      console.warn(`⚠️ RateLimitMiddleware Redis error: ${e.message}`);
    }

    next();
  }
}
