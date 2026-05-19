import Stripe from "stripe";
import { PaymentProvider, CheckoutSessionParams, CheckoutSessionResult } from "../types";

export class StripeProvider implements PaymentProvider {
  private stripe: any;

  constructor(apiKey: string) {
    this.stripe = new Stripe(apiKey, {
      apiVersion: "2023-10-16" as any,
    });
  }

  async createCheckoutSession(params: CheckoutSessionParams): Promise<CheckoutSessionResult> {
    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      customer_email: params.email,
      line_items: [
        {
          price: params.planId, // In Stripe, planId should be the Price ID
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      client_reference_id: params.tenantId,
      metadata: {
        tenantId: params.tenantId,
        ...params.metadata,
      },
      subscription_data: {
        metadata: {
          tenantId: params.tenantId,
        },
      },
    });

    return {
      url: session.url!,
      sessionId: session.id,
    };
  }

  verifyWebhook(payload: any, signature: string, secret: string): boolean {
    try {
      this.stripe.webhooks.constructEvent(payload, signature, secret);
      return true;
    } catch (err) {
      return false;
    }
  }

  async cancelSubscription(externalId: string): Promise<void> {
    await this.stripe.subscriptions.update(externalId, {
      cancel_at_period_end: true,
    });
  }

  async changePlan(externalId: string, newPriceId: string): Promise<void> {
    const subscription = await this.stripe.subscriptions.retrieve(externalId);
    await this.stripe.subscriptions.update(externalId, {
      items: [
        {
          id: subscription.items.data[0].id,
          price: newPriceId,
        },
      ],
      proration_behavior: "always_invoice",
    });
  }
}
