/**
 * Standardized response helpers for SafeSchool Auth Service
 */

import { ApiResponse } from './types.ts';
import { corsHeaders } from '../cors.ts';

export function successResponse<T>(
  data: T,
  code: string = 'SUCCESS',
  message: string = 'Operation successful',
  status: number = 200,
): Response {
  const response: ApiResponse<T> = {
    status: 'success',
    code,
    message,
    data,
    errors: null,
  };

  return new Response(JSON.stringify(response), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

export function errorResponse(
  code: string,
  message: string,
  status: number = 400,
  errors?: Array<{ field: string; reason: string }> | null,
): Response {
  const response: ApiResponse = {
    status: 'error',
    code,
    message,
    data: null,
    errors: errors || null,
  };

  return new Response(JSON.stringify(response), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

export function rateLimitResponse(retryAfter: number): Response {
  return errorResponse(
    'RATE_LIMITED',
    `Rate limit exceeded. Retry after ${retryAfter} seconds`,
    429,
    null,
  );
}

