const errorResponseSchema = {
  type: 'object' as const,
  required: ['error', 'message', 'statusCode'],
  properties: {
    error: { type: 'string' as const },
    message: { type: 'string' as const },
    field: { type: 'string' as const, nullable: true },
    statusCode: { type: 'number' as const },
  },
};

const userObjectSchema = {
  type: 'object' as const,
  required: ['id', 'email', 'role', 'createdAt'],
  properties: {
    id: { type: 'number' as const },
    email: { type: 'string' as const },
    role: { type: 'string' as const, enum: ['employee', 'manager'] },
    createdAt: { type: 'string' as const },
  },
};

export const createUserSchema = {
  body: {
    type: 'object' as const,
    required: ['email', 'password', 'role'],
    properties: {
      email: { type: 'string' as const, format: 'email' },
      password: { type: 'string' as const, minLength: 8, maxLength: 128 },
      role: { type: 'string' as const, enum: ['employee', 'manager'] },
    },
    additionalProperties: false,
  },
  response: {
    201: userObjectSchema,
    400: errorResponseSchema,
    401: errorResponseSchema,
    403: errorResponseSchema,
    409: errorResponseSchema,
  },
};

export const listUsersSchema = {
  response: {
    200: {
      type: 'array' as const,
      items: userObjectSchema,
    },
    401: errorResponseSchema,
    403: errorResponseSchema,
  },
};
