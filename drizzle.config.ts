import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'sqlite',
  driver: 'expo',
  schema: './src/lib/drizzle/schema.ts',
  out: './drizzle',
});
