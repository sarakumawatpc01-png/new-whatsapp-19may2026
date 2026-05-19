import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards , Inject} from "@nestjs/common";
import { TagsService } from "./tags.service";
import { JwtAuthGuard } from "../auth/guards";
import { CurrentTenant } from "../auth/decorators";

@Controller("tags")
@UseGuards(JwtAuthGuard)
export class TagsController {
  constructor(@Inject(TagsService) private tagsService: TagsService) {}

  @Get()
  async findAll(@CurrentTenant() tenant: any) {
    const data = await this.tagsService.findAll(tenant.id);
    return { success: true, data };
  }

  @Post()
  async create(@CurrentTenant() tenant: any, @Body() body: any) {
    const data = await this.tagsService.create(tenant.id, body);
    return { success: true, data };
  }

  @Put(":id")
  async update(@CurrentTenant() tenant: any, @Param("id") id: string, @Body() body: any) {
    const data = await this.tagsService.update(tenant.id, id, body);
    return { success: true, data };
  }

  @Delete(":id")
  async delete(@CurrentTenant() tenant: any, @Param("id") id: string) {
    await this.tagsService.delete(tenant.id, id);
    return { success: true };
  }
}
