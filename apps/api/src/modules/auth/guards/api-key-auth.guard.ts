import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, ForbiddenException, Inject } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PrismaService } from "../../../prisma/prisma.service";
import * as bcrypt from "bcryptjs";

@Injectable()
export class ApiKeyAuthGuard implements CanActivate {
  constructor(@Inject(PrismaService) private prisma: PrismaService, @Inject(Reflector) private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers["authorization"];

    if (!authHeader || !authHeader.startsWith("Bearer wsa_")) {
      throw new UnauthorizedException("Missing or invalid API key");
    }

    const rawKey = authHeader.split(" ")[1];
    if (!rawKey) {
      throw new UnauthorizedException("Missing API key");
    }

    const prefix = rawKey.substring(0, 16);

    // Find all keys with this prefix (should be unique, but prefix-based for perf)
    const candidates = await this.prisma.apiKey.findMany({
      where: { keyPreview: prefix, isActive: true },
    });

    if (candidates.length === 0) {
      throw new UnauthorizedException("Invalid API key");
    }

    // bcrypt compare against each candidate
    let keyRecord = null;
    for (const candidate of candidates) {
      const isValid = await bcrypt.compare(rawKey, candidate.keyHash);
      if (isValid) {
        keyRecord = candidate;
        break;
      }
    }

    if (!keyRecord) {
      throw new UnauthorizedException("Invalid API key");
    }

    // Check expiration
    if (keyRecord.expiresAt && keyRecord.expiresAt < new Date()) {
      throw new UnauthorizedException("API key expired");
    }

    // Validate scope if route has required scopes
    const requiredScopes = this.reflector.get<string[]>("scopes", context.getHandler());
    if (requiredScopes && requiredScopes.length > 0) {
      const hasScope = requiredScopes.every((s: string) => keyRecord!.scopes.includes(s));
      if (!hasScope) {
        throw new ForbiddenException(
          `Insufficient scopes. Required: ${requiredScopes.join(", ")}`,
        );
      }
    }

    // Update last used at (non-blocking)
    this.prisma.apiKey.update({
      where: { id: keyRecord.id },
      data: { 
        lastUsedAt: new Date(),
        usageCount: { increment: 1 }
      },
    }).catch(() => {/* non-critical */});

    // Set user/tenant in request
    request.user = {
      tenant_id: keyRecord.tenantId,
      permissions: keyRecord.scopes,
      isApiKey: true,
      apiKeyId: keyRecord.id,
    };

    return true;
  }
}
