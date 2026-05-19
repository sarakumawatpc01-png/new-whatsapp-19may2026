import "reflect-metadata";
export * from "./guards/api-auth.guard";
export * from "./guards/tenant.guard";
import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { verifyToken } from "@repo/auth";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const isPublic = Reflect.getMetadata("isPublic", context.getHandler());
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.split(" ")[1];
    if (!token) return false;
    try {
      const payload = verifyToken(token);
      request.user = { 
        id: payload.sub,
        sub: payload.sub,
        tenantId: payload.tenant_id,
        role: payload.role,
        sessionId: payload.sessionId,
      };
      // Set tenant on request so @CurrentTenant() works
      request.tenant = { id: payload.tenant_id };
      return true;
    } catch {
      return false;
    }
  }
}

@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const requiredRoles = Reflect.getMetadata("roles", context.getHandler());
    if (!requiredRoles) return true;
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role: string) => user.role === role);
  }
}
