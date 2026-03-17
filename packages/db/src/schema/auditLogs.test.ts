import { describe, it, expect } from 'vitest';
import { getTableColumns } from 'drizzle-orm';
import { getTableConfig } from 'drizzle-orm/pg-core';
import { auditLogs } from './auditLogs.js';

describe('auditLogs schema', () => {
  const columns = getTableColumns(auditLogs);
  const tableConfig = getTableConfig(auditLogs);

  it('should have table name "audit_logs"', () => {
    expect(tableConfig.name).toBe('audit_logs');
  });

  it('should have all required columns', () => {
    const columnNames = Object.keys(columns);
    expect(columnNames).toContain('id');
    expect(columnNames).toContain('actorId');
    expect(columnNames).toContain('action');
    expect(columnNames).toContain('entityType');
    expect(columnNames).toContain('entityId');
    expect(columnNames).toContain('payload');
    expect(columnNames).toContain('createdAt');
    expect(columnNames).toHaveLength(7);
  });

  it('should have id as serial primary key', () => {
    expect(columns.id.dataType).toBe('number');
    expect(columns.id.notNull).toBe(true);
    expect(columns.id.primary).toBe(true);
  });

  it('should have actorId as integer (nullable FK to users)', () => {
    expect(columns.actorId.dataType).toBe('number');
    // actorId is nullable (no .notNull())
    expect(columns.actorId.notNull).toBe(false);
  });

  it('should have action as varchar(50), not null', () => {
    expect(columns.action.dataType).toBe('string');
    expect(columns.action.notNull).toBe(true);
  });

  it('should have entityType as varchar(50), not null', () => {
    expect(columns.entityType.dataType).toBe('string');
    expect(columns.entityType.notNull).toBe(true);
  });

  it('should have entityId as integer, not null', () => {
    expect(columns.entityId.dataType).toBe('number');
    expect(columns.entityId.notNull).toBe(true);
  });

  it('should have payload as jsonb (nullable)', () => {
    expect(columns.payload.dataType).toBe('json');
    expect(columns.payload.notNull).toBe(false);
    expect(columns.payload.columnType).toBe('PgJsonb');
  });

  it('should have createdAt as timestamp with timezone, not null, with default', () => {
    expect(columns.createdAt.notNull).toBe(true);
    expect(columns.createdAt.hasDefault).toBe(true);
  });

  it('should have idx_audit_logs_entity composite index', () => {
    const indexNames = tableConfig.indexes.map((idx) => idx.config.name);
    expect(indexNames).toContain('idx_audit_logs_entity');
  });

  it('should have foreign key reference to users table', () => {
    expect(tableConfig.foreignKeys.length).toBeGreaterThanOrEqual(1);
    const fk = tableConfig.foreignKeys[0];
    expect(fk).toBeDefined();
  });
});
