import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards , Inject} from "@nestjs/common";
import { AdminResellersService } from "./resellers.service";
import { JwtAuthGuard, RolesGuard } from "../auth/guards";
import { Roles } from "../auth/decorators";
import { UserRole } from "@repo/database";

@Controller("admin/resellers")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class AdminResellersController {
  constructor(@Inject(AdminResellersService) private readonly service: AdminResellersService) {}

  @Get()
  async findAll(@Query() query: any) {
    const data = await this.service.findAll(query);
    return { success: true, ...data };
  }

  @Post()
  async create(@Body() data: any) {
    const reseller = await this.service.create(data);
    return { success: true, data: reseller };
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    const data = await this.service.findOne(id);
    return { success: true, data };
  }

  @Put(":id")
  async update(@Param("id") id: string, @Body() data: any) {
    const reseller = await this.service.update(id, data);
    return { success: true, data: reseller };
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    await this.service.remove(id);
    return { success: true };
  }

  @Put(":id/branding")
  async updateBranding(@Param("id") id: string, @Body() data: any) {
    const reseller = await this.service.updateBranding(id, data);
    return { success: true, data: reseller };
  }

  @Put(":id/smtp")
  async updateSmtp(@Param("id") id: string, @Body() data: any) {
    const reseller = await this.service.updateSmtp(id, data);
    return { success: true, data: reseller };
  }

  @Post(":id/domain")
  async setDomain(@Param("id") id: string, @Body("customDomain") customDomain: string) {
    const reseller = await this.service.setDomain(id, customDomain);
    return { 
      success: true, 
      data: reseller,
      instructions: `Please create a CNAME record for ${customDomain} pointing to the platform domain.`
    };
  }

  @Post(":id/domain/verify")
  async verifyDomain(@Param("id") id: string) {
    const result = await this.service.verifyDomain(id);
    return { success: true, data: result };
  }
}
