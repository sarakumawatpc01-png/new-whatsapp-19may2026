import { Inject, Logger } from "@nestjs/common";
import { Process, Processor } from "@nestjs/bull";
import type { Job } from "bull";
import nodemailer from "nodemailer";
import { render } from "@react-email/render";
import { PrismaService } from "../prisma/prisma.service";
import { getEnv } from "@repo/config";
import { createEncryptor } from "@repo/shared";
import { EmailVerification, PasswordReset, WelcomeEmail } from "@repo/emails";

@Processor("email:send")
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);
  private readonly encryptor = createEncryptor(getEnv().ENCRYPTION_KEY);

  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  @Process("send")
  async handleSend(job: Job<any>) {
    const { tenantId, to, template, data } = job.data;

    if (!to) {
      throw new Error("Email job missing recipient");
    }

    const branding = tenantId
      ? await this.prisma.tenantBranding.findUnique({ where: { tenantId } })
      : null;
    const systemSettings = await this.loadSystemSettings();

    const smtpHost = branding?.smtpHost || systemSettings.SMTP_HOST || getEnv().SMTP_HOST;
    const smtpPort = branding?.smtpPort || systemSettings.SMTP_PORT || getEnv().SMTP_PORT;
    const smtpUser = branding?.smtpUser || systemSettings.SMTP_USER || getEnv().SMTP_USER;
    const smtpPassEncrypted = branding?.smtpPassEncrypted || systemSettings.SMTP_PASS;
    const smtpPass = smtpPassEncrypted ? this.decryptValue(smtpPassEncrypted) : getEnv().SMTP_PASS;

    if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
      throw new Error("SMTP configuration is incomplete");
    }

    const fromEmail = branding?.emailFromEmail || systemSettings.SMTP_FROM_EMAIL || smtpUser;
    const fromName = branding?.emailFromName || systemSettings.SMTP_FROM_NAME || "WhatsApp SaaS";
    const { subject, html } = this.renderTemplate(template, data || {}, {
      logoUrl: branding?.logoUrl,
      primaryColor: branding?.primaryColor,
      tenantName: branding?.dashboardTitle,
    });

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: Number(smtpPort),
      secure: Number(smtpPort) === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    await transporter.sendMail({
      from: `${fromName} <${fromEmail}>`,
      to,
      subject,
      html,
    });

    this.logger.log(`Email sent to ${to} (${template})`);
  }

  private renderTemplate(template: string, data: any, branding: any) {
    switch (template) {
      case "email-verification":
        return {
          subject: "Verify your email",
          html: render(EmailVerification({
            ...branding,
            name: data.name || "there",
            verifyUrl: data.verifyUrl,
          })),
        };
      case "password-reset":
        return {
          subject: "Reset your password",
          html: render(PasswordReset({
            ...branding,
            resetUrl: data.resetUrl,
          })),
        };
      case "welcome":
        return {
          subject: "Welcome to your new workspace",
          html: render(WelcomeEmail({
            ...branding,
            name: data.name || "there",
            loginUrl: data.loginUrl,
          })),
        };
      default:
        return {
          subject: data.subject || "Notification",
          html: data.html || `<p>${data.body || "No content provided."}</p>`,
        };
    }
  }

  private decryptValue(value: string) {
    try {
      return this.encryptor.decrypt(value);
    } catch (error: any) {
      this.logger.warn(`Failed to decrypt SMTP secret: ${error.message}`);
      return value;
    }
  }

  private async loadSystemSettings() {
    const settings = await this.prisma.tenantSetting.findMany({
      where: {
        tenantId: "SYSTEM",
        key: {
          in: [
            "SMTP_HOST",
            "SMTP_PORT",
            "SMTP_USER",
            "SMTP_PASS",
            "SMTP_FROM_EMAIL",
            "SMTP_FROM_NAME",
          ],
        },
      },
    }).catch(() => []);

    const map: Record<string, any> = {};
    for (const setting of settings) {
      const value = setting.value;
      map[setting.key] = typeof value === "string" ? value : value === null ? undefined : String(value);
    }

    return {
      SMTP_HOST: map.SMTP_HOST,
      SMTP_PORT: map.SMTP_PORT ? Number(map.SMTP_PORT) : undefined,
      SMTP_USER: map.SMTP_USER,
      SMTP_PASS: map.SMTP_PASS,
      SMTP_FROM_EMAIL: map.SMTP_FROM_EMAIL,
      SMTP_FROM_NAME: map.SMTP_FROM_NAME,
    };
  }
}
