import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards , Inject} from "@nestjs/common";
import { TemplatesService } from "./templates.service";
import { JwtAuthGuard } from "../auth/guards";
import { CurrentTenant } from "../auth/decorators";

@Controller("templates")
@UseGuards(JwtAuthGuard)
export class TemplatesController {
  constructor(@Inject(TemplatesService) private templatesService: TemplatesService) {}

  @Get()
  async findAll(@CurrentTenant() tenant: any) {
    const data = await this.templatesService.findAll(tenant.id);
    return { success: true, data };
  }

  @Get(":id")
  async findOne(@CurrentTenant() tenant: any, @Param("id") id: string) {
    const data = await this.templatesService.findOne(tenant.id, id);
    return { success: true, data };
  }

  @Post()
  async create(@CurrentTenant() tenant: any, @Body() body: any) {
    const data = await this.templatesService.create(tenant.id, body);
    return { success: true, data };
  }

  @Put(":id")
  async update(@CurrentTenant() tenant: any, @Param("id") id: string, @Body() body: any) {
    const data = await this.templatesService.update(tenant.id, id, body);
    return { success: true, data };
  }

  @Delete(":id")
  async delete(@CurrentTenant() tenant: any, @Param("id") id: string) {
    await this.templatesService.delete(tenant.id, id);
    return { success: true };
  }

  @Post(":id/submit")
  async submit(@CurrentTenant() tenant: any, @Param("id") id: string) {
    const data = await this.templatesService.submitToMeta(tenant.id, id);
    return { success: true, data };
  }

  @Get(":id/status")
  async syncStatus(@CurrentTenant() tenant: any, @Param("id") id: string) {
    const data = await this.templatesService.syncStatus(tenant.id, id);
    return { success: true, data };
  }
}
