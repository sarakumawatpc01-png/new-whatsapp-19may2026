import { Inject } from "@nestjs/common";
import { Process, Processor } from "@nestjs/bull";
import type { Job } from "bull";
import { PrismaService } from "../prisma/prisma.service";
import * as crypto from "crypto";
import axios from "axios";

// Backoff schedule: 1min, 5min, 30min, 2h, 2h
const RETRY_DELAYS_MS = [60_000, 300_000, 1_800_000, 7_200_000, 7_200_000];

@Processor("webhooks")
export class WebhookProcessor {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  @Process("deliver")
  async handleDeliver(job: Job<{ deliveryId: string; endpointId: string }>) {
    const { deliveryId, endpointId } = job.data;

    const delivery = await this.prisma.webhookDelivery.findUnique({
      where: { id: deliveryId },
    });
    if (!delivery) return;

    const endpoint = await this.prisma.webhookEndpoint.findUnique({
      where: { id: endpointId },
    });
    if (!endpoint || !endpoint.isActive) {
      await this.prisma.webhookDelivery.update({
        where: { id: deliveryId },
        data: { success: false, response: "Endpoint disabled or deleted" },
      });
      return;
    }

    const body = JSON.stringify({
      id: deliveryId,
      event: delivery.event,
      timestamp: new Date().toISOString(),
      data: delivery.payload,
    });

    const signature = crypto
      .createHmac("sha256", endpoint.secret)
      .update(body)
      .digest("hex");

    const attemptNum = delivery.attempts + 1;

    try {
      const response = await axios.post(endpoint.url, body, {
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Signature": `sha256=${signature}`,
          "X-Webhook-Event": delivery.event,
          "X-Webhook-Delivery": deliveryId,
          "User-Agent": "WSA-Webhook/1.0",
        },
        timeout: 10_000,
        validateStatus: () => true,
      });

      if (response.status >= 200 && response.status < 300) {
        await this.prisma.webhookDelivery.update({
          where: { id: deliveryId },
          data: {
            success: true,
            statusCode: response.status,
            response: String(response.data).substring(0, 500),
            attempts: attemptNum,
          },
        });

        await this.prisma.webhookEndpoint.update({
          where: { id: endpointId },
          data: {
            lastCalledAt: new Date(),
            failureCount: 0,
          },
        });
      } else {
        await this.handleFailure(
          deliveryId, endpointId, attemptNum,
          `HTTP ${response.status}`, response.status,
        );
      }
    } catch (error: any) {
      await this.handleFailure(
        deliveryId, endpointId, attemptNum,
        error.message || "Connection error", null,
      );
    }
  }

  private async handleFailure(
    deliveryId: string,
    endpointId: string,
    attemptNum: number,
    errorMessage: string,
    httpStatus: number | null,
  ) {
    const maxAttempts = 5;

    if (attemptNum >= maxAttempts) {
      await this.prisma.webhookDelivery.update({
        where: { id: deliveryId },
        data: {
          success: false,
          response: errorMessage,
          statusCode: httpStatus,
          attempts: attemptNum,
        },
      });

      await this.prisma.webhookEndpoint.update({
        where: { id: endpointId },
        data: {
          lastCalledAt: new Date(),
          failureCount: { increment: 1 },
        },
      });
    } else {
      const delayMs = RETRY_DELAYS_MS[attemptNum - 1] || 7_200_000;
      const nextRetryAt = new Date(Date.now() + delayMs);

      await this.prisma.webhookDelivery.update({
        where: { id: deliveryId },
        data: {
          success: false,
          response: errorMessage,
          statusCode: httpStatus,
          attempts: attemptNum,
          nextRetryAt,
        },
      });

      await this.prisma.webhookEndpoint.update({
        where: { id: endpointId },
        data: { lastCalledAt: new Date() },
      });

      throw new Error(`Retry ${attemptNum}/${maxAttempts}: ${errorMessage}`);
    }
  }
}
