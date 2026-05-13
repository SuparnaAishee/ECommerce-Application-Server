import dotenv from "dotenv";
import path from "path";
import { z } from "zod";

dotenv.config({ path: path.join(process.cwd(), ".env") });

// Env values pasted via the Vercel dashboard can carry a trailing newline
// or stray whitespace. .trim() everywhere keeps a bad paste from breaking prod.
const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  DATABASE_URL: z.string().trim().url(),

  BCRYPT_SALT_ROUND: z.coerce.number().int().min(4).max(15).default(12),

  JWT_ACCESS_SECRET: z.string().trim().min(32, "JWT_ACCESS_SECRET must be >=32 chars"),
  JWT_ACCESS_EXPIRES_IN: z.string().trim().default("10d"),
  JWT_REFRESH_SECRET: z.string().trim().min(32, "JWT_REFRESH_SECRET must be >=32 chars"),
  JWT_REFRESH_EXPIRES_IN: z.string().trim().default("30d"),

  RESET_PASSWORD_SECRET: z.string().trim().min(32),
  RESET_PASSWORD_EXPIRES_IN: z.string().trim().default("5m"),

  CLIENT_BASE_URL: z.string().trim().url(),
  SERVER_BASE_URL: z.string().trim().url(),

  CORS_ALLOWED_ORIGINS: z
    .string()
    .trim()
    .optional()
    .transform((v) =>
      v
        ? v
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined,
    ),

  SENDER_EMAIL: z.string().trim().email().optional(),
  APP_PASSWORD: z.string().trim().optional(),

  // Resend (preferred). When set, used instead of Gmail SMTP.
  RESEND_API_KEY: z.string().trim().optional(),
  RESEND_FROM_EMAIL: z
    .string()
    .trim()
    .email()
    .default("onboarding@resend.dev"),

  PAYMENT_URL: z.string().trim().url(),
  PAYMENT_VERIFY_URL: z.string().trim().url(),
  STORE_ID: z.string().trim().min(1),
  SIGNATURE_KEY: z.string().trim().min(1),

  // AI Shopping Assistant — chat API proxies user messages to this n8n webhook
  N8N_WEBHOOK_URL: z
    .string()
    .trim()
    .url()
    .default("http://localhost:5678/webhook/chat"),
  N8N_REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(30000),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("\nInvalid environment variables:");
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
  }
  console.error("");
  process.exit(1);
}

const env = parsed.data;

export default {
  node_env: env.NODE_ENV,
  port: env.PORT,
  database_url: env.DATABASE_URL,
  bcrypt_salt_round: env.BCRYPT_SALT_ROUND,
  jwt_access_secret: env.JWT_ACCESS_SECRET,
  jwt_access_expires_in: env.JWT_ACCESS_EXPIRES_IN,
  jwt_refresh_secret: env.JWT_REFRESH_SECRET,
  jwt_refresh_expires_in: env.JWT_REFRESH_EXPIRES_IN,
  reset_password_secret: env.RESET_PASSWORD_SECRET,
  reset_password_expires_in: env.RESET_PASSWORD_EXPIRES_IN,
  client_base_url: env.CLIENT_BASE_URL,
  server_base_url: env.SERVER_BASE_URL,
  cors_allowed_origins: env.CORS_ALLOWED_ORIGINS,
  sender_email: env.SENDER_EMAIL,
  app_password: env.APP_PASSWORD,
  resend_api_key: env.RESEND_API_KEY,
  resend_from_email: env.RESEND_FROM_EMAIL,
  payment_url: env.PAYMENT_URL,
  payment_verify_url: env.PAYMENT_VERIFY_URL,
  store_id: env.STORE_ID,
  signature_key: env.SIGNATURE_KEY,
  n8n_webhook_url: env.N8N_WEBHOOK_URL,
  n8n_request_timeout_ms: env.N8N_REQUEST_TIMEOUT_MS,
};
