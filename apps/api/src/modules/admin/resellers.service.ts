import { Injectable, HttpException, HttpStatus, Inject } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { TenantType } from "@repo/database";

@Injectable()
export class AdminResellersService {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  async findAll(query: any) {
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.tenant.findMany({
        where: { type: TenantType.RESELLER },
        include: {
          _count: {
            select: { subTenants: true }
          }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: Number(limit),
      }),
      this.prisma.tenant.count({ where: { type: TenantType.RESELLER } }),
    ]);

    return {
      items,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        hasMore: total > skip + items.length,
      },
    };
  }

  async findOne(id: string) {
    return this.prisma.tenant.findUnique({
      where: { id, type: TenantType.RESELLER },
      include: {
        subTenants: true,
        users: true,
        branding: true,
      }
    });
  }

  async create(data: any) {
    return this.prisma.tenant.create({
      data: {
        ...data,
        type: TenantType.RESELLER,
      }
    });
  }

  async update(id: string, data: any) {
    return this.prisma.tenant.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.tenant.delete({ where: { id } });
  }

  async updateBranding(id: string, data: any) {
    return this.prisma.tenantBranding.upsert({
      where: { tenantId: id },
      update: data,
      create: { ...data, tenantId: id },
    });
  }

  async updateSmtp(id: string, data: any) {
     // SMTP settings can be stored in TenantSetting or dedicated fields
     return this.prisma.tenantSetting.upsert({
       where: { tenantId_key: { tenantId: id, key: 'SMTP_CONFIG' } },
       update: { value: JSON.stringify(data) },
       create: { tenantId: id, key: 'SMTP_CONFIG', value: JSON.stringify(data) }
     });
  }

  async setDomain(id: string, domain: string) {
    return this.prisma.customDomain.upsert({
      where: { domain },
      update: { tenantId: id },
      create: { tenantId: id, domain }
    });
  }

  async verifyDomain(id: string) {
    const customDomain = await this.prisma.customDomain.findFirst({
      where: { tenantId: id }
    });
    if (!customDomain) throw new Error("No domain set");
    
    // In real app, check DNS here
    return this.prisma.customDomain.update({
      where: { id: customDomain.id },
      data: { verifiedAt: new Date(), status: 'ACTIVE' }
    });
  }
}
