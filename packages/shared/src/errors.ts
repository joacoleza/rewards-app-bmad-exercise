/** Standard error codes — machine-readable identifiers for API errors */
export const ErrorCode = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  DUPLICATE_NOMINATION: 'DUPLICATE_NOMINATION',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

/** Consistent API error response shape */
export interface ApiErrorResponse {
  error: string;
  message: string;
  field: string | null;
  statusCode: number;
}

/** Base application error */
export class AppError extends Error {
  public readonly field: string | null;

  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
    field: string | null = null,
  ) {
    super(message);
    this.name = 'AppError';
    this.field = field;
  }

  toJSON(): ApiErrorResponse {
    return {
      error: this.code,
      message: this.message,
      field: this.field,
      statusCode: this.statusCode,
    };
  }
}

/** Not found error */
export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, ErrorCode.NOT_FOUND, 404);
    this.name = 'NotFoundError';
  }
}

/** Unauthorized error */
export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, ErrorCode.UNAUTHORIZED, 401);
    this.name = 'UnauthorizedError';
  }
}

/** Forbidden error */
export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, ErrorCode.FORBIDDEN, 403);
    this.name = 'ForbiddenError';
  }
}

/** Conflict error */
export class ConflictError extends AppError {
  constructor(message: string, field: string | null = null) {
    super(message, ErrorCode.CONFLICT, 409, field);
    this.name = 'ConflictError';
  }
}
