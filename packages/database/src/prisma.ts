import { PrismaClient } from "@prisma/client";
import { getEnv } from "@repo/config";

const env = getEnv();

const prismaClientSingleton = () => {
  const client = new PrismaClient({
    datasources: {
      db: {
        url: env.DATABASE_URL,
      },
    },
  });

  client.$use(async (params: any, next: (params: any) => Promise<any>) => {
    const modelsWithoutTenant = ["Tenant", "User", "Reseller", "Plan", "SystemConfig", "AuditLog", "PaymentWebhook", "WebhookEvent"];
    
    if (!params.model || modelsWithoutTenant.includes(params.model)) {
      return next(params);
    }

    // List of actions that must have a tenant_id
    const writeActions = ["create", "update", "delete", "upsert", "createMany", "updateMany", "deleteMany"];
    const readActions = ["findUnique", "findFirst", "findMany", "count", "aggregate", "groupBy"];

    if (writeActions.includes(params.action)) {
      if (params.action === "create" || params.action === "upsert") {
        if (!params.args.data?.tenantId && !params.args.data?.tenant_id) {
           console.error(`❌ CRITICAL: Attempted to ${params.action} ${params.model} without tenant_id`);
           // In production, we should throw here
        }
      } else {
        // For updates/deletes, ensure where has tenantId
        if (!params.args.where?.tenantId && !params.args.where?.tenant_id) {
           console.warn(`⚠️ Warning: ${params.action} ${params.model} without tenant filter in WHERE clause`);
        }
      }
    }

    if (readActions.includes(params.action)) {
      if (!params.args.where?.tenantId && !params.args.where?.tenant_id) {
         // Automatically inject tenant_id if we can find it in the context?
         // Prisma middleware doesn't easily have access to request context.
         // Usually this is done via a service that wraps prisma.
      }
    }

    return next(params);
  });

  return client;
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

export const prisma = globalThis.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
}
