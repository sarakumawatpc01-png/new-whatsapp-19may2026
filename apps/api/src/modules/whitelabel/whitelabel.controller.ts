import { Controller, Get, Post, Put, Body, UseGuards, Inject } from "@nestjs/common";
import { WhitelabelService } from "./whitelabel.service";
import { JwtAuthGuard } from "../auth/guards";
import { CurrentTenant } from "../auth/decorators";

@Controller("whitelabel")
@UseGuards(JwtAuthGuard)
export class WhitelabelController {
  constructor(@Inject(WhitelabelService) private whitelabelService: WhitelabelService) {}

  @Get("branding")
  async getBranding(@CurrentTenant() tenant: any) {
    const data = await this.whitelabelService.getBranding(tenant.id);
    return { success: true, data };
  }

  @Put("branding")
  async updateBranding(@CurrentTenant() tenant: any, @Body() body: any) {
    const data = await this.whitelabelService.updateBranding(tenant.id, body);
    return { success: true, data };
  }

  @Post("domain/verify")
  async verifyDomain(@CurrentTenant() tenant: any, @Body("domain") domain: string) {
    const data = await this.whitelabelService.verifyDomain(tenant.id, domain);
    return { success: true, data };
  }

  @Put("email-config")
  async updateEmailConfig(@CurrentTenant() tenant: any, @Body() body: any) {
    const data = await this.whitelabelService.updateEmailConfig(tenant.id, body.provider, body.config);
    return { success: true, data };
  }
}
