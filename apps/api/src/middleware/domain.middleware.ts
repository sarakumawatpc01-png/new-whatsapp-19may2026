import { Injectable, NestMiddleware, Inject, Logger } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { PrismaService } from "../prisma/prisma.service";
import { RedisService } from "../redis/redis.service";

@Injectable()
export class DomainMiddleware implements NestMiddleware {
  private readonly logger = new Logger(DomainMiddleware.name);
  private redisAvailable = true;
  private lastRedisCheck = 0;

  constructor(@Inject(PrismaService) private prisma: PrismaService, @Inject('REDIS_SERVICE') private redis: RedisService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    let host = req.headers["x-forwarded-host"] || req.headers.host;
    if (Array.isArray(host)) host = host[0];
    if (!host) {
      (req as any).resellerId = null;
      return next();
    }

    host = host.split(":")[0];

    // Skip Redis if it was recently unavailable (recheck every 30s)
    if (!this.redisAvailable && Date.now() - this.lastRedisCheck < 30000) {
      (req as any).resellerId = null;
      return next();
    }

    const cacheKey = `domain:${host}`;
    try {
      const client = this.redis.getClient();
      if (client.status !== "ready") {
        this.redisAvailable = false;
        this.lastRedisCheck = Date.now();
        (req as any).resellerId = null;
        return next();
      }

      const cached = await Promise.race([
        client.get(cacheKey),
        new Promise<null>((_, reject) => setTimeout(() => reject(new Error("Redis timeout")), 2000))
      ]);

      this.redisAvailable = true;

      if (cached) {
        (req as any).resellerId = cached === "null" ? null : cached;
        return next();
      }

      const customDomain = await this.prisma.customDomain.findFirst({
        where: { domain: host, status: 'ACTIVE' },
        include: { tenant: true }
      });

      if (customDomain && customDomain.tenant.type === 'RESELLER') {
        (req as any).resellerId = customDomain.tenantId;
        client.set(cacheKey, customDomain.tenantId, "EX", 300).catch(() => {});
      } else {
        (req as any).resellerId = null;
        client.set(cacheKey, "null", "EX", 300).catch(() => {});
      }
    } catch (e) {
      this.redisAvailable = false;
      this.lastRedisCheck = Date.now();
      (req as any).resellerId = null;
    }

    next();
  }
}
