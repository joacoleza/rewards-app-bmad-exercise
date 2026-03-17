import { auditLogs } from '@rewards-app/db';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

export interface AuditLogEntry {
  actorId: number;
  action: string;
  entityType: string;
  entityId: number;
  payload?: Record<string, unknown>;
}

/**
 * Insert an audit log entry. Accepts a Drizzle client or transaction
 * so that audit writes can be wrapped in the same transaction as domain mutations.
 */
export async function logAuditEvent(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dbOrTx: NodePgDatabase<any>,
  entry: AuditLogEntry,
): Promise<void> {
  await dbOrTx.insert(auditLogs).values({
    actorId: entry.actorId,
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId,
    payload: entry.payload ?? null,
  });
}
