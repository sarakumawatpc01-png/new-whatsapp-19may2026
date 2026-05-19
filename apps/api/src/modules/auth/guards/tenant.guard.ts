import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    if (!user || !user.tenantId) {
      throw new ForbiddenException("No tenant context found in request");
    }

    // Verify tenant status
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: user.tenantId },
      select: { status: true },
    });

    if (!tenant) {
      throw new ForbiddenException("Tenant not found");
    }

    if (tenant.status === "SUSPENDED" || tenant.status === "DELETED") {
      throw new ForbiddenException("Tenant is suspended or deleted");
    }

    return true;
  }
}
