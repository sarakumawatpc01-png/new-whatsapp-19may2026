import { Controller, Get, Post, Put, Body, Param, Query, UseGuards , Inject} from "@nestjs/common";
import { TenantsService } from "./tenants.service";
import { JwtAuthGuard, RolesGuard } from "../auth/guards";
import { Roles, CurrentUser } from "../auth/decorators";
import { UserRole } from "@repo/database";

@Controller("admin/tenants")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.RESELLER_ADMIN)
export class TenantsController {
  constructor(@Inject(TenantsService) private tenantsService: TenantsService) {}

  @Get()
  async findAll(@Query() query: any) {
    return this.tenantsService.findAll(query);
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    return this.tenantsService.findOne(id);
  }

  @Put(":id")
  async update(@Param("id") id: string, @Body() data: any) {
    return this.tenantsService.update(id, data);
  }

  @Post(":id/suspend")
  async suspend(@Param("id") id: string, @CurrentUser() admin: any) {
    return this.tenantsService.suspend(id, admin.id);
  }

  @Post(":id/activate")
  async activate(@Param("id") id: string, @CurrentUser() admin: any) {
    return this.tenantsService.activate(id, admin.id);
  }

  @Post(":id/impersonate")
  async impersonate(@Param("id") id: string, @CurrentUser() admin: any) {
    return this.tenantsService.impersonate(id, admin.id);
  }

  @Post(":id/reset-quota")
  async resetQuota(@Param("id") id: string, @CurrentUser() admin: any) {
    return this.tenantsService.resetQuota(id, admin.id);
  }

  @Post(":id/change-plan")
  async changePlan(@Param("id") id: string, @Body("planId") planId: string) {
    return this.tenantsService.changePlan(id, planId);
  }
}
