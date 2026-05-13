import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';
import { URL } from 'url';

dotenv.config();

const dbUrl = new URL(process.env.DATABASE_URL!);
const useSSL = process.env.DATABASE_SSL === 'true';

export default {
  schema: './src/database/schema/index.ts',
  out: './src/database/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    host: dbUrl.hostname,
    port: parseInt(dbUrl.port || '5432'),
    user: decodeURIComponent(dbUrl.username),
    password: decodeURIComponent(dbUrl.password),
    database: dbUrl.pathname.slice(1),
    ssl: useSSL ? 'require' : false,
  },
  verbose: true,
  strict: true,
} satisfies Config;
