import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards , Inject} from "@nestjs/common";
import { CampaignsService } from "./campaigns.service";
import { JwtAuthGuard } from "../auth/guards";
import { CurrentTenant } from "../auth/decorators";

@Controller("campaigns")
@UseGuards(JwtAuthGuard)
export class CampaignsController {
  constructor(@Inject(CampaignsService) private campaignsService: CampaignsService) {}

  @Get()
  async findAll(@CurrentTenant() tenant: any) {
    const data = await this.campaignsService.findAll(tenant.id);
    return { success: true, data };
  }

  @Get(":id")
  async findOne(@CurrentTenant() tenant: any, @Param("id") id: string) {
    const data = await this.campaignsService.findOne(tenant.id, id);
    return { success: true, data };
  }

  @Post()
  async create(@CurrentTenant() tenant: any, @Body() body: any) {
    const data = await this.campaignsService.create(tenant.id, body);
    return { success: true, data };
  }

  @Put(":id")
  async update(@CurrentTenant() tenant: any, @Param("id") id: string, @Body() body: any) {
    const data = await this.campaignsService.update(tenant.id, id, body);
    return { success: true, data };
  }

  @Delete(":id")
  async delete(@CurrentTenant() tenant: any, @Param("id") id: string) {
    await this.campaignsService.delete(tenant.id, id);
    return { success: true };
  }

  @Post(":id/launch")
  async launch(@CurrentTenant() tenant: any, @Param("id") id: string, @Body("templateId") templateId: string) {
    const data = await this.campaignsService.launch(tenant.id, id, templateId);
    return { success: true, data };
  }

  @Post(":id/pause")
  async pause(@CurrentTenant() tenant: any, @Param("id") id: string) {
    const data = await this.campaignsService.pause(tenant.id, id);
    return { success: true, data };
  }

  @Post(":id/resume")
  async resume(@CurrentTenant() tenant: any, @Param("id") id: string) {
    const data = await this.campaignsService.resume(tenant.id, id);
    return { success: true, data };
  }

  @Post(":id/cancel")
  async cancel(@CurrentTenant() tenant: any, @Param("id") id: string) {
    const data = await this.campaignsService.cancel(tenant.id, id);
    return { success: true, data };
  }
}
