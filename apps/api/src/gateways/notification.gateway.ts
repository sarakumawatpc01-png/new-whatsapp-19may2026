import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { getEnv } from "@repo/config";

@WebSocketGateway({
  cors: { origin: "*" },
  namespace: "notifications",
})
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  handleConnection(client: Socket) {
    const tenantId = client.handshake.query.tenantId as string;
    const userId = client.handshake.query.userId as string;
    if (tenantId && userId) {
      client.join(`user:${userId}`);
      client.join(`tenant:${tenantId}`);
    }
  }

  handleDisconnect(client: Socket) {
    // rooms are automatically left
  }

  sendToUser(userId: string, notification: any) {
    this.server.to(`user:${userId}`).emit("new_notification", notification);
  }
}
