import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Patch, 
  Delete, 
  Body, 
  Param, 
  UseGuards 
, Inject} from "@nestjs/common";
import { AutomationsService } from "./automations.service";
import { JwtAuthGuard } from "../auth/guards";
import { CurrentTenant } from "../auth/decorators";

@Controller("automations")
@UseGuards(JwtAuthGuard)
export class AutomationsController {
  constructor(@Inject(AutomationsService) private automationsService: AutomationsService) {}

  @Get()
  async findAll(@CurrentTenant() tenant: any) {
    const data = await this.automationsService.findAll(tenant.id);
    return { success: true, data };
  }

  @Get(":id")
  async findOne(@CurrentTenant() tenant: any, @Param("id") id: string) {
    const data = await this.automationsService.findOne(tenant.id, id);
    return { success: true, data };
  }

  @Post()
  async create(@CurrentTenant() tenant: any, @Body() body: any) {
    const data = await this.automationsService.create(tenant.id, body);
    return { success: true, data };
  }

  @Put(":id")
  async update(@CurrentTenant() tenant: any, @Param("id") id: string, @Body() body: any) {
    const data = await this.automationsService.update(tenant.id, id, body);
    return { success: true, data };
  }

  @Delete(":id")
  async delete(@CurrentTenant() tenant: any, @Param("id") id: string) {
    await this.automationsService.delete(tenant.id, id);
    return { success: true };
  }

  @Patch(":id/activate")
  async activate(@CurrentTenant() tenant: any, @Param("id") id: string) {
    const data = await this.automationsService.setStatus(tenant.id, id, "ACTIVE");
    return { success: true, data };
  }

  @Patch(":id/pause")
  async pause(@CurrentTenant() tenant: any, @Param("id") id: string) {
    const data = await this.automationsService.setStatus(tenant.id, id, "PAUSED");
    return { success: true, data };
  }

  @Post(":id/test")
  async test(@CurrentTenant() tenant: any, @Param("id") id: string, @Body() body: any) {
    const data = await this.automationsService.triggerManual(tenant.id, id, body);
    return { success: true, data };
  }
}
