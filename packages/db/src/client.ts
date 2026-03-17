import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema/index.js';

function getConnectionString(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL environment variable is required');
  }
  return url;
}

export const pool = new pg.Pool({
  connectionString: getConnectionString(),
});

export const db = drizzle(pool, { schema });

// Graceful shutdown — drain the pool on process exit
const shutdown = () => { pool.end(); };
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
