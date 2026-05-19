import { Injectable, Inject } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class PlansService {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { monthlyPriceInr: "asc" },
    });
  }

  async findById(id: string) {
    return this.prisma.plan.findUnique({
      where: { id },
    });
  }
}
