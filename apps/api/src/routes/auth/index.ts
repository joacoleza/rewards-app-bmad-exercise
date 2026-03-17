import type { FastifyInstance } from 'fastify';
import { eq } from 'drizzle-orm';
import { db, users } from '@rewards-app/db';
import {
  verifyPassword,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../../services/authService.js';
import { logAuditEvent } from '../../services/auditService.js';
import { loginSchema, refreshSchema, logoutSchema } from './schema.js';

const REFRESH_COOKIE_NAME = 'refreshToken';
const REFRESH_MAX_AGE = 8 * 60 * 60; // 8 hours in seconds

export default async function authRoutes(fastify: FastifyInstance) {
  /**
   * POST /api/auth/login
   */
  fastify.post<{
    Body: { email: string; password: string };
  }>(
    '/login',
    { schema: loginSchema },
    async (request, reply) => {
      const { email, password } = request.body;

      // Look up user by email
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (!user) {
        return reply.status(401).send({
          error: 'UNAUTHORIZED',
          message: 'Invalid email or password',
          field: null,
          statusCode: 401,
        });
      }

      // Verify password
      const valid = await verifyPassword(password, user.passwordHash);
      if (!valid) {
        return reply.status(401).send({
          error: 'UNAUTHORIZED',
          message: 'Invalid email or password',
          field: null,
          statusCode: 401,
        });
      }

      // Generate tokens
      const accessToken = generateAccessToken(
        { id: user.id, role: user.role },
        fastify.config.JWT_SECRET,
      );
      const refreshToken = generateRefreshToken(
        { id: user.id },
        fastify.config.JWT_REFRESH_SECRET,
      );

      // Audit log — FR38
      await logAuditEvent(db, {
        actorId: user.id,
        action: 'USER_LOGIN',
        entityType: 'USER',
        entityId: user.id,
        payload: { email: user.email },
      });

      // Set refresh token cookie
      reply.setCookie(REFRESH_COOKIE_NAME, refreshToken, {
        httpOnly: true,
        secure: fastify.config.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/api/auth',
        maxAge: REFRESH_MAX_AGE,
      });

      return reply.send({
        accessToken,
        user: { id: user.id, email: user.email, role: user.role },
      });
    },
  );

  /**
   * POST /api/auth/refresh
   */
  fastify.post('/refresh', { schema: refreshSchema }, async (request, reply) => {
    const token = request.cookies[REFRESH_COOKIE_NAME];

    if (!token) {
      return reply.status(401).send({
        error: 'UNAUTHORIZED',
        message: 'Refresh token required',
        field: null,
        statusCode: 401,
      });
    }

    try {
      const decoded = verifyRefreshToken(token, fastify.config.JWT_REFRESH_SECRET);

      // Lookup user to get current role (role may have changed)
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, decoded.sub))
        .limit(1);

      if (!user) {
        reply.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/auth' });
        return reply.status(401).send({
          error: 'UNAUTHORIZED',
          message: 'Invalid refresh token',
          field: null,
          statusCode: 401,
        });
      }

      const accessToken = generateAccessToken(
        { id: user.id, role: user.role },
        fastify.config.JWT_SECRET,
      );

      return reply.send({ accessToken });
    } catch {
      reply.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/auth' });
      return reply.status(401).send({
        error: 'UNAUTHORIZED',
        message: 'Invalid or expired refresh token',
        field: null,
        statusCode: 401,
      });
    }
  });

  /**
   * POST /api/auth/logout
   */
  fastify.post('/logout', { schema: logoutSchema }, async (_request, reply) => {
    reply.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/auth' });
    return reply.send({ message: 'Logged out successfully' });
  });
}
