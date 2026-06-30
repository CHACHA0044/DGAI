import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z
    .string()
    .default('3001')
    .transform((v) => parseInt(v, 10)),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DIRECT_URL: z.string().min(1, 'DIRECT_URL is required'),
  GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY is required'),
  GEMINI_MODEL: z.string().default('gemini-1.5-flash'),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  RATE_LIMIT_WINDOW_MS: z
    .string()
    .default('900000')
    .transform((v) => parseInt(v, 10)),
  RATE_LIMIT_MAX_REQUESTS: z
    .string()
    .default('100')
    .transform((v) => parseInt(v, 10)),
  AI_RATE_LIMIT_MAX: z
    .string()
    .default('20')
    .transform((v) => parseInt(v, 10)),
  MAX_RETRIES: z
    .string()
    .default('3')
    .transform((v) => parseInt(v, 10)),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌  Invalid or missing environment variables:\n');
  const errors = parsed.error.flatten().fieldErrors;
  Object.entries(errors).forEach(([key, msgs]) => {
    console.error(`  ${key}: ${msgs?.join(', ')}`);
  });
  console.error('\nPlease check your .env file and try again.');
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
