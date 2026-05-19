import { Controller, Post, Body, Headers, HttpException, HttpStatus, Inject } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bull";
import type { Queue } from "bull";
import { PrismaService } from "../../prisma/prisma.service";
import { StripeProvider, RazorpayProvider } from "@repo/billing";
import { getEnv } from "@repo/config";
import { PaymentProvider } from "@repo/database";

@Controller("webhooks")
export class WebhooksController {
  private stripe: StripeProvider;
  private razorpay: RazorpayProvider;

  constructor(@Inject(PrismaService) private prisma: PrismaService, @InjectQueue("billing") private billingQueue: Queue
  ) {
    const env = getEnv();
    this.stripe = new StripeProvider(env.STRIPE_SECRET_KEY || "");
    this.razorpay = new RazorpayProvider(env.RAZORPAY_KEY_ID || "", env.RAZORPAY_KEY_SECRET || "");
  }

  @Post("stripe")
  async stripeWebhook(@Body() payload: any, @Headers("stripe-signature") sig: string) {
    const env = getEnv();
    const webhookSecret = env.STRIPE_WEBHOOK_SECRET || "";
    if (!webhookSecret || webhookSecret === "whsec_placeholder") {
      throw new HttpException("Stripe webhook secret is not configured", HttpStatus.INTERNAL_SERVER_ERROR);
    }

    let verified = false;
    try {
      verified = this.stripe.verifyWebhook(payload, sig, webhookSecret);
    } catch (e) {
      verified = false;
    }
    
    if (!verified) throw new HttpException("Invalid signature", HttpStatus.BAD_REQUEST);

    const eventId = payload.id;
    const exists = await this.prisma.paymentWebhook.findUnique({ where: { eventId } });
    if (exists) return { success: true };

    await this.prisma.paymentWebhook.create({
      data: {
        eventId,
        provider: PaymentProvider.STRIPE,
        payload,
      }
    });

    await this.billingQueue.add("webhook", {
      provider: PaymentProvider.STRIPE,
      eventId,
      type: payload.type,
      payload,
    });

    return { success: true };
  }

  @Post("razorpay")
  async razorpayWebhook(@Body() payload: any, @Headers("x-razorpay-signature") sig: string) {
    const env = getEnv();
    const verified = this.razorpay.verifyWebhook(payload, sig, env.RAZORPAY_WEBHOOK_SECRET || "");
    if (!verified) throw new HttpException("Invalid signature", HttpStatus.BAD_REQUEST);

    const eventId = payload.account_id + "_" + payload.created_at;
    const exists = await this.prisma.paymentWebhook.findUnique({ where: { eventId } });
    if (exists) return { success: true };

    await this.prisma.paymentWebhook.create({
      data: {
        eventId,
        provider: PaymentProvider.RAZORPAY,
        payload,
      }
    });

    await this.billingQueue.add("webhook", {
      provider: PaymentProvider.RAZORPAY,
      eventId,
      type: payload.event,
      payload,
    });

    return { success: true };
  }
}
