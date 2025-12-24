/**
 * Token utilities for SafeSchool Auth Service
 * Handles refresh token generation and hashing
 */

import { crypto } from 'https://deno.land/std@0.168.0/crypto/mod.ts';

/**
 * Generate a cryptographically secure random refresh token
 * Returns a base64url-encoded string (>= 32 bytes)
 */
export async function generateRefreshToken(): Promise<string> {
  // Generate 32 random bytes
  const randomBytes = new Uint8Array(32);
  crypto.getRandomValues(randomBytes);
  
  // Convert to base64url (URL-safe base64)
  return btoa(String.fromCharCode(...randomBytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Hash a refresh token using HMAC-SHA256
 * Uses SAFE_JWT_SECRET as the key
 */
export async function hashRefreshToken(token: string): Promise<string> {
  const secret = Deno.env.get('SAFE_JWT_SECRET');
  if (!secret) {
    throw new Error('SAFE_JWT_SECRET environment variable is required');
  }

  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const tokenData = encoder.encode(token);

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, tokenData);
  const hashArray = Array.from(new Uint8Array(signature));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return hashHex;
}

/**
 * Get refresh token expiry timestamp
 */
export function getRefreshTokenExpiry(): Date {
  const days = parseInt(Deno.env.get('REFRESH_TOKEN_EXP_DAYS') || '30', 10);
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + days);
  return expiry;
}

