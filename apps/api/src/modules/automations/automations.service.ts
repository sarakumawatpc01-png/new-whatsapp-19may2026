import { Injectable, Logger, Inject } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { InjectQueue } from "@nestjs/bull";
import type { Queue } from "bull";
import { AutomationStatus, AutomationRunStatus } from "@repo/database";

@Injectable()
export class AutomationsService {
  private readonly logger = new Logger(AutomationsService.name);

  constructor(@Inject(PrismaService) private prisma: PrismaService, @InjectQueue("automations") private automationQueue: Queue
  ) {}

  async findAll(tenantId: string) {
    return this.prisma.automation.findMany({
      where: { tenantId },
      orderBy: { updatedAt: "desc" },
    });
  }

  async findOne(tenantId: string, id: string) {
    return this.prisma.automation.findUnique({
      where: { id, tenantId },
      include: {
        runs: {
          orderBy: { startedAt: "desc" },
          take: 10,
        },
      },
    });
  }

  async create(tenantId: string, data: any) {
    return this.prisma.automation.create({
      data: {
        ...data,
        tenantId,
        trigger: data.trigger || { type: "MESSAGE_RECEIVED" },
        nodes: data.nodes || [],
        status: AutomationStatus.DRAFT,
      },
    });
  }

  async update(tenantId: string, id: string, data: any) {
    return this.prisma.automation.update({
      where: { id, tenantId },
      data,
    });
  }

  async delete(tenantId: string, id: string) {
    return this.prisma.automation.delete({
      where: { id, tenantId },
    });
  }

  async setStatus(tenantId: string, id: string, status: AutomationStatus) {
    return this.prisma.automation.update({
      where: { id, tenantId },
      data: { status },
    });
  }

  async triggerManual(tenantId: string, id: string, payload: any) {
    const automation = await this.prisma.automation.findUnique({
      where: { id, tenantId },
    });

    if (!automation) throw new Error("Automation not found");

    const run = await this.prisma.automationRun.create({
      data: {
        tenantId,
        automationId: id,
        executionLog: { trigger: payload },
        status: AutomationRunStatus.RUNNING,
      },
    });

    await this.automationQueue.add("execution", {
      runId: run.id,
      tenantId,
      automationId: id,
      payload,
    });

    return run;
  }
}
