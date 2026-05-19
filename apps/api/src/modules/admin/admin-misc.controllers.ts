import { Controller, Get, Post, Put, Patch, Body, Param, Query, UseGuards , Inject} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { JwtAuthGuard, RolesGuard } from "../auth/guards";
import { Roles, CurrentUser } from "../auth/decorators";
import { UserRole } from "@repo/database";

@Controller("admin/tickets")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.RESELLER_ADMIN)
export class SupportTicketsController {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  @Get()
  async findAll(@Query() query: any) {
    const { status, priority, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;

    const [items, total] = await Promise.all([
      this.prisma.ticket.findMany({
        where,
        include: { tenant: true, createdBy: true, assignedTo: true },
        orderBy: { updatedAt: "desc" },
        skip,
        take: Number(limit),
      }),
      this.prisma.ticket.count({ where }),
    ]);

    return { items, total, page: Number(page), limit: Number(limit) };
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    return this.prisma.ticket.findUnique({
      where: { id },
      include: { 
        tenant: true, 
        createdBy: true, 
        assignedTo: true, 
        messages: { orderBy: { createdAt: 'asc' } } 
      }
    });
  }

  @Post(":id/reply")
  async reply(@Param("id") id: string, @Body("content") content: string, @CurrentUser() user: any) {
    return this.prisma.ticketMessage.create({
      data: {
        ticketId: id,
        authorId: user.id,
        body: content,
      }
    });
  }

  @Patch(":id")
  async update(@Param("id") id: string, @Body() data: any) {
    return this.prisma.ticket.update({
      where: { id },
      data,
    });
  }
}

@Controller("admin/audit")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class AuditLogsController {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  @Get()
  async findAll(@Query() query: any) {
    const { action, userId, page = 1, limit = 50 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (action) where.action = action;
    if (userId) where.userId = userId;

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: { user: true },
        orderBy: { createdAt: "desc" },
        skip,
        take: Number(limit),
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { items, total };
  }
}

@Controller("admin/feature-flags")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class FeatureFlagsController {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  @Get()
  async findAll() {
    return this.prisma.globalFeatureFlag.findMany();
  }

  @Put(":feature")
  async toggle(@Param("feature") feature: string, @Body("enabled") enabled: boolean) {
    return this.prisma.globalFeatureFlag.upsert({
      where: { feature },
      update: { enabled },
      create: { feature, enabled }
    });
  }
}
