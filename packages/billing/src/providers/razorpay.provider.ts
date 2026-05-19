import { PaymentProvider, CheckoutSessionParams, CheckoutSessionResult } from "../types";
import * as crypto from "crypto";

export class RazorpayProvider implements PaymentProvider {
  private keyId: string;
  private keySecret: string;
  private baseUrl = "https://api.razorpay.com/v1";

  constructor(keyId: string, keySecret: string) {
    this.keyId = keyId;
    this.keySecret = keySecret;
  }

  private async request(method: string, path: string, body?: any): Promise<any> {
    const auth = Buffer.from(`${this.keyId}:${this.keySecret}`).toString("base64");
    const url = `${this.baseUrl}${path}`;
    
    const options: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${auth}`,
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const res = await fetch(url, options);
    if (!res.ok) {
      const errData: any = await res.json().catch(() => ({}));
      throw new Error(`Razorpay API error: ${errData?.error?.description || res.statusText}`);
    }
    return res.json();
  }

  async createCheckoutSession(params: CheckoutSessionParams): Promise<CheckoutSessionResult> {
    // Step 1: Create a Razorpay subscription
    // For subscription-based billing, use Plans + Subscriptions API
    // Amount must be in paise (minor units)
    const amountPaise = parseInt(params.metadata?.amountPaise || "0") || 49900; // Default ₹499

    const subscription = await this.request("POST", "/subscriptions", {
      plan_id: params.planId,
      total_count: params.interval === "yearly" ? 1 : 12,
      quantity: 1,
      notes: {
        tenantId: params.tenantId,
        email: params.email,
      },
    }).catch(async () => {
      // Fallback: create an order for one-time payment
      const order = await this.request("POST", "/orders", {
        amount: amountPaise,
        currency: params.currency?.toUpperCase() || "INR",
        receipt: `rcpt_${params.tenantId}_${Date.now()}`,
        notes: {
          tenantId: params.tenantId,
          planId: params.planId,
          email: params.email,
        },
      });
      return { id: order.id, short_url: null, _isOrder: true };
    });

    // If subscription has a short_url, use it. Otherwise return order data.
    if (subscription.short_url) {
      return {
        url: subscription.short_url,
        sessionId: subscription.id,
      };
    }

    // For order-based checkout (handled by frontend Razorpay.js modal)
    return {
      url: `razorpay://checkout?order_id=${subscription.id}`,
      sessionId: subscription.id,
    };
  }

  verifyWebhook(payload: any, signature: string, secret: string): boolean {
    // Razorpay signs the raw body with HMAC-SHA256
    const body = typeof payload === "string" ? payload : JSON.stringify(payload);
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");
    
    try {
      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature, "hex"),
        Buffer.from(signature, "hex")
      );
    } catch {
      return false;
    }
  }

  // Verify Razorpay payment signature (order_id|payment_id signed with key_secret)
  verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
    const body = `${orderId}|${paymentId}`;
    const expectedSignature = crypto
      .createHmac("sha256", this.keySecret)
      .update(body)
      .digest("hex");
    
    try {
      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature, "hex"),
        Buffer.from(signature, "hex")
      );
    } catch {
      return false;
    }
  }

  async cancelSubscription(externalId: string): Promise<void> {
    await this.request("POST", `/subscriptions/${externalId}/cancel`, {
      cancel_at_cycle_end: 1,
    });
  }

  async changePlan(externalId: string, newPriceId: string): Promise<void> {
    await this.request("PATCH", `/subscriptions/${externalId}`, {
      plan_id: newPriceId,
    });
  }
}
