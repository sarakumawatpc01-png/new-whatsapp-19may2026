import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { PrismaClient } from "@repo/database";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super();
  }

  async onModuleInit() {
    await (this as any).$connect();
  }

  async onModuleDestroy() {
    await (this as any).$disconnect();
  }

  // Helper getters for models that might have type issues during extension
  get customDomain() { return (this as any).customDomain; }
  get tenantBranding() { return (this as any).tenantBranding; }
  get emailVerification() { return (this as any).emailVerification; }
}
