import { Injectable, Inject } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { randomBytes, createHash } from "crypto";

@Injectable()
export class DevelopersService {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  async getApiKeys(tenantId: string) {
    return this.prisma.apiKey.findMany({
      where: { tenantId }
    });
  }

  async createApiKey(tenantId: string, name: string) {
    const rawKey = `sk_${randomBytes(24).toString("hex")}`;
    const keyHash = createHash("sha256").update(rawKey).digest("hex");
    
    const apiKey = await this.prisma.apiKey.create({
      data: {
        tenantId,
        name,
        keyHash,
        keyPreview: rawKey.substring(0, 8),
      }
    });

    // Only return rawKey once
    return { ...apiKey, rawKey };
  }

  async revokeApiKey(tenantId: string, id: string) {
    return this.prisma.apiKey.updateMany({
      where: { id, tenantId },
      data: { expiresAt: new Date() }
    });
  }
}
