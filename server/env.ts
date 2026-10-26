import type { D1Database, R2Bucket } from '@cloudflare/workers-types';

export interface Env {
  DB: D1Database;
  BUCKET?: R2Bucket;
  ADMIN_EMAIL?: string;
  JWT_SECRET?: string;
}

export interface JwtUserPayload {
  sub: string;
  email: string;
  role: 'user' | 'admin';
  nickname: string;
  exp: number;
}
