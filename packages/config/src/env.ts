import { z } from "zod";

const envSchema = z.object({
  // ── Core ──────────────────────────────────────
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().optional().transform(v => v ? Number(v) : 3000).default("3000"),

  // ── Auth ──────────────────────────────────────
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_PUBLIC_KEY: z.string().optional(),
  JWT_PRIVATE_KEY: z.string().optional(),
  NEXTAUTH_SECRET: z.string().min(32),
  NEXTAUTH_URL: z.string().url(),
  ENCRYPTION_KEY: z.string().optional(),

  // ── Meta / WhatsApp ───────────────────────────
  META_APP_ID: z.string(),
  META_APP_SECRET: z.string(),
  META_VERIFY_TOKEN: z.string(),
  META_SYSTEM_USER_TOKEN: z.string().optional(),
  META_CONFIG_ID: z.string().optional(),
  META_API_VERSION: z.string().default("v19.0"),
  META_REGISTRATION_PIN: z.string().optional(),

  // ── AI Providers ──────────────────────────────
  OPENROUTER_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  GOOGLE_AI_API_KEY: z.string().optional(),

  // ── Object Storage (MinIO/S3) ─────────────────
  S3_ENDPOINT: z.string().url(),
  S3_BUCKET: z.string(),
  S3_ACCESS_KEY: z.string(),
  S3_SECRET_KEY: z.string(),

  // ── Email ─────────────────────────────────────
  RESEND_API_KEY: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional().transform(v => v ? Number(v) : undefined),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),

  // ── Payments ──────────────────────────────────
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),

  // ── Frontend / Public ─────────────────────────
  FRONTEND_URL: z.string().url().optional(),
  NEXT_PUBLIC_API_URL: z.string().url(),
  NEXT_PUBLIC_WS_URL: z.string().url(),
  NEXT_PUBLIC_META_APP_ID: z.string().optional(),
  NEXT_PUBLIC_META_CONFIG_ID: z.string().optional(),

  // ── Monitoring ────────────────────────────────
  SENTRY_DSN: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

let env: Env;

export function getEnv(): Env {
  if (!env) {
    const parsed = envSchema.safeParse(process.env);
    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      const missing = Object.entries(errors)
        .map(([key, msgs]) => `  ${key}: ${(msgs || []).join(", ")}`)
        .join("\n");

      const errorMsg = `\n❌ Invalid environment variables:\n${missing}\n`;

      if (process.env.NODE_ENV === "production") {
        // FAIL FAST — do not start with missing env vars in production
        throw new Error(errorMsg);
      }

      // Dev mode: log warning but continue with fallback
      console.warn(errorMsg);
      return process.env as any;
    }
    env = parsed.data;
  }
  return env;
}
