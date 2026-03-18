import type { FastifyInstance } from 'fastify';
import { UnauthorizedError } from '@rewards-app/shared';
import { requireRole } from '../../plugins/auth.js';
import { createUser, listUsers } from '../../services/userService.js';
import { createUserSchema, listUsersSchema } from './schema.js';

export default async function usersRoutes(fastify: FastifyInstance) {
  /**
   * POST /api/users
   * Manager-only: create a new user with email, password, and role.
   */
  fastify.post<{
    Body: { email: string; password: string; role: 'employee' | 'manager' };
  }>(
    '/users',
    { schema: createUserSchema, preHandler: [requireRole('manager')] },
    async (request, reply) => {
      if (!request.user) throw new UnauthorizedError();
      const user = await createUser({
        ...request.body,
        actorId: request.user.sub,
      });
      return reply.status(201).send(user);
    },
  );

  /**
   * GET /api/users
   * Manager-only: list all users (no passwordHash).
   */
  fastify.get(
    '/users',
    { schema: listUsersSchema, preHandler: [requireRole('manager')] },
    async (_request, reply) => {
      const userList = await listUsers();
      return reply.send(userList);
    },
  );
}
