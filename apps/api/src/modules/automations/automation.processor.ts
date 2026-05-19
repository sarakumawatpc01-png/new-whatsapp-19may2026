import { Process, Processor } from "@nestjs/bull";
import { Logger , Inject} from "@nestjs/common";
import type { Job } from "bull";
import { PrismaService } from "../../prisma/prisma.service";
import { WhatsAppService } from "../whatsapp/whatsapp.service";
import { AIService } from "../ai/ai.service";
import { AutomationRunStatus, MessageType } from "@repo/database";
import axios from "axios";

@Processor("automations")
export class AutomationProcessor {
  private readonly logger = new Logger(AutomationProcessor.name);

  constructor(@Inject(PrismaService) private prisma: PrismaService, @Inject(WhatsAppService) private whatsapp: WhatsAppService, @Inject(AIService) private ai: AIService) {}

  @Process("execution")
  async handleExecution(job: Job<any>) {
    const { runId, tenantId, automationId, payload } = job.data;
    
    try {
      const automation = await this.prisma.automation.findUnique({
        where: { id: automationId }
      });

      if (!automation) throw new Error("Automation not found");

      const nodes = automation.nodes as any[];
      const edges = (automation as any).edges as any[];
      
      // Start from the trigger node
      const startNode = nodes.find(n => n.type === 'trigger');
      if (!startNode) throw new Error("No trigger node found in flow");

      await this.executeNode(startNode.id, nodes, edges, tenantId, payload, runId);

      await this.prisma.automationRun.update({
        where: { id: runId },
        data: { 
          status: AutomationRunStatus.COMPLETED,
          completedAt: new Date()
        }
      });

    } catch (e: any) {
      this.logger.error(`Automation Run ${runId} Failed: ${e.message}`);
      await this.prisma.automationRun.update({
        where: { id: runId },
        data: { 
          status: AutomationRunStatus.FAILED,
          error: e.message,
          completedAt: new Date()
        }
      });
    }
  }

  private async executeNode(nodeId: string, nodes: any[], edges: any[], tenantId: string, payload: any, runId: string) {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    this.logger.debug(`Executing Node: ${node.id} (${node.data.label})`);

    // Log step in executionLog
    await this.prisma.automationRun.update({
      where: { id: runId },
      data: {
        executionLog: {
          ...(await this.prisma.automationRun.findUnique({ where: { id: runId } }))?.executionLog as any,
          [`step_${Date.now()}`]: { nodeId, label: node.data.label, status: 'COMPLETED' }
        }
      }
    });

    let nextNodeId: string | null = null;

    switch (node.data.action) {
      case 'send_message':
        await this.whatsapp.sendMessage({
          numberId: payload.numberId,
          to: payload.phone,
          type: MessageType.TEXT,
          body: this.replaceVariables(node.data.text, payload),
        });
        break;

      case 'ai_reply':
        const aiRes = await this.ai.testConfig(tenantId, payload.message || "Hi");
        await this.whatsapp.sendMessage({
          numberId: payload.numberId,
          to: payload.phone,
          type: MessageType.TEXT,
          body: aiRes.content,
        });
        break;

      case 'wait':
        const delay = (node.data.delay || 60) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        break;

      case 'webhook_call':
        await axios({
          method: node.data.method || 'POST',
          url: node.data.url,
          data: payload,
        });
        break;

      case 'condition':
        // Simplified condition: check if message contains a keyword
        const pass = payload.message?.toLowerCase().includes(node.data.keyword?.toLowerCase() || "");
        const edge = edges.find(e => e.source === nodeId && e.sourceHandle === (pass ? 'true' : 'false'));
        nextNodeId = edge?.target || null;
        break;
    }

    // Find next node via edges if not already set by condition
    if (!nextNodeId) {
      const edge = edges.find(e => e.source === nodeId);
      nextNodeId = edge?.target || null;
    }

    if (nextNodeId) {
      await this.executeNode(nextNodeId, nodes, edges, tenantId, payload, runId);
    }
  }

  private replaceVariables(text: string, payload: any): string {
    if (!text) return "";
    return text
      .replace(/{{contact.name}}/g, payload.contactName || "Customer")
      .replace(/{{contact.phone}}/g, payload.phone || "")
      .replace(/{{tenant.name}}/g, "Our Team");
  }
}
