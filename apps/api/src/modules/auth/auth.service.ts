import { Injectable, Inject, Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { hashPassword, comparePassword, generateToken, generateRefreshToken, verifyToken } from "@repo/auth";
import { getEnv } from "@repo/config";
import { randomBytes, createHash } from "crypto";
import { UserRole, TenantStatus, SubscriptionStatus, TenantType } from "@repo/database";
import { InjectQueue } from "@nestjs/bull";
import type { Queue } from "bull";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private prisma: PrismaService;
  constructor(
    @Inject(PrismaService) prisma: PrismaService,
    @InjectQueue("email:send") private emailQueue: Queue
  ) {
    this.prisma = prisma;
    this.logger.log(`Initialized with Prisma: ${!!prisma}`);
  }

  async signup(email: string, password: string, name: string) {
    this.logger.log(`Signup initiated for ${email}`);
    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      this.logger.warn(`Signup conflict: user ${email} already exists`);
      throw new Error("CONFLICT");
    }

    const passwordHash = await hashPassword(password);

    this.logger.debug(`Creating tenant for ${email}`);
    const tenant = await this.prisma.tenant.create({
      data: {
        name: `${name}'s Workspace`,
        slug: name.toLowerCase().replace(/\s/g, "-") + "-" + Math.random().toString(36).substring(7), // Ensure unique slug
        type: TenantType.PLATFORM,
        status: TenantStatus.TRIAL,
      },
    });

    this.logger.debug(`Creating user record`);
    const user = await this.prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        role: UserRole.TENANT_OWNER,
        tenantId: tenant.id,
      },
    });

    this.logger.debug(`Creating trial subscription`);
    const selectedPlan =
      await this.prisma.plan.findFirst({
        where: {
          isActive: true,
          slug: { in: ["trial", "trial-plan"] },
        },
        orderBy: { sortOrder: "asc" },
      }) ||
      await this.prisma.plan.findFirst({
        where: { isActive: true, isPublic: true },
        orderBy: { sortOrder: "asc" },
      });

    if (selectedPlan) {
      const trialDays = Math.max(1, selectedPlan.trialDays || 14);
      await this.prisma.subscription.create({
        data: {
          tenantId: tenant.id,
          planId: selectedPlan.id,
          status: SubscriptionStatus.TRIALING,
          provider: "STRIPE",
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000),
          trialEnd: new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000),
        },
      });
    } else {
      this.logger.warn(`No active plan found during signup for ${email}; skipping subscription bootstrap`);
    }

    this.logger.debug(`Creating branding and feature flags`);
    await this.prisma.tenantBranding.create({
      data: { tenantId: tenant.id },
    });

    await this.prisma.tenantFeatureFlag.createMany({
      data: [
        { tenantId: tenant.id, feature: "WHATSAPP", enabled: true },
        { tenantId: tenant.id, feature: "AI_ENGINE", enabled: true },
        { tenantId: tenant.id, feature: "AUTOMATION", enabled: true },
        { tenantId: tenant.id, feature: "CRM", enabled: true },
        { tenantId: tenant.id, feature: "CAMPAIGNS", enabled: true },
        { tenantId: tenant.id, feature: "BILLING", enabled: true },
        { tenantId: tenant.id, feature: "API_ACCESS", enabled: false },
      ],
    });

    this.logger.debug(`Creating notification preferences`);
    await this.prisma.notificationPreference.createMany({
      data: [
        { userId: user.id, tenantId: tenant.id, notificationType: "NEW_CONVERSATION", inApp: true, email: true },
        { userId: user.id, tenantId: tenant.id, notificationType: "MESSAGE_UNASSIGNED", inApp: true, email: true },
        { userId: user.id, tenantId: tenant.id, notificationType: "AI_QUOTA_WARNING", inApp: true, email: true },
        { userId: user.id, tenantId: tenant.id, notificationType: "AI_QUOTA_EXCEEDED", inApp: true, email: true },
        { userId: user.id, tenantId: tenant.id, notificationType: "PAYMENT_FAILED", inApp: true, email: true },
        { userId: user.id, tenantId: tenant.id, notificationType: "PAYMENT_SUCCESS", inApp: true, email: false },
        { userId: user.id, tenantId: tenant.id, notificationType: "SUBSCRIPTION_RENEWAL", inApp: true, email: true },
        { userId: user.id, tenantId: tenant.id, notificationType: "TRIAL_ENDING", inApp: true, email: true },
        { userId: user.id, tenantId: tenant.id, notificationType: "WHATSAPP_QUALITY_DROP", inApp: true, email: true },
        { userId: user.id, tenantId: tenant.id, notificationType: "CAMPAIGN_COMPLETED", inApp: true, email: false },
        { userId: user.id, tenantId: tenant.id, notificationType: "AUTOMATION_FAILED", inApp: true, email: true },
      ],
    });

    this.logger.debug(`Creating email verification token`);
    const verificationToken = randomBytes(32).toString("hex");
    await this.prisma.emailVerification.create({
      data: {
        token: verificationToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    const apiBaseUrl = getEnv().NEXT_PUBLIC_API_URL;
    const frontendBaseUrl = getEnv().FRONTEND_URL || getEnv().NEXTAUTH_URL || apiBaseUrl.replace(/\/api$/, "");
    const verifyUrl = `${apiBaseUrl}/auth/verify-email?token=${verificationToken}`;

    try {
      await this.emailQueue.add("send", {
        tenantId: tenant.id,
        userId: user.id,
        to: user.email,
        template: "email-verification",
        data: { name: user.name, verifyUrl, loginUrl: `${frontendBaseUrl}/login` },
      }, {
        attempts: 3,
        backoff: { type: "exponential", delay: 2000 },
      });
    } catch (error: any) {
      this.logger.error(`Failed to queue verification email: ${error.message}`);
    }

    this.logger.debug(`Generating JWT tokens and session`);
    const payload = { sub: user.id, tenant_id: tenant.id, role: user.role };
    const accessToken = generateToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await this.prisma.session.create({
      data: {
        userId: user.id,
        refreshTokenHash: createHash('sha256').update(refreshToken).digest('hex'),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    this.logger.log(`Signup completed for ${email}, tenant=${tenant.id}`);
    return { user, tenant, accessToken, refreshToken };
  }

  async login(email: string, password: string, ipAddress: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash || !await comparePassword(password, user.passwordHash)) {
      throw new Error("UNAUTHORIZED");
    }
    if (!user.emailVerified && process.env.NODE_ENV === 'production') {
      throw new Error("EMAIL_NOT_VERIFIED");
    }
    if (user.status !== 'ACTIVE') {
      throw new Error("FORBIDDEN");
    }
    const tenant = await this.prisma.tenant.findUnique({ where: { id: user.tenantId ?? undefined } });
    if (!tenant || ["SUSPENDED", "DELETED"].includes(tenant.status)) {
      throw new Error("TENANT_SUSPENDED");
    }
    const payload = { sub: user.id, tenant_id: tenant.id, role: user.role, sessionId: "" };
    const accessToken = generateToken(payload);
    const refreshToken = generateRefreshToken(payload);
    await this.prisma.session.create({
      data: {
        userId: user.id,
        refreshTokenHash: createHash('sha256').update(refreshToken).digest('hex'),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
    return { user, tenant, accessToken, refreshToken };
  }

  async superadminLogin(email: string, password: string, ipAddress: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash || !await comparePassword(password, user.passwordHash)) {
      throw new Error("UNAUTHORIZED");
    }
    if (user.role !== 'SUPER_ADMIN') {
      throw new Error("FORBIDDEN");
    }
    
    const payload = { sub: user.id, role: user.role, sessionId: "" };
    const accessToken = generateToken(payload);
    const refreshToken = generateRefreshToken(payload);
    await this.prisma.session.create({
      data: {
        userId: user.id,
        refreshTokenHash: createHash('sha256').update(refreshToken).digest('hex'),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
    return { user, accessToken, refreshToken };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = verifyToken(refreshToken);
      const refreshTokenHash = createHash('sha256').update(refreshToken).digest('hex');
      const session = await this.prisma.session.findFirst({ where: { refreshTokenHash } });
      if (!session || session.expiresAt < new Date()) {
        throw new Error("UNAUTHORIZED");
      }
      const newPayload = { sub: payload.sub, tenant_id: payload.tenant_id, role: payload.role, sessionId: session.id };
      const newAccessToken = generateToken(newPayload);
      const newRefreshToken = generateRefreshToken(newPayload);
      
      await this.prisma.session.update({
        where: { id: session.id },
        data: { refreshTokenHash: createHash('sha256').update(newRefreshToken).digest('hex') }
      });

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch {
      throw new Error("UNAUTHORIZED");
    }
  }

  async logout(refreshToken: string) {
    const refreshTokenHash = createHash('sha256').update(refreshToken).digest('hex');
    await this.prisma.session.deleteMany({ where: { refreshTokenHash } });
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return;
    const token = randomBytes(32).toString("hex");
    await this.prisma.passwordReset.create({
      data: {
        token,
        userId: user.id,
        expiresAt: new Date(Date.now() + 1 * 60 * 60 * 1000),
      },
    });

    const apiBaseUrl = getEnv().NEXT_PUBLIC_API_URL;
    const frontendBaseUrl = getEnv().FRONTEND_URL || getEnv().NEXTAUTH_URL || apiBaseUrl.replace(/\/api$/, "");
    const resetUrl = `${frontendBaseUrl}/reset-password?token=${token}`;

    try {
      await this.emailQueue.add("send", {
        tenantId: user.tenantId,
        userId: user.id,
        to: user.email,
        template: "password-reset",
        data: { resetUrl },
      }, {
        attempts: 3,
        backoff: { type: "exponential", delay: 2000 },
      });
    } catch (error: any) {
      this.logger.error(`Failed to queue password reset email: ${error.message}`);
    }
  }

  async resetPassword(token: string, newPassword: string) {
    const reset = await this.prisma.passwordReset.findFirst({ where: { token, used: false, expiresAt: { gt: new Date() } } });
    if (!reset) throw new Error("BAD_REQUEST");
    const passwordHash = await hashPassword(newPassword);
    await this.prisma.user.update({ where: { id: reset.userId }, data: { passwordHash } });
    await this.prisma.passwordReset.update({ where: { id: reset.id }, data: { used: true } });
    await this.prisma.session.deleteMany({ where: { userId: reset.userId } });
  }

  async verifyEmail(token: string) {
    const verification = await this.prisma.emailVerification.findFirst({ where: { token, expiresAt: { gt: new Date() } } });
    if (!verification) throw new Error("BAD_REQUEST");
    await this.prisma.user.update({ where: { id: verification.userId }, data: { emailVerified: true } });
    await this.prisma.emailVerification.delete({ where: { id: verification.id } });
  }

  async updateProfile(userId: string, name: string) {
    if (!name || name.length < 2) throw new Error("INVALID_NAME");
    return this.prisma.user.update({
      where: { id: userId },
      data: { name },
    });
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.passwordHash || !await comparePassword(currentPassword, user.passwordHash)) {
      throw new Error("INVALID_CURRENT_PASSWORD");
    }
    const passwordHash = await hashPassword(newPassword);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }

  async updateAvatar(userId: string, url: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { avatar: url },
    });
  }
}
