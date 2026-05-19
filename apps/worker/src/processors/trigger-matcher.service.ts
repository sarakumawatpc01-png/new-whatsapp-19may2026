import { Injectable, Logger, Inject } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { InjectQueue } from "@nestjs/bull";
import type { Queue } from "bull";
import { AutomationRunStatus, AutomationStatus } from "@repo/database";

@Injectable()
export class TriggerMatcherService {
  private readonly logger = new Logger(TriggerMatcherService.name);

  constructor(@Inject(PrismaService) private prisma: PrismaService, @InjectQueue("automations") private automationQueue: Queue
  ) {}

  async matchAndExecute(tenantId: string, triggerType: string, payload: any) {
    this.logger.log(`Matching automations for trigger: ${triggerType} (Tenant: ${tenantId})`);

    const automations = await this.prisma.automation.findMany({
      where: {
        tenantId,
        status: AutomationStatus.ACTIVE,
        trigger: this.mapTriggerType(triggerType),
      },
    });

    for (const automation of automations) {
      this.logger.log(`Found matching automation: ${automation.name} (${automation.id})`);

      if (this.evaluateTrigger(automation, payload)) {
        const run = await this.prisma.automationRun.create({
          data: {
            tenantId,
            automationId: automation.id,
            conversationId: payload.conversationId,
            executionLog: { trigger: payload },
            status: AutomationRunStatus.RUNNING,
          },
        });

        await this.automationQueue.add("execution", {
          runId: run.id,
          tenantId,
          automationId: automation.id,
          payload,
        });
      }
    }
  }

  private mapTriggerType(type: string): any {
    const map: any = {
      "message.received": "MESSAGE_RECEIVED",
      "conversation.created": "CONVERSATION_CREATED",
      "contact.created": "CONTACT_CREATED",
    };
    return map[type] || "MESSAGE_RECEIVED";
  }

  private evaluateTrigger(automation: any, payload: any): boolean {
    const config = automation.triggerConfig as any;
    if (!config) return true;

    if (config.keywords && config.keywords.length > 0) {
      const body = (payload.content || "").toLowerCase();
      return config.keywords.some((k: string) => body.includes(k.toLowerCase()));
    }

    return true;
  }
}
