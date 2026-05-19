import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards , Inject} from "@nestjs/common";
import { PlansService } from "./plans.service";
import { JwtAuthGuard, RolesGuard } from "../auth/guards";
import { Roles } from "../auth/decorators";
import { UserRole } from "@repo/database";

@Controller("admin/plans")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.RESELLER_ADMIN)
export class PlansController {
  constructor(@Inject(PlansService) private plansService: PlansService) {}

  @Get()
  async findAll() {
    return this.plansService.findAll();
  }

  @Post()
  async create(@Body() data: any) {
    return this.plansService.create(data);
  }

  @Put(":id")
  async update(@Param("id") id: string, @Body() data: any) {
    return this.plansService.update(id, data);
  }

  @Delete(":id")
  async archive(@Param("id") id: string) {
    return this.plansService.archive(id);
  }

  @Post("duplicate/:id")
  async duplicate(@Param("id") id: string) {
    return this.plansService.duplicate(id);
  }
}
