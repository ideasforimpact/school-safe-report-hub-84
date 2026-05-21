/**
 * JWT signing and verification for SafeSchool Auth Service
 * Uses the djwt library for Deno
 */

import { create, verify, decode, Payload } from 'https://deno.land/x/djwt@v3.0.2/mod.ts';
import { JwtPayload } from './types.ts';

export function getJwtSecret(): string {
  const secret = Deno.env.get('SAFE_JWT_SECRET');
  if (!secret) throw new Error('SAFE_JWT_SECRET is required');
  return secret;
}

function getJwtIssuer(): string {
  return Deno.env.get('SAFE_JWT_ISSUER') || 'safeschool';
}

function getAccessTokenExpSeconds(): number {
  return parseInt(Deno.env.get("ACCESS_TOKEN_EXP_SECONDS") || "300", 10);
}
/** Shared HMAC key import for signing, verification, and refresh-token hashing. */
export async function importHmacKey(secret: string, usages: KeyUsage[]): Promise<CryptoKey> {
  return await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    usages,
  );
}
/**
 * Sign a JWT access token
 *
 * @param payload - token payload without iss/iat/exp/aud
 * @param moduleName - module identifier ("visitor", "child-audit", etc.)
 */
export async function signAccessToken(
  payload: Omit<JwtPayload, 'iss' | 'iat' | 'exp' | 'aud'>,
  moduleName: string
): Promise<string> {
  const secret = getJwtSecret();

  const now = Math.floor(Date.now() / 1000);

  const fullPayload: Payload = {
    ...payload,
    iss: getJwtIssuer(),
    iat: now,
    exp: now + getAccessTokenExpSeconds(),
    aud: moduleName,
  };

  const key = await importHmacKey(secret, ['sign']);
  return await create({ alg: 'HS256', typ: 'JWT' }, fullPayload, key);
}

/**
 * Verify and decode a JWT access token (shared HMAC secret; module isolation via `aud`).
 *
 * @param moduleName - when provided, enforces `aud`; omit only for module-agnostic checks (e.g. auth/verify)
 */
export async function verifyAccessToken(
  token: string,
  moduleName?: string
): Promise<JwtPayload> {
  const secret = getJwtSecret();

  const key = await importHmacKey(secret, ['verify']);
  const payload = (await verify(token, key)) as JwtPayload;

  if (moduleName !== undefined) {
    const aud = payload.aud;
    if (Array.isArray(aud)) {
      if (!aud.includes(moduleName)) throw new Error('Invalid audience');
    } else {
      if (aud !== moduleName) throw new Error('Invalid audience');
    }
  }

  return payload;
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

