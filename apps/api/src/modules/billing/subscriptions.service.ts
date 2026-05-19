import { Injectable, HttpException, HttpStatus, Inject } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { StripeProvider, RazorpayProvider, PayPalProvider } from "@repo/billing";
import { getEnv } from "@repo/config";
import { SubscriptionStatus, PaymentProvider } from "@repo/database";

@Injectable()
export class SubscriptionsService {
  private stripe: StripeProvider;
  private razorpay: RazorpayProvider;
  private paypal: PayPalProvider;

  constructor(@Inject(PrismaService) private prisma: PrismaService) {
    const env = getEnv();
    this.stripe = new StripeProvider(env.STRIPE_SECRET_KEY || "");
    this.razorpay = new RazorpayProvider(env.RAZORPAY_KEY_ID || "", env.RAZORPAY_KEY_SECRET || "");
    this.paypal = new PayPalProvider((env as any).PAYPAL_CLIENT_ID || "", (env as any).PAYPAL_CLIENT_SECRET || "");
  }

  async getSubscription(tenantId: string) {
    return this.prisma.subscription.findFirst({
      where: { tenantId },
      include: { plan: true },
    });
  }

  async createCheckoutSession(tenantId: string, userId: string, data: any) {
    const { planId, provider, interval, currency } = data;
    const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) throw new HttpException("Plan not found", HttpStatus.NOT_FOUND);

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new HttpException("User not found", HttpStatus.NOT_FOUND);
    
    const params = {
      planId: (plan as any).stripePriceId || planId,
      tenantId,
      email: user.email,
      currency,
      interval,
      successUrl: `${getEnv().FRONTEND_URL}/billing?success=true`,
      cancelUrl: `${getEnv().FRONTEND_URL}/billing?cancel=true`,
    };

    if (provider === PaymentProvider.STRIPE) {
      return this.stripe.createCheckoutSession(params);
    } else if (provider === PaymentProvider.RAZORPAY) {
      return this.razorpay.createCheckoutSession(params);
    } else {
      return this.paypal.createCheckoutSession(params);
    }
  }

  async cancelSubscription(tenantId: string) {
    const sub = await this.prisma.subscription.findFirst({ where: { tenantId } });
    if (!sub) throw new HttpException("Subscription not found", HttpStatus.NOT_FOUND);

    const subId = sub.externalId;
    if (!subId) throw new HttpException("Gateway subscription ID not found", HttpStatus.BAD_REQUEST);

    if (sub.provider === PaymentProvider.STRIPE) {
      await this.stripe.cancelSubscription(subId);
    } else if (sub.provider === PaymentProvider.RAZORPAY) {
      await this.razorpay.cancelSubscription(subId);
    } else {
      await this.paypal.cancelSubscription(subId);
    }

    return this.prisma.subscription.update({
      where: { id: sub.id },
      data: { cancelAtPeriodEnd: true },
    });
  }

  async changePlan(tenantId: string, newPlanId: string) {
    const sub = await this.prisma.subscription.findFirst({ where: { tenantId } });
    const plan = await this.prisma.plan.findUnique({ where: { id: newPlanId } });
    
    if (!sub || !plan) throw new HttpException("Subscription or plan not found", HttpStatus.NOT_FOUND);

    const isUpgrade = plan.monthlyPriceInr > (sub as any).plan?.monthlyPriceInr;

    if (isUpgrade && sub.externalId) {
       if (sub.provider === PaymentProvider.STRIPE) {
         await this.stripe.changePlan(sub.externalId, newPlanId);
       }
       return this.prisma.subscription.update({
         where: { id: sub.id },
         data: { planId: newPlanId }
       });
    } else {
       return this.prisma.subscription.update({
         where: { id: sub.id },
         data: {
           pendingPlanId: newPlanId,
           pendingChangeAt: sub.currentPeriodEnd,
         }
       });
    }
  }
}
