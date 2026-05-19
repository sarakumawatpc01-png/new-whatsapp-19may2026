import { Controller, Get, Post, Delete, Body, Param, UseGuards, Inject } from "@nestjs/common";
import { DevelopersService } from "./developers.service";
import { JwtAuthGuard } from "../auth/guards";
import { CurrentTenant } from "../auth/decorators";

@Controller("developers/api-keys")
@UseGuards(JwtAuthGuard)
export class DevelopersController {
  constructor(@Inject(DevelopersService) private developersService: DevelopersService) {}

  @Get()
  async getApiKeys(@CurrentTenant() tenant: any) {
    const data = await this.developersService.getApiKeys(tenant.id);
    return { success: true, data };
  }

  @Post()
  async createApiKey(@CurrentTenant() tenant: any, @Body("name") name: string) {
    const data = await this.developersService.createApiKey(tenant.id, name);
    return { success: true, data };
  }

  @Delete(":id")
  async revokeApiKey(@CurrentTenant() tenant: any, @Param("id") id: string) {
    await this.developersService.revokeApiKey(tenant.id, id);
    return { success: true };
  }
}
