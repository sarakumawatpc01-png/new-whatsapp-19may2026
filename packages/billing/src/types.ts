export interface CheckoutSessionParams {
  planId: string;
  tenantId: string;
  email: string;
  currency: string;
  interval: "monthly" | "yearly";
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}

export interface CheckoutSessionResult {
  url: string;
  sessionId: string;
}

export enum SubscriptionStatus {
  TRIALING = "TRIALING",
  ACTIVE = "ACTIVE",
  PAST_DUE = "PAST_DUE",
  GRACE_PERIOD = "GRACE_PERIOD",
  SUSPENDED = "SUSPENDED",
  CANCELLED = "CANCELLED",
  EXPIRED = "EXPIRED",
}

export interface PaymentProvider {
  createCheckoutSession(params: CheckoutSessionParams): Promise<CheckoutSessionResult>;
  verifyWebhook(payload: any, signature: string, secret: string): boolean;
  cancelSubscription(externalId: string): Promise<void>;
  changePlan(externalId: string, newPriceId: string): Promise<void>;
}
