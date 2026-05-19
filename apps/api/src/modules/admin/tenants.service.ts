import { Injectable, Logger, HttpException, HttpStatus, Inject } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { TenantStatus, UserRole, SubscriptionStatus, PaymentProvider } from "@repo/database";

@Injectable()
export class TenantsService {
  private readonly logger = new Logger(TenantsService.name);

  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  async findAll(query: any) {
    const { search, status, resellerId, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
      ];
    }
    if (status) where.status = status;
    if (resellerId) where.resellerId = resellerId;

    const [items, total] = await Promise.all([
      this.prisma.tenant.findMany({
        where,
        include: {
          subscriptions: { 
            include: { plan: true },
            orderBy: { createdAt: 'desc' },
            take: 1
          },
          reseller: true,
          _count: {
            select: { users: true, whatsappAccounts: true }
          }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: Number(limit),
      }),
      this.prisma.tenant.count({ where }),
    ]);

    return {
      items: items.map((item: any) => ({
        ...item,
        subscription: item.subscriptions[0] || null
      })),
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        hasMore: total > skip + items.length,
      },
    };
  }

  async findOne(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        subscriptions: { 
          include: { plan: true },
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        reseller: true,
        aiConfig: true,
        _count: {
          select: { users: true, whatsappAccounts: true, contacts: true }
        }
      },
    });

    if (!tenant) return null;

    return {
      ...tenant,
      subscription: (tenant as any).subscriptions[0] || null
    };
  }

  async update(id: string, data: any) {
    return this.prisma.tenant.update({
      where: { id },
      data,
    });
  }

  async suspend(id: string, adminId: string) {
    const tenant = await this.prisma.tenant.update({
      where: { id },
      data: { status: TenantStatus.SUSPENDED },
    });

    await this.prisma.auditLog.create({
      data: {
        tenantId: id,
        userId: adminId,
        action: "SUSPEND",
        resource: "TENANT",
        resourceId: id,
        after: { tenantName: tenant.name, timestamp: new Date().toISOString() }
      }
    });

    return tenant;
  }

  async activate(id: string, adminId: string) {
    const tenant = await this.prisma.tenant.update({
      where: { id },
      data: { status: TenantStatus.ACTIVE },
    });

    await this.prisma.auditLog.create({
      data: {
        tenantId: id,
        userId: adminId,
        action: "ACTIVATE",
        resource: "TENANT",
        resourceId: id,
        after: { tenantName: tenant.name, timestamp: new Date().toISOString() }
      }
    });

    return tenant;
  }

  async changePlan(id: string, planId: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: { tenantId: id },
      orderBy: { createdAt: 'desc' }
    });

    if (subscription) {
      return this.prisma.subscription.update({
        where: { id: subscription.id },
        data: { planId }
      });
    } else {
      return this.prisma.subscription.create({
        data: {
          tenantId: id,
          planId,
          status: SubscriptionStatus.ACTIVE,
          provider: PaymentProvider.STRIPE,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        }
      });
    }
  }

  async impersonate(id: string, adminId: string) {
    const user = await this.prisma.user.findFirst({
      where: { tenantId: id, role: UserRole.TENANT_OWNER }
    });
    if (!user) {
      throw new HttpException("No owner found for tenant", HttpStatus.NOT_FOUND);
    }

    await this.prisma.auditLog.create({
      data: {
        tenantId: id,
        userId: adminId,
        action: "IMPERSONATE",
        resource: "USER",
        resourceId: user.id,
        after: { targetUserId: user.id, targetEmail: user.email }
      }
    });
    
    const { generateToken } = await import("@repo/auth");
    const token = generateToken({
      sub: user.id,
      tenant_id: id,
      role: user.role,
      sessionId: "impersonation-" + Date.now()
    });

    return { token, user: { id: user.id, name: user.name, email: user.email } };
  }

  async resetQuota(id: string, adminId: string) {
    const config = await this.prisma.tenantAIConfig.update({
      where: { tenantId: id },
      data: { systemPrompt: "" } 
    });

    await this.prisma.auditLog.create({
      data: {
        tenantId: id,
        userId: adminId,
        action: "UPDATE",
        resource: "TENANT_AI_CONFIG",
        resourceId: id,
        after: { timestamp: new Date().toISOString() }
      }
    });

    return config;
  }
}
