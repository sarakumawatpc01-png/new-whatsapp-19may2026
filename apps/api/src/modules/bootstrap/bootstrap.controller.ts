import { Controller, Get, UseGuards, Req , Inject} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards";
import { PrismaService } from "../../prisma/prisma.service";
import type { Request } from "express";

@Controller("bootstrap")
export class BootstrapController {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async getBootstrap(@Req() req: Request) {
    const user = (req as any).user;
    const tenantId = (user as any).tenant_id || (user as any).tenantId;
    if (!tenantId) throw new Error("No tenantId found in request");

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        subscriptions: { include: { plan: true }, take: 1 },
        featureFlags: true,
        whatsappAccounts: {
          include: {
            numbers: {
              select: { id: true, displayPhone: true, status: true, qualityRating: true },
            }
          }
        },
        branding: true,
      },
    });

    const userDetails = await this.prisma.user.findUnique({
      where: { id: (user as any).sub },
      select: { id: true, name: true, email: true, role: true, avatar: true },
    });

    // Load reseller branding if this is a SUB_TENANT
    let resellerBranding: {
      name: string;
      logo: string | null;
      primaryColor: string;
      accentColor: string;
    } = {
      name: "SaaS Platform",
      logo: null,
      primaryColor: "#0f172a",
      accentColor: "#3b82f6",
    };

    if (tenant?.resellerId) {
      const resellerTenant = await this.prisma.tenant.findUnique({
        where: { id: tenant.resellerId },
        include: { branding: true },
      });
      if (resellerTenant?.branding) {
        const branding = resellerTenant.branding as any;
        resellerBranding = {
          name: branding.companyName || resellerTenant.name,
          logo: branding.logoUrl,
          primaryColor: branding.primaryColor || "#0f172a",
          accentColor: branding.accentColor || "#3b82f6",
        };
      }
    }

    const numbers = tenant?.whatsappAccounts?.flatMap((a: any) => a.numbers) || [];

    return {
      success: true,
      data: {
        user: userDetails,
        tenant,
        featureFlags: tenant?.featureFlags || [],
        whatsappNumbers: numbers,
        resellerBranding,
      },
    };
  }
}
