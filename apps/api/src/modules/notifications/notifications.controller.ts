import { Controller, Get, Post, Patch, Body, Param, UseGuards, Inject } from "@nestjs/common";
import { NotificationsService } from "./notifications.service";
import { JwtAuthGuard } from "../auth/guards";
import { CurrentTenant, CurrentUser } from "../auth/decorators";

@Controller("notifications")
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(@Inject(NotificationsService) private notificationsService: NotificationsService) {}

  @Get("preferences")
  async getPreferences(@CurrentTenant() tenant: any, @CurrentUser() user: any) {
    const data = await this.notificationsService.getPreferences(tenant.id, user.id || user.sub);
    return { success: true, data };
  }

  @Post("preferences")
  async updatePreferences(@CurrentTenant() tenant: any, @CurrentUser() user: any, @Body() body: { preferences: any[] }) {
    const data = await this.notificationsService.updatePreferences(tenant.id, user.id || user.sub, body.preferences);
    return { success: true, data };
  }

  @Get()
  async getNotifications(@CurrentTenant() tenant: any, @CurrentUser() user: any) {
    const data = await this.notificationsService.getNotifications(tenant.id, user.id || user.sub);
    return { success: true, data };
  }

  @Patch(":id/read")
  async markAsRead(@CurrentTenant() tenant: any, @CurrentUser() user: any, @Param("id") id: string) {
    await this.notificationsService.markAsRead(tenant.id, user.id || user.sub, id);
    return { success: true };
  }
}
