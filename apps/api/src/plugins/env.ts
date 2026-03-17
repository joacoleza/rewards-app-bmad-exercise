import fp from 'fastify-plugin';
import fastifyEnv from '@fastify/env';

const schema = {
  type: 'object',
  required: ['DATABASE_URL', 'JWT_SECRET', 'JWT_REFRESH_SECRET'],
  properties: {
    DATABASE_URL: { type: 'string' },
    JWT_SECRET: { type: 'string', minLength: 16 },
    JWT_REFRESH_SECRET: { type: 'string', minLength: 16 },
    NODE_ENV: {
      type: 'string',
      enum: ['development', 'production', 'test'],
      default: 'development',
    },
    PORT: { type: 'number', default: 3001 },
    LOG_LEVEL: {
      type: 'string',
      enum: ['debug', 'info', 'warn', 'error'],
      default: 'info',
    },
    CORS_ORIGIN: { type: 'string', default: 'http://localhost:5173' },
  },
};

declare module 'fastify' {
  interface FastifyInstance {
    config: {
      DATABASE_URL: string;
      JWT_SECRET: string;
      JWT_REFRESH_SECRET: string;
      NODE_ENV: 'development' | 'production' | 'test';
      PORT: number;
      LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
      CORS_ORIGIN: string;
    };
  }
}

export default fp(
  async (fastify) => {
    await fastify.register(fastifyEnv, { schema, dotenv: true });
  },
  { name: 'env' },
);
