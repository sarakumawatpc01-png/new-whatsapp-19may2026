import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Inject } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import * as crypto from "crypto";

@Injectable()
export class ApiAuthGuard implements CanActivate {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKeyHeader = request.headers["x-api-key"];

    if (!apiKeyHeader || typeof apiKeyHeader !== "string") {
      throw new UnauthorizedException("API key missing");
    }

    const hash = crypto.createHash("sha256").update(apiKeyHeader).digest("hex");
    
    const key = await this.prisma.apiKey.findUnique({
      where: { keyHash: hash },
      include: { tenant: true }
    });

    if (!key) {
      throw new UnauthorizedException("Invalid API key");
    }

    // Attach tenant to request
    (request as any).tenant = key.tenant;
    
    // Update last used asynchronously
    this.prisma.apiKey.update({
      where: { id: key.id },
      data: { lastUsedAt: new Date() }
    }).catch(console.error);

    return true;
  }
}
