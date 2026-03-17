import fp from 'fastify-plugin';
import fastifyCors from '@fastify/cors';

export default fp(
  async (fastify) => {
    await fastify.register(fastifyCors, {
      origin: fastify.config.CORS_ORIGIN,
      credentials: true, // required for httpOnly cookies
    });
  },
  {
    name: 'cors',
    dependencies: ['env'],
  },
);
