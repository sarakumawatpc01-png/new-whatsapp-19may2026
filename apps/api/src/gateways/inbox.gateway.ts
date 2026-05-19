import { 
  WebSocketGateway, 
  WebSocketServer, 
  SubscribeMessage, 
  OnGatewayConnection, 
  OnGatewayDisconnect 
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { Logger } from "@nestjs/common";
import * as jwt from "jsonwebtoken";
import { getEnv } from "@repo/config";

@WebSocketGateway({
  cors: { origin: "*" },
  namespace: "inbox",
})
export class InboxGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;
  private readonly logger = new Logger(InboxGateway.name);

  handleConnection(client: Socket) {
    try {
      // Authenticate via JWT token from handshake
      const token = client.handshake.auth?.token || client.handshake.query?.token as string;
      
      if (!token) {
        this.logger.warn(`Client ${client.id} rejected: no auth token`);
        client.emit("error", { message: "Authentication required" });
        client.disconnect();
        return;
      }

      const secret = getEnv().JWT_SECRET;
      const decoded = jwt.verify(token, secret) as any;
      const tenantId = decoded.tenantId || decoded.tenant_id;
      const userId = decoded.sub || decoded.userId;

      if (!tenantId) {
        this.logger.warn(`Client ${client.id} rejected: no tenantId in token`);
        client.disconnect();
        return;
      }

      // Store auth info on socket for later use
      (client as any).tenantId = tenantId;
      (client as any).userId = userId;

      // Join tenant room and user room
      client.join(`tenant:${tenantId}`);
      if (userId) {
        client.join(`user:${userId}`);
      }
      
      this.logger.log(`Client ${client.id} authenticated: tenant=${tenantId}, user=${userId}`);
    } catch (err: any) {
      this.logger.warn(`Client ${client.id} rejected: invalid token — ${err.message}`);
      client.emit("error", { message: "Invalid authentication token" });
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client ${client.id} disconnected`);
  }

  @SubscribeMessage("join:conversation")
  handleJoinConversation(client: Socket, conversationId: string) {
    client.join(`conversation:${conversationId}`);
    this.logger.log(`Client ${client.id} joined conversation room: ${conversationId}`);
  }

  @SubscribeMessage("leave:conversation")
  handleLeaveConversation(client: Socket, conversationId: string) {
    client.leave(`conversation:${conversationId}`);
    this.logger.log(`Client ${client.id} left conversation room: ${conversationId}`);
  }

  emitToConversation(conversationId: string, event: string, data: any) {
    this.server.to(`conversation:${conversationId}`).emit(event, data);
  }

  emitToTenant(tenantId: string, event: string, data: any) {
    this.server.to(`tenant:${tenantId}`).emit(event, data);
  }

  emitToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }
}
