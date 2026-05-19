import { Injectable, Logger, Inject } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class ContactsService {
  private readonly logger = new Logger(ContactsService.name);

  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  async findAll(tenantId: string, query: any) {
    const { 
      search, 
      tags, 
      pipelineStageId, 
      optedOut, 
      minLeadScore,
      maxLeadScore,
      page = 1, 
      limit = 20 
    } = query;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where: any = {
      tenantId,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      where.tags = {
        some: {
          tagId: { in: tagArray }
        }
      };
    }

    if (optedOut !== undefined) {
      where.optedOut = optedOut === "true" || optedOut === true;
    }

    if (pipelineStageId) {
      where.pipelineStageId = pipelineStageId;
    }

    if (minLeadScore || maxLeadScore) {
      where.leadScore = {
        ...(minLeadScore && { gte: Number(minLeadScore) }),
        ...(maxLeadScore && { lte: Number(maxLeadScore) }),
      };
    }

    const [items, total] = await Promise.all([
      this.prisma.contact.findMany({
        where,
        include: {
          tags: {
            include: { tag: true }
          },
          pipelineStage: true,
          _count: {
            select: { conversations: true }
          }
        },
        orderBy: { updatedAt: "desc" },
        skip,
        take,
      }),
      this.prisma.contact.count({ where }),
    ]);

    return {
      items,
      total,
      page: Number(page),
      limit: take,
    };
  }

  async findOne(tenantId: string, id: string) {
    return this.prisma.contact.findUnique({
      where: { id, tenantId },
      include: {
        tags: {
          include: { tag: true }
        },
        pipelineStage: true,
        notes: {
          orderBy: { createdAt: "desc" },
          take: 20
        },
        conversations: {
          include: { number: true },
          orderBy: { lastMessageAt: "desc" },
          take: 5
        }
      }
    });
  }

  async create(tenantId: string, data: any) {
    const { tags, ...rest } = data;
    return this.prisma.contact.create({
      data: {
        ...rest,
        tenantId,
        ...(tags && {
          tags: {
            create: tags.map((tagId: string) => ({ tagId }))
          }
        })
      },
      include: { tags: { include: { tag: true } } }
    });
  }

  async update(tenantId: string, id: string, data: any) {
    const { tags, ...rest } = data;

    if (tags !== undefined) {
      await this.prisma.contactTag.deleteMany({
        where: { contactId: id }
      });
      if (tags && tags.length > 0) {
        await this.prisma.contactTag.createMany({
          data: tags.map((tagId: string) => ({
            contactId: id,
            tagId
          }))
        });
      }
    }

    return this.prisma.contact.update({
      where: { id, tenantId },
      data: rest,
      include: { tags: { include: { tag: true } }, pipelineStage: true }
    });
  }

  async delete(tenantId: string, id: string) {
    return this.prisma.contact.delete({
      where: { id, tenantId },
    });
  }

  async bulkDelete(tenantId: string, ids: string[]) {
    return this.prisma.contact.deleteMany({
      where: { id: { in: ids }, tenantId }
    });
  }

  async bulkUpdate(tenantId: string, ids: string[], data: any) {
    return this.prisma.contact.updateMany({
      where: { id: { in: ids }, tenantId },
      data
    });
  }

  async bulkTag(tenantId: string, contactIds: string[], tagIds: string[], action: "add" | "remove") {
    if (action === "add") {
      for (const contactId of contactIds) {
        for (const tagId of tagIds) {
          await this.prisma.contactTag.upsert({
            where: { contactId_tagId: { contactId, tagId } },
            update: {},
            create: { contactId, tagId }
          });
        }
      }
    } else {
      await this.prisma.contactTag.deleteMany({
        where: {
          contactId: { in: contactIds },
          tagId: { in: tagIds }
        }
      });
    }
  }

  async addNote(tenantId: string, contactId: string, content: string, authorId: string) {
    return this.prisma.contactNote.create({
      data: {
        contactId,
        authorId,
        content
      }
    });
  }

  async getTimeline(tenantId: string, id: string) {
    const [messages, conversations, notes, tags] = await Promise.all([
      this.prisma.message.findMany({
        where: { tenantId, conversation: { contactId: id } },
        orderBy: { createdAt: "desc" },
        take: 30
      }),
      this.prisma.conversation.findMany({
        where: { tenantId, contactId: id },
        orderBy: { createdAt: "desc" },
        take: 10
      }),
      this.prisma.contactNote.findMany({
        where: { contactId: id },
        orderBy: { createdAt: "desc" },
        take: 20
      }),
      this.prisma.contactTag.findMany({
        where: { contactId: id },
        include: { tag: true },
        orderBy: { createdAt: "desc" } as any
      })
    ]);

    const events = [
      ...messages.map((m) => ({ type: "message", data: m, date: m.createdAt })),
      ...conversations.map((c) => ({ type: "conversation", data: c, date: c.createdAt })),
      ...notes.map((n) => ({ type: "note", data: n, date: n.createdAt })),
      ...tags.map((t) => ({ type: "tag", data: t, date: (t as any).createdAt }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return events;
  }
}
