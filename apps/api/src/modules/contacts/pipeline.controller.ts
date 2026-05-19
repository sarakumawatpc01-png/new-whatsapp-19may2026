import { Controller, Get, Post, Put, Delete, Body, Param, Patch, UseGuards , Inject} from "@nestjs/common";
import { PipelineService } from "./pipeline.service";
import { JwtAuthGuard } from "../auth/guards";
import { CurrentTenant } from "../auth/decorators";

@Controller("pipeline")
@UseGuards(JwtAuthGuard)
export class PipelineController {
  constructor(@Inject(PipelineService) private pipelineService: PipelineService) {}

  @Get("stages")
  async getStages(@CurrentTenant() tenant: any) {
    const data = await this.pipelineService.getStages(tenant.id);
    return { success: true, data };
  }

  @Post("stages")
  async createStage(@CurrentTenant() tenant: any, @Body() body: any) {
    const data = await this.pipelineService.createStage(tenant.id, body);
    return { success: true, data };
  }

  @Put("stages/:id")
  async updateStage(@CurrentTenant() tenant: any, @Param("id") id: string, @Body() body: any) {
    const data = await this.pipelineService.updateStage(tenant.id, id, body);
    return { success: true, data };
  }

  @Patch("stages/reorder")
  async reorderStages(@CurrentTenant() tenant: any, @Body() body: any) {
    await this.pipelineService.reorderStages(tenant.id, body.stages);
    return { success: true };
  }

  @Post("bulk-stage")
  async bulkUpdateStage(@CurrentTenant() tenant: any, @Body() body: any) {
    const { contactIds, pipelineStageId } = body;
    await this.pipelineService.bulkUpdateStage(tenant.id, contactIds, pipelineStageId);
    return { success: true };
  }
}
