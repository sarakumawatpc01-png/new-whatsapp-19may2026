import { Controller, Get, Post, Body, UseGuards , Inject} from "@nestjs/common";
import { SubscriptionsService } from "./subscriptions.service";
import { JwtAuthGuard } from "../auth/guards";
import { CurrentTenant, CurrentUser } from "../auth/decorators";

@Controller("billing/subscription")
@UseGuards(JwtAuthGuard)
export class SubscriptionsController {
  constructor(@Inject(SubscriptionsService) private subscriptionsService: SubscriptionsService) {}

  @Get()
  async getSubscription(@CurrentTenant() tenant: any) {
    const data = await this.subscriptionsService.getSubscription(tenant.id);
    return { success: true, data };
  }

  @Post("checkout")
  async checkout(
    @CurrentTenant() tenant: any,
    @CurrentUser() user: any,
    @Body() body: any
  ) {
    const data = await this.subscriptionsService.createCheckoutSession(tenant.id, user.id, body);
    return { success: true, data };
  }

  @Post("cancel")
  async cancel(@CurrentTenant() tenant: any) {
    await this.subscriptionsService.cancelSubscription(tenant.id);
    return { success: true };
  }

  @Post("change-plan")
  async changePlan(@CurrentTenant() tenant: any, @Body("planId") planId: string) {
    const data = await this.subscriptionsService.changePlan(tenant.id, planId);
    return { success: true, data };
  }
}
