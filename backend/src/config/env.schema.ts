import { z } from 'zod';

const WEAK_SECRET_PATTERN =
  /change-me|changeme|secret-min-32|your[-_]?secret|example|GENERATE_WITH/i;

const jwtSecretSchema = z
  .string()
  .min(32)
  .refine((value) => !WEAK_SECRET_PATTERN.test(value), {
    message: 'JWT secret must be a unique random value (not a placeholder)',
  });

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  BACKEND_PORT: z.coerce.number().default(3001),
  DATABASE_URL: z.string().min(1),
  DIRECT_DATABASE_URL: z.string().min(1).optional(),
  REDIS_URL: z.string().min(1),

  JWT_ACCESS_SECRET: jwtSecretSchema,
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('30d'),
  CORS_ORIGIN: z
    .string()
    .default('http://localhost')
    .refine(
      (value) =>
        !value
          .split(',')
          .map((part) => part.trim())
          .includes('*'),
      {
        message: 'CORS_ORIGIN cannot be * when using credentialed cookies; list explicit origins',
      },
    ),
  UPLOAD_DIR: z.string().min(1).optional(),
  APP_URL: z.string().url().optional(),
  SMTP_HOST: z.string().min(1).optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),

  AI_TOKEN_ENC_KEY: z
    .string()
    .min(1)
    .optional()
    .refine(
      (value) => {
        if (!value) return true;
        try {
          return Buffer.from(value, 'base64').length === 32;
        } catch {
          return false;
        }
      },
      { message: 'AI_TOKEN_ENC_KEY must be base64-encoded 32 bytes' },
    ),
  RAG_EMBEDDING_MODEL: z.string().min(1).default('text-embedding-3-small'),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(config);

  if (!parsed.success) {
    const message = parsed.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid environment configuration: ${message}`);
  }

  return parsed.data;
}
