import type { FastifyInstance } from 'fastify';
import { eq } from 'drizzle-orm';
import { db, users } from '@rewards-app/db';
import {
  verifyPassword,
  hashPassword,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  REFRESH_TOKEN_EXPIRY_SECONDS,
} from '../../services/authService.js';
import { logAuditEvent } from '../../services/auditService.js';
import { loginSchema, refreshSchema, logoutSchema } from './schema.js';

const REFRESH_COOKIE_NAME = 'refreshToken';

/** Dummy hash used for constant-time comparison when user is not found */
let DUMMY_HASH: string | null = null;

export default async function authRoutes(fastify: FastifyInstance) {
  // Pre-compute a dummy bcrypt hash for timing-safe "user not found" path
  if (!DUMMY_HASH) {
    DUMMY_HASH = await hashPassword('dummy-password-for-timing');
  }

  /** Cookie options shared between setCookie and clearCookie */
  const cookieOpts = {
    httpOnly: true,
    secure: fastify.config?.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/api/auth',
  };
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

      // Normalize email to lowercase for case-insensitive lookup
      const normalizedEmail = email.toLowerCase().trim();

      // Look up user by email
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, normalizedEmail))
        .limit(1);

      if (!user) {
        // Constant-time: run bcrypt against dummy hash to prevent timing oracle
        await verifyPassword(password, DUMMY_HASH!);
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

      // Audit log — FR38 (non-blocking: don't fail login if audit write fails)
      try {
        await logAuditEvent(db, {
          actorId: user.id,
          action: 'USER_LOGIN',
          entityType: 'USER',
          entityId: user.id,
          payload: { email: user.email },
        });
      } catch (err) {
        request.log.warn({ err, userId: user.id }, 'Audit log write failed — login proceeding');
      }

      // Set refresh token cookie
      reply.setCookie(REFRESH_COOKIE_NAME, refreshToken, {
        ...cookieOpts,
        maxAge: REFRESH_TOKEN_EXPIRY_SECONDS,
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
        reply.clearCookie(REFRESH_COOKIE_NAME, cookieOpts);
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

      return reply.send({
        accessToken,
        user: { id: user.id, email: user.email, role: user.role },
      });
    } catch {
      reply.clearCookie(REFRESH_COOKIE_NAME, cookieOpts);
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
    reply.clearCookie(REFRESH_COOKIE_NAME, cookieOpts);
    return reply.send({ message: 'Logged out successfully' });
  });
}
