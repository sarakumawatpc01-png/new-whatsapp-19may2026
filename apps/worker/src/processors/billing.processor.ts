import { Process, Processor } from "@nestjs/bull";
import { Logger, Inject } from "@nestjs/common";
import type { Job } from "bull";
import { PrismaService } from "../prisma/prisma.service";
import { SubscriptionStatus, PaymentProvider } from "@repo/database";

@Processor("billing")
export class BillingProcessor {
  private readonly logger = new Logger(BillingProcessor.name);

  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  @Process("webhook")
  async handleWebhook(job: Job<any>) {
    const { provider, type, payload, eventId } = job.data;

    try {
      if (provider === "stripe") {
        await this.handleStripeEvent(type, payload);
      } else if (provider === "razorpay") {
        await this.handleRazorpayEvent(type, payload);
      }

      await this.prisma.paymentWebhook.update({
        where: { eventId },
        data: { processed: true, processedAt: new Date() },
      });
    } catch (e: any) {
      this.logger.error(`Failed to process billing webhook ${eventId}: ${e.message}`);
      await this.prisma.paymentWebhook.update({
        where: { eventId },
        data: { processed: false, error: e.message },
      });
      throw e;
    }
  }

  private async handleStripeEvent(type: string, event: any) {
    switch (type) {
      case "checkout.session.completed":
        await this.handleSubscriptionCreated(event.data.object);
        break;
      case "invoice.payment_succeeded":
        await this.handlePaymentSucceeded(event.data.object);
        break;
      case "invoice.payment_failed":
        await this.handlePaymentFailed(event.data.object);
        break;
      case "customer.subscription.deleted":
        await this.handleSubscriptionCancelled(event.data.object);
        break;
    }
  }

  private async handleRazorpayEvent(type: string, event: any) {
    // Similar logic for Razorpay events
  }

  private async handleSubscriptionCreated(session: any) {
    const tenantId = session.client_reference_id || session.metadata?.tenantId;
    const externalId = session.subscription;
    
    const plan = await this.prisma.plan.findFirst({
      where: { slug: "pro" }
    });

    const existing = await this.prisma.subscription.findFirst({
      where: { tenantId },
      orderBy: { createdAt: 'desc' }
    });

    if (existing) {
      await this.prisma.subscription.update({
        where: { id: existing.id },
        data: {
          externalId,
          status: SubscriptionStatus.ACTIVE,
          planId: plan?.id,
          provider: PaymentProvider.STRIPE
        }
      });
    } else {
      await this.prisma.subscription.create({
        data: {
          tenantId,
          planId: plan?.id || "default_plan",
          externalId,
          provider: PaymentProvider.STRIPE,
          status: SubscriptionStatus.ACTIVE,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
    }
  }

  private async handlePaymentSucceeded(invoice: any) {
    const externalId = invoice.subscription;
    const sub = await this.prisma.subscription.findFirst({ where: { externalId } });
    if (!sub) return;

    const invoiceNum = await this.generateInvoiceNumber(sub.tenantId);
    
    await this.prisma.invoice.create({
      data: {
        tenantId: sub.tenantId,
        subscriptionId: sub.id,
        invoiceNumber: invoiceNum,
        subtotal: invoice.amount_paid,
        total: invoice.amount_paid,
        currency: (invoice.currency || "INR").toUpperCase(),
        status: "paid",
        items: {
          create: [
            {
              description: `Subscription renewal`,
              quantity: 1,
              unitAmount: invoice.amount_paid,
              total: invoice.amount_paid,
              type: "subscription"
            }
          ]
        }
      }
    });

    await this.prisma.subscription.update({
      where: { id: sub.id },
      data: {
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: new Date(invoice.period_start * 1000),
        currentPeriodEnd: new Date(invoice.period_end * 1000),
      }
    });
  }

  private async handlePaymentFailed(invoice: any) {
    const externalId = invoice.subscription;
    const sub = await this.prisma.subscription.findFirst({ where: { externalId } });
    if (!sub) return;

    await this.prisma.subscription.update({
      where: { id: sub.id },
      data: { status: SubscriptionStatus.PAST_DUE }
    });
  }

  private async handleSubscriptionCancelled(subscription: any) {
    const externalId = subscription.id;
    await this.prisma.subscription.updateMany({
      where: { externalId },
      data: { status: SubscriptionStatus.CANCELLED }
    });
  }

  private async generateInvoiceNumber(tenantId: string): Promise<string> {
    const count = await this.prisma.invoice.count({ where: { tenantId } });
    const year = new Date().getFullYear();
    const seq = (count + 1).toString().padStart(6, "0");
    return `INV-${year}-${seq}`;
  }
}
