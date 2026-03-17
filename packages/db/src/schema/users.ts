import { pgTable, serial, varchar, timestamp, pgEnum, uniqueIndex } from 'drizzle-orm/pg-core';

export const userRole = pgEnum('user_role', ['employee', 'manager']);

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  role: userRole('role').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex('idx_users_email').on(table.email),
]);
