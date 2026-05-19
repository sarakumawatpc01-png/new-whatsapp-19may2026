import { Injectable, CanActivate, ExecutionContext, ForbiddenException, SetMetadata, Inject } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PrismaService } from "../prisma/prisma.service";

export const RequireFeature = (feature: string) => SetMetadata("feature", feature);

@Injectable()
export class FeatureFlagGuard implements CanActivate {
  constructor(@Inject(Reflector) private reflector: Reflector, @Inject(PrismaService) private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const feature = this.reflector.get<string>("feature", context.getHandler());
    if (!feature) return true;

    const request = context.switchToHttp().getRequest();
    const tenantId = request.user?.tenant_id || request.tenant?.id;

    if (!tenantId) throw new ForbiddenException("Tenant ID required for feature check");

    const flag = await this.prisma.tenantFeatureFlag.findUnique({
      where: {
        tenantId_feature: {
          tenantId,
          feature: feature
        }
      }
    });

    if (!flag || !flag.enabled) {
      throw new ForbiddenException(`Feature '${feature}' is not enabled for this tenant.`);
    }

    return true;
  }
}
