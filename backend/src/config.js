import dotenv from 'dotenv';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: path.join(backendRoot, '.env'), quiet: true });

if (!process.env.JWT_SECRET) {
  console.warn('[config] JWT_SECRET is not set. A temporary secret is used; all sessions reset on restart.');
}

export const config = {
  port: Number(process.env.PORT) || 4000,
  dbPath: path.resolve(backendRoot, process.env.DB_PATH || './data/telecom.db'),
  uploadDir: path.resolve(backendRoot, process.env.UPLOAD_DIR || './uploads'),
  jwtSecret: process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
};
