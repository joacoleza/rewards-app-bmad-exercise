import Fastify from 'fastify';

export function buildApp() {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL ?? 'info',
      transport:
        process.env.NODE_ENV === 'development'
          ? { target: 'pino-pretty', options: { colorize: true } }
          : undefined,
    },
  });

  // Health check endpoint — public, no auth required
  app.get('/api/health', async () => {
    return { status: 'ok' };
  });

  return app;
}
