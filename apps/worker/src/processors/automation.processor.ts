import { InjectQueue, Process, Processor } from "@nestjs/bull";
import { Logger, Inject } from "@nestjs/common";
import { type Job, type Queue } from "bull";
import { PrismaService } from "../prisma/prisma.service";
import axios from "axios";
import { AutomationRunStatus } from "@repo/database";

@Processor("automations")
export class AutomationProcessor {
  private readonly logger = new Logger(AutomationProcessor.name);

  constructor(@Inject(PrismaService) private prisma: PrismaService, @InjectQueue("whatsapp") private whatsappQueue: Queue,
    @InjectQueue("ai") private aiQueue: Queue,
    @InjectQueue("automations") private automationQueue: Queue
  ) {}

  @Process("execution")
  async handleExecution(job: Job<any>) {
    const { runId, tenantId, automationId, payload, nextNodeId } = job.data;
    this.logger.log(`Executing automation run: ${runId}, node: ${nextNodeId || "START"}`);

    try {
      const [run, automation] = await Promise.all([
        this.prisma.automationRun.findUnique({ where: { id: runId } }),
        this.prisma.automation.findUnique({ where: { id: automationId } })
      ]);

      if (!run || !automation) return;
      if (run.status === AutomationRunStatus.FAILED) return;

      const nodes = automation.nodes as any[];
      const edges = (automation as any).edges as any[] || [];
      
      let currentNode = nextNodeId 
        ? nodes.find(n => n.id === nextNodeId)
        : nodes.find(n => n.type === "trigger" || n.data?.isStart);

      if (!currentNode) {
        if (!nextNodeId) {
          await this.prisma.automationRun.update({
            where: { id: runId },
            data: { status: AutomationRunStatus.FAILED, error: "No start node found" }
          });
        }
        return;
      }

      const context = { ...payload, tenantId };
      const results = (run.executionLog as any)?.results || [];

      // Execute current node
      const result = await this.executeNode(currentNode, context);
      results.push({
        nodeId: currentNode.id,
        type: currentNode.type,
        action: currentNode.data?.action,
        status: result.success ? "SUCCESS" : "FAILED",
        result: result.data,
        error: result.error,
        executedAt: new Date()
      });

      if (!result.success) {
        await this.prisma.automationRun.update({
          where: { id: runId },
          data: { 
            status: AutomationRunStatus.FAILED, 
            executionLog: { results, error: result.error },
            error: result.error 
          }
        });
        return;
      }

      // Handle branching and next steps
      if (currentNode.data?.action === "wait") {
        const delayMs = (currentNode.data.delay || 60) * 1000;
        const nextEdge = edges.find(e => e.source === currentNode.id);
        if (nextEdge) {
          await this.automationQueue.add("execution", {
            runId, tenantId, automationId, payload, nextNodeId: nextEdge.target
          }, { delay: delayMs });
          
          await this.prisma.automationRun.update({
            where: { id: runId },
            data: { executionLog: { results, status: "WAITING" } }
          });
          return;
        }
      }

      // Normal flow or condition
      const possibleEdges = edges.filter(e => e.source === currentNode.id);
      let targetNodeId = null;

      if (currentNode.data?.action === "condition" && result.data?.branch) {
        const branchEdge = possibleEdges.find(e => e.sourceHandle === result.data.branch);
        targetNodeId = branchEdge?.target;
      } else {
        targetNodeId = possibleEdges[0]?.target;
      }

      if (targetNodeId) {
        // Recursive call (or add to queue with 0 delay to avoid stack overflow)
        await this.automationQueue.add("execution", {
          runId, tenantId, automationId, payload, nextNodeId: targetNodeId
        });
        
        await this.prisma.automationRun.update({
          where: { id: runId },
          data: { executionLog: { results } }
        });
      } else {
        // End of flow
        await this.prisma.automationRun.update({
          where: { id: runId },
          data: { 
            status: AutomationRunStatus.COMPLETED, 
            executionLog: { results },
            completedAt: new Date()
          }
        });
      }

    } catch (error: any) {
      this.logger.error(`Automation execution failed: ${error.stack}`);
      await this.prisma.automationRun.update({
        where: { id: runId },
        data: { status: AutomationRunStatus.FAILED, error: error.message }
      });
    }
  }

  private async executeNode(node: any, context: any): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const action = node.data?.action;
      
      switch (action) {
        case "send_message":
          await this.whatsappQueue.add("outgoing", {
            tenantId: context.tenantId,
            to: context.contact?.phone || context.from,
            type: "TEXT",
            body: this.replaceVariables(node.data.text, context),
          });
          return { success: true };

        case "ai_reply":
          await this.aiQueue.add("processing", {
            tenantId: context.tenantId,
            conversationId: context.conversationId,
            numberId: context.whatsappNumberId,
          });
          return { success: true };

        case "update_contact":
          const contactUpdate: any = {};
          if (node.data.tagsToAdd) {
            await this.prisma.contactTag.createMany({
               data: node.data.tagsToAdd.map((tagId: string) => ({ contactId: context.contactId, tagId })),
               skipDuplicates: true
            });
          }
          if (node.data.pipelineStageId) {
            contactUpdate.pipelineStageId = node.data.pipelineStageId;
          }
          if (Object.keys(contactUpdate).length > 0) {
            await this.prisma.contact.update({
              where: { id: context.contactId },
              data: contactUpdate
            });
          }
          return { success: true };

        case "webhook_call":
          const response = await axios.post(node.data.url, {
            ...context,
            timestamp: new Date().toISOString()
          }, { timeout: 10000 });
          return { success: true, data: response.data };

        case "condition":
          const variable = this.replaceVariables(`{{${node.data.variable}}}`, context);
          const expected = node.data.value;
          let match = false;
          
          switch (node.data.operator) {
            case "equals": match = variable === expected; break;
            case "contains": match = variable.includes(expected); break;
            case "gt": match = Number(variable) > Number(expected); break;
            default: match = variable === expected;
          }
          return { success: true, data: { branch: match ? "true" : "false" } };

        case "wait":
          return { success: true, data: { duration: node.data.delay } };

        default:
          return { success: true };
      }
    } catch (e: any) {
      this.logger.error(`Node ${node.id} execution error: ${e.message}`);
      return { success: false, error: e.message };
    }
  }

  private replaceVariables(text: string, context: any): string {
    if (!text) return "";
    return text.replace(/\{\{(.*?)\}\}/g, (match, path) => {
      const parts = path.trim().split(".");
      let value = context;
      for (const part of parts) {
        value = value?.[part];
      }
      return value !== undefined ? String(value) : match;
    });
  }
}
