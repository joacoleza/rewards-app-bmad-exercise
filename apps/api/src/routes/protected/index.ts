import type { FastifyInstance } from 'fastify';
import { requireAuth, requireRole } from '../../plugins/auth.js';

/**
 * Test-only routes for validating RBAC enforcement.
 * GET /api/protected/any — requireAuth (any authenticated user)
 * GET /api/protected/manager — requireRole('manager') (managers only)
 */
export default async function protectedRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/any',
    { preHandler: [requireAuth] },
    async (request) => {
      return { ok: true, user: request.user };
    },
  );

  fastify.get(
    '/manager',
    { preHandler: [requireRole('manager')] },
    async (request) => {
      return { ok: true, user: request.user };
    },
  );
}
