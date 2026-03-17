import { compare, hash } from 'bcryptjs';
import jwt from 'jsonwebtoken';

const BCRYPT_ROUNDS = 12;
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '8h';

export interface AccessTokenPayload {
  sub: number;
  role: 'employee' | 'manager';
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  sub: number;
  iat?: number;
  exp?: number;
}

export async function verifyPassword(
  plaintext: string,
  passwordHash: string,
): Promise<boolean> {
  return compare(plaintext, passwordHash);
}

export async function hashPassword(plaintext: string): Promise<string> {
  return hash(plaintext, BCRYPT_ROUNDS);
}

export function generateAccessToken(
  user: { id: number; role: 'employee' | 'manager' },
  secret: string,
): string {
  return jwt.sign({ sub: user.id, role: user.role }, secret, {
    algorithm: 'HS256',
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
}

export function generateRefreshToken(
  user: { id: number },
  secret: string,
): string {
  return jwt.sign({ sub: user.id }, secret, {
    algorithm: 'HS256',
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });
}

export function verifyAccessToken(
  token: string,
  secret: string,
): AccessTokenPayload {
  const decoded = jwt.verify(token, secret, {
    algorithms: ['HS256'],
  });
  return decoded as unknown as AccessTokenPayload;
}

export function verifyRefreshToken(
  token: string,
  secret: string,
): RefreshTokenPayload {
  const decoded = jwt.verify(token, secret, {
    algorithms: ['HS256'],
  });
  return decoded as unknown as RefreshTokenPayload;
}
