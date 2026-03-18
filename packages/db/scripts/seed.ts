import dotenv from 'dotenv';
import path from 'path';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { hash } from 'bcryptjs';
import { users } from '../src/schema/users.js';

dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

const BCRYPT_ROUNDS = 12;

const seedUsers = [
  { email: 'admin@bmad.com', password: 'password123', role: 'manager' as const },
  { email: 'employee1@bmad.com', password: 'password123', role: 'employee' as const },
  { email: 'employee2@bmad.com', password: 'password123', role: 'employee' as const },
];

async function seed() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  const pool = new pg.Pool({ connectionString });
  const db = drizzle(pool);

  console.log('🌱 Seeding database...');

  for (const user of seedUsers) {
    const passwordHash = await hash(user.password, BCRYPT_ROUNDS);

    // Idempotent: ON CONFLICT DO NOTHING
    await db
      .insert(users)
      .values({
        email: user.email,
        passwordHash,
        role: user.role,
      })
      .onConflictDoNothing({ target: users.email });

    console.log(`  ✅ User ${user.email} (${user.role}) — seeded (skipped if exists)`);
  }

  console.log('🌱 Seed complete!');
  await pool.end();
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
