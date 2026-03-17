import fp from 'fastify-plugin';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { verifyAccessToken } from '../services/authService.js';

declare module 'fastify' {
  interface FastifyRequest {
    user: { sub: number; role: 'employee' | 'manager' };
  }
}

/**
 * Pre-handler hook that verifies Bearer token and attaches user to request.
 */
export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const header = request.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return reply.status(401).send({
      error: 'UNAUTHORIZED',
      message: 'Authentication required',
      field: null,
      statusCode: 401,
    });
  }

  const token = header.split(' ')[1];
  try {
    const decoded = verifyAccessToken(
      token,
      (request.server as unknown as { config: { JWT_SECRET: string } }).config.JWT_SECRET,
    );
    request.user = { sub: decoded.sub, role: decoded.role };
  } catch {
    return reply.status(401).send({
      error: 'UNAUTHORIZED',
      message: 'Authentication required',
      field: null,
      statusCode: 401,
    });
  }
}

/**
 * Factory that creates a pre-handler requiring a specific role.
 * Runs requireAuth first, then checks the role claim.
 */
export function requireRole(role: 'employee' | 'manager') {
  return async function roleHandler(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    // First, authenticate
    await requireAuth(request, reply);
    if (reply.sent) return; // requireAuth already sent a 401

    // Then check role
    if (request.user.role !== role && role === 'manager') {
      return reply.status(403).send({
        error: 'FORBIDDEN',
        message: 'Insufficient permissions',
        field: null,
        statusCode: 403,
      });
    }
  };
}

export default fp(
  async () => {
    // Plugin registered — hooks are exported for route-level use
  },
  { name: 'auth', dependencies: ['env'] },
);
