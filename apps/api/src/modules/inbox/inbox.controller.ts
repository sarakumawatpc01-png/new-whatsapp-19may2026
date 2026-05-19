import { 
  Controller, 
  Get, 
  Post, 
  Patch, 
  Body, 
  Param, 
  Query, 
  UseGuards, 
  HttpStatus, 
  HttpCode 
, Inject} from "@nestjs/common";
import { InboxService } from "./inbox.service";
import { JwtAuthGuard } from "../auth/guards";
import { CurrentTenant, CurrentUser } from "../auth/decorators";
import { InboxGateway } from "../../gateways/inbox.gateway";
import { ConversationStatus } from "@repo/database";

@Controller("inbox")
@UseGuards(JwtAuthGuard)
export class InboxController {
  constructor(@Inject(InboxService) private inboxService: InboxService, @Inject(InboxGateway) private inboxGateway: InboxGateway) {}

  @Get("conversations")
  async getConversations(
    @CurrentTenant() tenant: any,
    @Query() query: any
  ) {
    const data = await this.inboxService.getConversations(tenant.id, query);
    return { success: true, data };
  }

  @Get("conversations/:id")
  async getConversation(
    @CurrentTenant() tenant: any,
    @Param("id") id: string
  ) {
    const data = await this.inboxService.getConversation(tenant.id, id);
    return { success: true, data };
  }

  @Get("conversations/:id/messages")
  async getMessages(
    @CurrentTenant() tenant: any,
    @Param("id") id: string,
    @Query("cursor") cursor: string,
    @Query("limit") limit: string
  ) {
    const data = await this.inboxService.getMessages(tenant.id, id, cursor, limit ? parseInt(limit) : 50);
    return { success: true, data };
  }

  @Patch("conversations/:id")
  async updateConversation(
    @CurrentTenant() tenant: any,
    @Param("id") id: string,
    @Body() body: any
  ) {
    const data = await this.inboxService.updateConversation(tenant.id, id, body);
    this.inboxGateway.emitToConversation(id, "conversation:update", data);
    this.inboxGateway.emitToTenant(tenant.id, "conversation:update", data);
    return { success: true, data };
  }

  @Post("conversations/:id/assign")
  async assignAgent(
    @CurrentTenant() tenant: any,
    @Param("id") id: string,
    @Body("agentId") agentId: string
  ) {
    const data = await this.inboxService.assignAgent(tenant.id, id, agentId);
    this.inboxGateway.emitToConversation(id, "conversation:assigned", data);
    this.inboxGateway.emitToTenant(tenant.id, "conversation:update", data);
    return { success: true, data };
  }

  @Post("conversations/:id/resolve")
  async resolve(
    @CurrentTenant() tenant: any,
    @Param("id") id: string
  ) {
    const data = await this.inboxService.updateConversation(tenant.id, id, { 
      status: ConversationStatus.RESOLVED, 
      resolvedAt: new Date() 
    });
    this.inboxGateway.emitToConversation(id, "conversation:update", data);
    this.inboxGateway.emitToTenant(tenant.id, "conversation:update", data);
    return { success: true, data };
  }

  @Post("conversations/:id/reopen")
  async reopen(
    @CurrentTenant() tenant: any,
    @Param("id") id: string
  ) {
    const data = await this.inboxService.updateConversation(tenant.id, id, { 
      status: ConversationStatus.OPEN 
    });
    this.inboxGateway.emitToConversation(id, "conversation:update", data);
    this.inboxGateway.emitToTenant(tenant.id, "conversation:update", data);
    return { success: true, data };
  }

  @Post("conversations/:id/snooze")
  async snooze(
    @CurrentTenant() tenant: any,
    @Param("id") id: string,
    @Body("until") until: string
  ) {
    const data = await this.inboxService.snooze(tenant.id, id, new Date(until));
    this.inboxGateway.emitToConversation(id, "conversation:update", data);
    this.inboxGateway.emitToTenant(tenant.id, "conversation:update", data);
    return { success: true, data };
  }

  @Post("messages/send")
  async sendMessage(
    @CurrentTenant() tenant: any,
    @Body() body: any
  ) {
    const data = await this.inboxService.sendMessage(tenant.id, body);
    this.inboxGateway.emitToConversation(body.conversationId, "message:new", data);
    this.inboxGateway.emitToTenant(tenant.id, "conversation:update", { id: body.conversationId, lastMessage: data });
    return { success: true, data };
  }

  @Post("conversations/:id/notes")
  async addNote(
    @CurrentTenant() tenant: any,
    @CurrentUser() user: any,
    @Param("id") id: string,
    @Body("content") content: string
  ) {
    const data = await this.inboxService.addNote(tenant.id, id, user.id, content);
    this.inboxGateway.emitToConversation(id, "message:new", { ...data, isNote: true });
    return { success: true, data };
  }

  @Post("conversations/:id/typing")
  @HttpCode(HttpStatus.OK)
  async setTyping(
    @CurrentUser() user: any,
    @Param("id") id: string
  ) {
    await this.inboxService.setTyping(id, user.name);
    this.inboxGateway.emitToConversation(id, "agent:typing", { agentName: user.name });
    return { success: true };
  }

  @Get("conversations/:id/viewers")
  async getViewers(@Param("id") id: string) {
    const data = await this.inboxService.getViewers(id);
    return { success: true, data };
  }

  @Post("conversations/:id/viewing")
  @HttpCode(HttpStatus.OK)
  async registerViewer(
    @CurrentUser() user: any,
    @Param("id") id: string
  ) {
    await this.inboxService.registerViewer(id, user.id);
    return { success: true };
  }
}
