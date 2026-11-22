import { defineConfig } from 'drizzle-kit';

declare const process: {
  env: Record<string, string | undefined>;
};

export default defineConfig({
  schema: './libs/database/src/schema',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
