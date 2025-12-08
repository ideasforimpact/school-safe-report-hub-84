/**
 * JWT signing and verification for SafeSchool Auth Service
 * Uses the djwt library for Deno
 */

import { create, verify, decode, Payload } from 'https://deno.land/x/djwt@v3.0.2/mod.ts';
import { JwtPayload } from './types.ts';

const ALGORITHM = 'HS256';

function getJwtSecret(): string {
  const secret = Deno.env.get('SAFE_JWT_SECRET');
  if (!secret) {
    throw new Error('SAFE_JWT_SECRET environment variable is required');
  }
  return secret;
}

function getJwtIssuer(): string {
  return Deno.env.get('SAFE_JWT_ISSUER') || 'safeschool';
}

function getAccessTokenExpSeconds(): number {
  return parseInt(Deno.env.get('ACCESS_TOKEN_EXP_SECONDS') || '3600', 10);
}

/**
 * Sign a JWT access token
 */
export async function signAccessToken(payload: Omit<JwtPayload, 'iss' | 'iat' | 'exp'>): Promise<string> {
  const secret = getJwtSecret();
  const issuer = getJwtIssuer();
  const expSeconds = getAccessTokenExpSeconds();

  const now = Math.floor(Date.now() / 1000);
  const fullPayload: Payload = {
    ...payload,
    iss: issuer,
    iat: now,
    exp: now + expSeconds,
  };

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  return await create({ alg: ALGORITHM, typ: 'JWT' }, fullPayload, key);
}

/**
 * Verify and decode a JWT access token
 */
export async function verifyAccessToken(token: string): Promise<JwtPayload> {
  const secret = getJwtSecret();

  try {
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const payload = await verify(token, key);
    
    // Type assertion - verify returns Payload which should match our JwtPayload
    return payload as JwtPayload;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Token verification failed: ${error.message}`);
    }
    throw new Error('Token verification failed: Unknown error');
  }
}

/**
 * Decode a JWT token without verification (for debugging)
 */
export function decodeToken(token: string): Payload | null {
  try {
    return decode(token);
  } catch {
    return null;
  }
}

