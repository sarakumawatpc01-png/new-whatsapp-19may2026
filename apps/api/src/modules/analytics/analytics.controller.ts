import { Controller, Get, Query, UseGuards, Inject } from "@nestjs/common";
import { AnalyticsService } from "./analytics.service";
import { JwtAuthGuard } from "../auth/guards";
import { CurrentTenant } from "../auth/decorators";

@Controller("analytics")
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(@Inject(AnalyticsService) private analyticsService: AnalyticsService) {}

  @Get("overview")
  async getOverview(@CurrentTenant() tenant: any) {
    const data = await this.analyticsService.getOverview(tenant.id);
    return { success: true, data };
  }

  @Get("daily")
  async getDailyRollup(@CurrentTenant() tenant: any, @Query("days") days: string) {
    const data = await this.analyticsService.getDailyRollup(tenant.id, parseInt(days) || 7);
    return { success: true, data };
  }
}
