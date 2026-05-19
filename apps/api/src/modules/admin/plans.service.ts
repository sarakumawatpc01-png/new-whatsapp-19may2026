import { Injectable, Inject } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class PlansService {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.plan.findMany({
      orderBy: { monthlyPriceInr: "asc" }
    });
  }

  async create(data: any) {
    return this.prisma.plan.create({ data });
  }

  async update(id: string, data: any) {
    return this.prisma.plan.update({
      where: { id },
      data
    });
  }

  async archive(id: string) {
    return this.prisma.plan.update({
      where: { id },
      data: { isActive: false }
    });
  }

  async duplicate(id: string) {
    const plan = await this.prisma.plan.findUnique({ where: { id } });
    if (!plan) throw new Error("Plan not found");

    const { id: _, createdAt: __, updatedAt: ___, ...data } = plan as any;
    return this.prisma.plan.create({
      data: {
        ...data,
        name: `${plan.name} (Copy)`,
        slug: `${plan.slug}-copy-${Date.now()}`,
      }
    });
  }
}
