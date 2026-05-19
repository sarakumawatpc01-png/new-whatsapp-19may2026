import { Injectable, Inject, Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { InjectQueue } from "@nestjs/bull";
import type { Queue } from "bull";
import * as crypto from "crypto";

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    @Inject(PrismaService) private prisma: PrismaService,
    @InjectQueue("webhooks") private webhookQueue: Queue,
  ) {}

  signPayload(secret: string, payload: any): string {
    const jsonStr = JSON.stringify(payload);
    return crypto.createHmac("sha256", secret).update(jsonStr).digest("hex");
  }

  verifySignature(secret: string, payload: any, signature: string): boolean {
    const expected = this.signPayload(secret, payload);
    try {
      return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
    } catch (e) {
      return false;
    }
  }

  async emitEvent(tenantId: string, eventType: string, payload: any) {
    const endpoints = await this.prisma.webhookEndpoint.findMany({
      where: {
        tenantId,
        isActive: true,
        events: { has: eventType }
      }
    });

    for (const endpoint of endpoints) {
      const signature = this.signPayload(endpoint.secret, payload);

      // Create a delivery record
      const delivery = await this.prisma.webhookDelivery.create({
        data: {
          endpointId: endpoint.id,
          event: eventType,
          payload: payload,
        },
      });

      try {
        // Enqueue delivery via BullMQ for reliable async processing
        await this.webhookQueue.add("deliver", {
          deliveryId: delivery.id,
          endpointId: endpoint.id,
          url: endpoint.url,
          payload,
          signature,
        }, {
          attempts: 3,
          backoff: { type: "exponential", delay: 5000 },
          removeOnComplete: true,
        });

        this.logger.debug(`Queued webhook delivery ${delivery.id} to ${endpoint.url} for event ${eventType}`);
      } catch (err: any) {
        this.logger.warn(`Failed to queue webhook (Redis may be down). Attempting direct synchronous delivery: ${err.message}`);
        
        // Fallback: Direct synchronous delivery if queue is unavailable
        try {
          const response = await fetch(endpoint.url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Webhook-Signature": signature,
            },
            body: JSON.stringify(payload),
          });

          await this.prisma.webhookDelivery.update({
            where: { id: delivery.id },
            data: {
              success: response.ok,
              statusCode: response.status,
              responseBody: await response.text().catch(() => null),
              deliveredAt: new Date(),
            },
          });
        } catch (fetchErr: any) {
          await this.prisma.webhookDelivery.update({
            where: { id: delivery.id },
            data: {
              success: false,
              error: fetchErr.message,
              deliveredAt: new Date(),
            },
          });
        }
      }
    }
  }
}
