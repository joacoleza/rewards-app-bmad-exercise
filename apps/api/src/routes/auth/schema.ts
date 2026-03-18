const errorResponseSchema = {
  type: 'object' as const,
  properties: {
    error: { type: 'string' as const },
    message: { type: 'string' as const },
    field: { type: 'string' as const, nullable: true },
    statusCode: { type: 'number' as const },
  },
};

export const loginSchema = {
  body: {
    type: 'object' as const,
    required: ['email', 'password'],
    properties: {
      email: { type: 'string' as const, format: 'email' },
      password: { type: 'string' as const, minLength: 1, maxLength: 128 },
    },
    additionalProperties: false,
  },
  response: {
    200: {
      type: 'object' as const,
      properties: {
        accessToken: { type: 'string' as const },
        user: {
          type: 'object' as const,
          properties: {
            id: { type: 'number' as const },
            email: { type: 'string' as const },
            role: { type: 'string' as const, enum: ['employee', 'manager'] },
          },
        },
      },
    },
    400: errorResponseSchema,
    401: errorResponseSchema,
  },
};

export const refreshSchema = {
  response: {
    200: {
      type: 'object' as const,
      properties: {
        accessToken: { type: 'string' as const },
      },
    },
    401: errorResponseSchema,
  },
};

export const logoutSchema = {
  response: {
    200: {
      type: 'object' as const,
      properties: {
        message: { type: 'string' as const },
      },
    },
  },
};
