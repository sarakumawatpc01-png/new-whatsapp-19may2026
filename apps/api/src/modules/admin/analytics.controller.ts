import { Controller, Get, Param, UseGuards , Inject} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { JwtAuthGuard, RolesGuard } from "../auth/guards";
import { Roles } from "../auth/decorators";
import { UserRole, TenantStatus, SubscriptionStatus } from "@repo/database";

@Controller("admin/analytics")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class AnalyticsController {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  @Get("overview")
  async getOverview() {
    const [totalTenants, activeTenants, trialingTenants, suspendedTenants] = await Promise.all([
      this.prisma.tenant.count(),
      this.prisma.tenant.count({ where: { status: TenantStatus.ACTIVE } }),
      this.prisma.tenant.count({ where: { status: TenantStatus.TRIAL } }),
      this.prisma.tenant.count({ where: { status: TenantStatus.SUSPENDED } }),
    ]);

    // MRR calculation (simplified)
    const activeSubs = await this.prisma.subscription.findMany({
      where: { status: SubscriptionStatus.ACTIVE },
      include: { plan: true }
    });
    
    const mrr = activeSubs.reduce((acc: number, sub: any) => {
        const planPrice = sub.plan?.monthlyPriceInr || 0;
        return acc + planPrice;
    }, 0);

    return {
      success: true,
      data: {
        tenants: { total: totalTenants, active: activeTenants, trialing: trialingTenants, suspended: suspendedTenants },
        mrr: mrr / 100, // Assuming paise to INR
        arr: (mrr * 12) / 100,
        aiUsage: { totalTokens: 1250000, cost: 45.20 } // Placeholder
      }
    };
  }

  @Get("tenants/:id")
  async getTenantAnalytics(@Param("id") id: string) {
    const [messages, contacts] = await Promise.all([
        this.prisma.message.count({ where: { tenantId: id } }),
        this.prisma.contact.count({ where: { tenantId: id } }),
    ]);

    return {
        success: true,
        data: {
            messages,
            contacts,
            aiCost: 2.50
        }
    };
  }
}
