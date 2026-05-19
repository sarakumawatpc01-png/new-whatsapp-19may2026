import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Inject } from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { PrismaService } from "../prisma/prisma.service";
import { AuditAction } from "@repo/database";

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const { method, url, body, user } = req;

    return next.handle().pipe(
      tap(async (data) => {
        // Only log mutations
        if (method === "GET" || method === "OPTIONS") return;

        let action: AuditAction = AuditAction.UPDATE;
        if (method === "POST") action = AuditAction.CREATE;
        if (method === "DELETE") action = AuditAction.DELETE;

        // Basic resource extraction from URL, e.g. /api/contacts -> contacts
        const resource = url.split("/")[1] || "unknown";

        if (user && user.tenant_id) {
          try {
            await this.prisma.auditLog.create({
              data: {
                tenantId: user.tenant_id,
                userId: user.sub,
                action,
                resource,
                resourceId: data?.data?.id || undefined, // Best effort resource ID extraction
                before: undefined, // Hard to capture generically without hooks
                after: body || undefined,
                ipAddress: req.ip || req.socket.remoteAddress,
                userAgent: req.headers["user-agent"],
              }
            });
          } catch (e) {
            console.error("Failed to write audit log:", e);
          }
        }
      })
    );
  }
}
