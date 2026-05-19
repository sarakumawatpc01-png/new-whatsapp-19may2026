import { PaymentProvider, CheckoutSessionParams, CheckoutSessionResult } from "../types";
import * as crypto from "crypto";

export class PayPalProvider implements PaymentProvider {
  private clientId: string;
  private clientSecret: string;
  private baseUrl: string;
  private accessToken: string | null = null;
  private tokenExpiry = 0;

  constructor(clientId: string, clientSecret: string, mode: "sandbox" | "live" = "sandbox") {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.baseUrl = mode === "live" 
      ? "https://api-m.paypal.com" 
      : "https://api-m.sandbox.paypal.com";
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString("base64");
    const res = await fetch(`${this.baseUrl}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${auth}`,
      },
      body: "grant_type=client_credentials",
    });

    if (!res.ok) {
      throw new Error(`PayPal auth failed: ${res.statusText}`);
    }

    const data: any = await res.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
    return data.access_token;
  }

  private async request(method: string, path: string, body?: any): Promise<any> {
    const token = await this.getAccessToken();
    const options: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    };
    if (body) {
      options.body = JSON.stringify(body);
    }

    const res = await fetch(`${this.baseUrl}${path}`, options);
    if (!res.ok) {
      const errData: any = await res.json().catch(() => ({}));
      throw new Error(`PayPal API error: ${errData?.message || res.statusText}`);
    }
    return res.json();
  }

  async createCheckoutSession(params: CheckoutSessionParams): Promise<CheckoutSessionResult> {
    const amount = params.metadata?.amount || "49.99";
    const currency = params.currency?.toUpperCase() || "USD";

    // Create a subscription if planId looks like a PayPal plan
    if (params.planId?.startsWith("P-")) {
      const subscription = await this.request("POST", "/v1/billing/subscriptions", {
        plan_id: params.planId,
        subscriber: {
          email_address: params.email,
        },
        custom_id: params.tenantId,
        application_context: {
          return_url: params.successUrl,
          cancel_url: params.cancelUrl,
          brand_name: "WhatsApp SaaS Platform",
          user_action: "SUBSCRIBE_NOW",
        },
      });

      const approveLink = subscription.links?.find((l: any) => l.rel === "approve");
      return {
        url: approveLink?.href || subscription.links?.[0]?.href || "",
        sessionId: subscription.id,
      };
    }

    // Otherwise create a one-time order
    const order = await this.request("POST", "/v2/checkout/orders", {
      intent: "CAPTURE",
      purchase_units: [{
        reference_id: params.tenantId,
        description: `Subscription - ${params.planId}`,
        amount: {
          currency_code: currency,
          value: amount,
        },
        custom_id: params.tenantId,
      }],
      application_context: {
        return_url: params.successUrl,
        cancel_url: params.cancelUrl,
        brand_name: "WhatsApp SaaS Platform",
      },
    });

    const approveLink = order.links?.find((l: any) => l.rel === "approve");
    return {
      url: approveLink?.href || "",
      sessionId: order.id,
    };
  }

  async captureOrder(orderId: string): Promise<any> {
    return this.request("POST", `/v2/checkout/orders/${orderId}/capture`);
  }

  verifyWebhook(payload: any, signature: string, secret: string): boolean {
    // PayPal uses a different webhook verification (certificate-based)
    // For IPN: verify by posting back to PayPal
    // For Webhooks API: verify signature header
    try {
      const body = typeof payload === "string" ? payload : JSON.stringify(payload);
      const expectedSig = crypto
        .createHmac("sha256", secret)
        .update(body)
        .digest("hex");
      return crypto.timingSafeEqual(
        Buffer.from(expectedSig, "hex"),
        Buffer.from(signature, "hex")
      );
    } catch {
      return false;
    }
  }

  async cancelSubscription(externalId: string): Promise<void> {
    await this.request("POST", `/v1/billing/subscriptions/${externalId}/cancel`, {
      reason: "Customer requested cancellation",
    });
  }

  async changePlan(externalId: string, newPriceId: string): Promise<void> {
    await this.request("POST", `/v1/billing/subscriptions/${externalId}/revise`, {
      plan_id: newPriceId,
    });
  }
}
