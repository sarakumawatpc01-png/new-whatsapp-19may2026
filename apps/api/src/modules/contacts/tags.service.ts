import { Injectable, Inject } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class TagsService {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.tag.findMany({
      where: { tenantId },
      include: {
        _count: {
          select: { contactTags: true }
        }
      }
    });
  }

  async create(tenantId: string, data: any) {
    return this.prisma.tag.create({
      data: {
        ...data,
        tenantId,
      }
    });
  }

  async update(tenantId: string, id: string, data: any) {
    return this.prisma.tag.update({
      where: { id, tenantId },
      data,
    });
  }

  async delete(tenantId: string, id: string) {
    return this.prisma.tag.delete({
      where: { id, tenantId },
    });
  }
}
