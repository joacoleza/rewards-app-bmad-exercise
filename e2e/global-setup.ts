import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import { hash } from 'bcryptjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const BCRYPT_ROUNDS = 12;

const seedUsers = [
  { email: 'admin@bmad.com', password: 'password123', role: 'manager' },
  { email: 'employee1@bmad.com', password: 'password123', role: 'employee' },
  { email: 'employee2@bmad.com', password: 'password123', role: 'employee' },
];

export default async function globalSetup() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is required for E2E tests');
  }

  const pool = new pg.Pool({ connectionString });

  console.log('[E2E globalSetup] Seeding test database...');

  try {
    for (const user of seedUsers) {
      const passwordHash = await hash(user.password, BCRYPT_ROUNDS);
      await pool.query(
        `INSERT INTO users (email, password_hash, role)
         VALUES ($1, $2, $3)
         ON CONFLICT (email) DO NOTHING`,
        [user.email, passwordHash, user.role],
      );
      console.log(`[E2E globalSetup]   ✅ ${user.email} (${user.role})`);
    }
    console.log('[E2E globalSetup] Seed complete.');
  } finally {
    await pool.end();
  }
}
