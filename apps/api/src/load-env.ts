import dotenv from 'dotenv';
import path from 'path';

// Load root .env before any other module reads process.env.
// This file must be the first import in server.ts so it runs before
// client.ts (packages/db) evaluates DATABASE_URL at module load time.
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
