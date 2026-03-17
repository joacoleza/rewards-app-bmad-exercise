import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { users } from '../schema/users.js';
import { auditLogs } from '../schema/auditLogs.js';

export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;
export type AuditLog = InferSelectModel<typeof auditLogs>;
export type NewAuditLog = InferInsertModel<typeof auditLogs>;
