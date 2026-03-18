import { describe, it, expect } from 'vitest';
import jwt from 'jsonwebtoken';
import {
  verifyPassword,
  hashPassword,
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from './authService.js';

const TEST_SECRET = 'test-secret-must-be-16-chars';
const TEST_REFRESH_SECRET = 'test-refresh-secret-16chars';

describe('authService', () => {
  describe('hashPassword / verifyPassword', () => {
    it('hashes a password and verifies it', async () => {
      const plain = 'my-secure-password';
      const hashed = await hashPassword(plain);
      expect(hashed).not.toBe(plain);
      expect(await verifyPassword(plain, hashed)).toBe(true);
    });

    it('rejects wrong password', async () => {
      const hashed = await hashPassword('correct');
      expect(await verifyPassword('wrong', hashed)).toBe(false);
    });
  });

  describe('generateAccessToken / verifyAccessToken', () => {
    it('generates a valid JWT with sub and role', () => {
      const token = generateAccessToken(
        { id: 42, role: 'manager' },
        TEST_SECRET,
      );
      const decoded = verifyAccessToken(token, TEST_SECRET);
      expect(decoded.sub).toBe(42);
      expect(decoded.role).toBe('manager');
      expect(decoded.exp).toBeDefined();
    });

    it('throws on invalid token', () => {
      expect(() => verifyAccessToken('bad-token', TEST_SECRET)).toThrow();
    });

    it('throws on wrong secret', () => {
      const token = generateAccessToken({ id: 1, role: 'employee' }, TEST_SECRET);
      expect(() => verifyAccessToken(token, 'wrong-secret-16-chars!')).toThrow();
    });

    it('throws on token with missing sub claim', () => {
      const token = jwt.sign({ role: 'manager' }, TEST_SECRET, {
        algorithm: 'HS256',
        expiresIn: '15m',
      });
      expect(() => verifyAccessToken(token, TEST_SECRET)).toThrow(
        'Invalid access token payload',
      );
    });

    it('throws on string payload token', () => {
      const token = jwt.sign('string-payload', TEST_SECRET, {
        algorithm: 'HS256',
      });
      expect(() => verifyAccessToken(token, TEST_SECRET)).toThrow(
        'Invalid access token payload',
      );
    });
  });

  describe('generateRefreshToken / verifyRefreshToken', () => {
    it('generates a valid refresh JWT with sub', () => {
      const token = generateRefreshToken({ id: 7 }, TEST_REFRESH_SECRET);
      const decoded = verifyRefreshToken(token, TEST_REFRESH_SECRET);
      expect(decoded.sub).toBe(7);
    });

    it('rejects expired token', () => {
      const token = jwt.sign({ sub: 1 }, TEST_REFRESH_SECRET, {
        algorithm: 'HS256',
        expiresIn: '-1s',
      });
      expect(() => verifyRefreshToken(token, TEST_REFRESH_SECRET)).toThrow();
    });

    it('throws on token with missing sub claim', () => {
      const token = jwt.sign({ foo: 'bar' }, TEST_REFRESH_SECRET, {
        algorithm: 'HS256',
        expiresIn: '8h',
      });
      expect(() => verifyRefreshToken(token, TEST_REFRESH_SECRET)).toThrow(
        'Invalid refresh token payload',
      );
    });
  });
});
