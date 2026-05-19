import { Controller, Get, Inject } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { InjectQueue } from "@nestjs/bull";
import type { Queue } from "bull";

@Controller("health")
export class HealthController {
  constructor(@Inject(PrismaService) private prisma: PrismaService, @InjectQueue("whatsapp") private whatsappQueue: Queue,
  ) {}

  @Get()
  async check() {
    const checks: Record<string, string> = {};
    let healthy = true;

    // Database check
    try {
      await (this.prisma as any).$queryRaw`SELECT 1`;
      checks.db = "connected";
    } catch {
      checks.db = "disconnected";
      healthy = false;
    }

    // Redis check (via BullMQ queue client)
    try {
      const client = await Promise.race([
        this.whatsappQueue.client,
        new Promise<any>((_, reject) => setTimeout(() => reject(new Error("Redis client timeout")), 2000))
      ]);
      if (client && client.status === "ready") {
        checks.redis = "connected";
      } else if (client) {
        checks.redis = `status: ${client.status}`;
        healthy = false;
      } else {
        checks.redis = "disconnected";
        healthy = false;
      }
    } catch {
      checks.redis = "disconnected";
      healthy = false;
    }

    // Queue check
    try {
      if (checks.redis === "connected") {
        const [waiting, active] = await Promise.race([
          Promise.all([
            this.whatsappQueue.getWaitingCount(),
            this.whatsappQueue.getActiveCount()
          ]),
          new Promise<[number, number]>((_, reject) => setTimeout(() => reject(new Error("Queue timeout")), 2000))
        ]);
        checks.queue = `waiting: ${waiting}, active: ${active}`;
      } else {
        checks.queue = "unavailable";
      }
    } catch {
      checks.queue = "unavailable";
    }

    return {
      success: healthy,
      data: {
        status: healthy ? "healthy" : "degraded",
        timestamp: new Date().toISOString(),
        ...checks,
        uptime: Math.floor(process.uptime()),
      },
    };
  }
}
