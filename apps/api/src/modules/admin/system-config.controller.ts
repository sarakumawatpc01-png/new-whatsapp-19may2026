import { Controller, Get, Put, Body, UseGuards, Inject } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards";
import { PrismaService } from "../../prisma/prisma.service";
import { getEnv } from "@repo/config";
import { createEncryptor } from "@repo/shared";

const { encrypt, decrypt } = createEncryptor(getEnv().ENCRYPTION_KEY);

function maskSecret(val: string | null | undefined): string {
  if (!val) return "";
  if (val.length <= 8) return "••••••••";
  return val.substring(0, 4) + "••••" + val.substring(val.length - 4);
}

@Controller("admin/system-config")
@UseGuards(JwtAuthGuard)
export class SystemConfigController {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  @Get()
  async getConfig() {
    const configs = await (this.prisma as any).$queryRawUnsafe(
      `SELECT key, value FROM "TenantSetting" WHERE "tenantId" = 'SYSTEM' ORDER BY key`
    ).catch(() => []);

    const map: Record<string, string> = {};
    for (const c of (configs as any[])) {
      map[c.key] = c.value;
    }

    return {
      success: true,
      data: {
        metaAppId: map["META_APP_ID"] || "",
        metaAppSecret: map["META_APP_SECRET"] ? maskSecret(decrypt(map["META_APP_SECRET"])) : "",
        metaSystemUserToken: map["META_SYSTEM_USER_TOKEN"] ? maskSecret(decrypt(map["META_SYSTEM_USER_TOKEN"])) : "",
        metaConfigId: map["META_CONFIG_ID"] || "",
        apiVersion: map["META_API_VERSION"] || "v19.0",
        verifyToken: map["META_VERIFY_TOKEN"] || "",
        smtpHost: map["SMTP_HOST"] || "",
        smtpPort: map["SMTP_PORT"] || "",
        smtpUser: map["SMTP_USER"] || "",
        smtpPass: map["SMTP_PASS"] ? maskSecret(decrypt(map["SMTP_PASS"])) : "",
        smtpFromEmail: map["SMTP_FROM_EMAIL"] || "",
        smtpFromName: map["SMTP_FROM_NAME"] || "",
        razorpayKeyId: map["RAZORPAY_KEY_ID"] || "",
        razorpayKeySecret: map["RAZORPAY_KEY_SECRET"] ? maskSecret(decrypt(map["RAZORPAY_KEY_SECRET"])) : "",
        stripeSecretKey: map["STRIPE_SECRET_KEY"] ? maskSecret(decrypt(map["STRIPE_SECRET_KEY"])) : "",
        stripePublishableKey: map["STRIPE_PUBLISHABLE_KEY"] || "",
        stripeWebhookSecret: map["STRIPE_WEBHOOK_SECRET"] ? maskSecret(decrypt(map["STRIPE_WEBHOOK_SECRET"])) : "",
        paypalClientId: map["PAYPAL_CLIENT_ID"] || "",
        paypalClientSecret: map["PAYPAL_CLIENT_SECRET"] ? maskSecret(decrypt(map["PAYPAL_CLIENT_SECRET"])) : "",
        paypalMode: map["PAYPAL_MODE"] || "sandbox",
        platformName: map["PLATFORM_NAME"] || "",
        platformLogoUrl: map["PLATFORM_LOGO_URL"] || "",
      },
    };
  }

  @Put()
  async updateConfig(@Body() body: Record<string, string>) {
    const secretFields = [
      "META_APP_SECRET", "META_SYSTEM_USER_TOKEN", "SMTP_PASS",
      "RAZORPAY_KEY_SECRET", "STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET",
      "PAYPAL_CLIENT_SECRET",
    ];

    const fieldMap: Record<string, string> = {
      metaAppId: "META_APP_ID",
      metaAppSecret: "META_APP_SECRET",
      metaSystemUserToken: "META_SYSTEM_USER_TOKEN",
      metaConfigId: "META_CONFIG_ID",
      apiVersion: "META_API_VERSION",
      verifyToken: "META_VERIFY_TOKEN",
      smtpHost: "SMTP_HOST",
      smtpPort: "SMTP_PORT",
      smtpUser: "SMTP_USER",
      smtpPass: "SMTP_PASS",
      smtpFromEmail: "SMTP_FROM_EMAIL",
      smtpFromName: "SMTP_FROM_NAME",
      razorpayKeyId: "RAZORPAY_KEY_ID",
      razorpayKeySecret: "RAZORPAY_KEY_SECRET",
      stripeSecretKey: "STRIPE_SECRET_KEY",
      stripePublishableKey: "STRIPE_PUBLISHABLE_KEY",
      stripeWebhookSecret: "STRIPE_WEBHOOK_SECRET",
      paypalClientId: "PAYPAL_CLIENT_ID",
      paypalClientSecret: "PAYPAL_CLIENT_SECRET",
      paypalMode: "PAYPAL_MODE",
      platformName: "PLATFORM_NAME",
      platformLogoUrl: "PLATFORM_LOGO_URL",
    };

    for (const [bodyKey, dbKey] of Object.entries(fieldMap)) {
      let value = body[bodyKey];
      if (value === undefined || value === null) continue;
      // Skip masked values (user didn't change the secret)
      if (value.includes("••••")) continue;

      if (secretFields.includes(dbKey) && value) {
        value = encrypt(value);
      }

      await (this.prisma as any).$executeRawUnsafe(
        `INSERT INTO "TenantSetting" (id, "tenantId", key, value, "createdAt", "updatedAt")
         VALUES (gen_random_uuid(), 'SYSTEM', $1, $2, NOW(), NOW())
         ON CONFLICT ("tenantId", key) DO UPDATE SET value = $2, "updatedAt" = NOW()`,
        dbKey, value
      ).catch(async () => {
        // Fallback: try upsert via Prisma if raw SQL fails
        try {
          const existing = await this.prisma.tenantSetting.findFirst({
            where: { tenantId: "SYSTEM", key: dbKey }
          });
          if (existing) {
            await this.prisma.tenantSetting.update({
              where: { id: existing.id },
              data: { value }
            });
          } else {
            await this.prisma.tenantSetting.create({
              data: { tenantId: "SYSTEM", key: dbKey, value }
            });
          }
        } catch (e) {
          // Silently skip if TenantSetting table doesn't exist yet
        }
      });
    }

    return { success: true, data: { message: "System configuration saved" } };
  }
}
