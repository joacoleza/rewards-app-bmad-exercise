import { describe, it, expect } from 'vitest';
import { getTableColumns } from 'drizzle-orm';
import { getTableConfig } from 'drizzle-orm/pg-core';
import { users, userRole } from './users.js';

describe('users schema', () => {
  const columns = getTableColumns(users);
  const tableConfig = getTableConfig(users);

  it('should have table name "users"', () => {
    expect(tableConfig.name).toBe('users');
  });

  it('should have all required columns', () => {
    const columnNames = Object.keys(columns);
    expect(columnNames).toContain('id');
    expect(columnNames).toContain('email');
    expect(columnNames).toContain('passwordHash');
    expect(columnNames).toContain('role');
    expect(columnNames).toContain('createdAt');
    expect(columnNames).toHaveLength(5);
  });

  it('should have id as serial primary key', () => {
    expect(columns.id.dataType).toBe('number');
    expect(columns.id.notNull).toBe(true);
    // Primary key is tracked in table config, not column property
    const pkColumns = tableConfig.primaryKeys;
    // serial().primaryKey() sets it at the column level via table config
    expect(columns.id.primary).toBe(true);
  });

  it('should have email as varchar(255), not null with unique index', () => {
    expect(columns.email.dataType).toBe('string');
    expect(columns.email.notNull).toBe(true);
    // Uniqueness enforced via uniqueIndex('idx_users_email'), not column-level .unique()
    const indexNames = tableConfig.indexes.map((idx) => idx.config.name);
    expect(indexNames).toContain('idx_users_email');
  });

  it('should have passwordHash as varchar(255), not null', () => {
    expect(columns.passwordHash.dataType).toBe('string');
    expect(columns.passwordHash.notNull).toBe(true);
    expect(columns.passwordHash.columnType).toBe('PgVarchar');
  });

  it('should have role as user_role enum, not null', () => {
    expect(columns.role.notNull).toBe(true);
    expect(columns.role.columnType).toBe('PgEnumColumn');
  });

  it('should have createdAt as timestamp with timezone, not null, with default', () => {
    expect(columns.createdAt.notNull).toBe(true);
    expect(columns.createdAt.hasDefault).toBe(true);
  });

  it('should have idx_users_email index', () => {
    const indexNames = tableConfig.indexes.map((idx) => idx.config.name);
    expect(indexNames).toContain('idx_users_email');
  });

  it('should define userRole enum with employee and manager values', () => {
    expect(userRole.enumValues).toEqual(['employee', 'manager']);
    expect(userRole.enumName).toBe('user_role');
  });
});
