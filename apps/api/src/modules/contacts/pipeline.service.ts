import { Injectable, Inject } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class PipelineService {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  async getStages(tenantId: string) {
    const stages = await this.prisma.pipelineStage.findMany({
      where: { tenantId },
      orderBy: { position: "asc" },
      include: {
        _count: { select: { contacts: true } }
      }
    });

    // Create default stages if none exist
    if (stages.length === 0) {
      const defaults = [
        { name: "New Lead", position: 1, color: "#6366F1" },
        { name: "Contacted", position: 2, color: "#3B82F6" },
        { name: "Qualified", position: 3, color: "#10B981" },
        { name: "Proposal", position: 4, color: "#F59E0B" },
        { name: "Negotiation", position: 5, color: "#EC4899" },
        { name: "Closed Won", position: 6, color: "#059669" },
        { name: "Closed Lost", position: 7, color: "#DC2626" },
      ];

      await this.prisma.pipelineStage.createMany({
        data: defaults.map(d => ({ ...d, tenantId })),
      });

      return this.prisma.pipelineStage.findMany({
        where: { tenantId },
        orderBy: { position: "asc" },
        include: {
          _count: { select: { contacts: true } }
        }
      });
    }

    return stages;
  }

  async createStage(tenantId: string, data: any) {
    return this.prisma.pipelineStage.create({
      data: {
        tenantId,
        name: data.name,
        position: data.position,
        color: data.color || "#6366f1",
      }
    });
  }

  async updateStage(tenantId: string, id: string, data: any) {
    const stage = await this.prisma.pipelineStage.findUnique({
      where: { id },
    });

    if (!stage || stage.tenantId !== tenantId) {
      throw new Error("Unauthorized or stage not found");
    }

    return this.prisma.pipelineStage.update({
      where: { id },
      data,
    });
  }

  async reorderStages(tenantId: string, stages: { id: string; position: number }[]) {
    for (const s of stages) {
      await this.prisma.pipelineStage.update({
        where: { id: s.id },
        data: { position: s.position }
      });
    }
  }

  async bulkUpdateStage(tenantId: string, contactIds: string[], stageId: string) {
    await this.prisma.contact.updateMany({
      where: {
        tenantId,
        id: { in: contactIds },
      },
      data: { pipelineStageId: stageId },
    });
  }
}
