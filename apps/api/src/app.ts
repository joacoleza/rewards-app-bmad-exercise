import Fastify from 'fastify';
import envPlugin from './plugins/env.js';
import cookiePlugin from './plugins/cookie.js';
import corsPlugin from './plugins/cors.js';
import authPlugin from './plugins/auth.js';
import authRoutes from './routes/auth/index.js';
import protectedRoutes from './routes/protected/index.js';
import { AppError } from '@rewards-app/shared';

export function buildApp(opts?: { skipEnv?: boolean }) {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL ?? 'info',
      transport:
        process.env.NODE_ENV === 'development'
          ? { target: 'pino-pretty', options: { colorize: true } }
          : undefined,
      redact: ['req.headers.authorization', 'body.password'],
      serializers: {
        req(request) {
          return {
            method: request.method,
            url: request.url,
            headers: { host: request.headers.host },
          };
        },
      },
    },
  });

  // ------ Plugins ------
  // Register @fastify/env first — fail fast on missing vars
  if (!opts?.skipEnv) {
    app.register(envPlugin);
  }
  app.register(cookiePlugin);

  // CORS depends on env (needs CORS_ORIGIN)
  if (!opts?.skipEnv) {
    app.register(corsPlugin);
  }

  // Auth plugin (requires env for JWT_SECRET)
  if (!opts?.skipEnv) {
    app.register(authPlugin);
  }

  // ------ Centralized Error Handler ------
  app.setErrorHandler((error: Error & { validation?: Array<{ params?: { missingProperty?: string }; instancePath?: string }>; statusCode?: number; code?: string; field?: string }, request, reply) => {
    // Fastify JSON Schema validation errors
    if ('validation' in error && Array.isArray(error.validation) && error.validation.length > 0) {
      const firstError = error.validation[0];
      const field =
        firstError?.params?.missingProperty ||
        firstError?.instancePath?.replace(/^\//, '').split('/').pop() ||
        null;
      return reply.status(400).send({
        error: 'VALIDATION_ERROR',
        message: error.message,
        field,
        statusCode: 400,
      });
    }

    // Known application errors (AppError subclasses)
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send(error.toJSON());
    }

    // Errors with statusCode set (e.g. via reply.status().send())
    if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
      return reply.status(error.statusCode).send({
        error: error.code || 'ERROR',
        message: error.message,
        field: error.field || null,
        statusCode: error.statusCode,
      });
    }

    // Unknown / internal errors
    request.log.error(error);
    return reply.status(500).send({
      error: 'INTERNAL_ERROR',
      message:
        process.env.NODE_ENV === 'production'
          ? 'An unexpected error occurred'
          : error.message,
      field: null,
      statusCode: 500,
    });
  });

  // ------ Routes ------
  // Health check — public, no auth required
  app.get('/api/health', async () => {
    return { status: 'ok' };
  });

  // Auth routes
  app.register(authRoutes, { prefix: '/api/auth' });

  // Protected test routes (RBAC validation) — not available in production
  if (process.env.NODE_ENV !== 'production') {
    app.register(protectedRoutes, { prefix: '/api/protected' });
  }

  return app;
}
