import { FunctionsHttpError } from '@supabase/supabase-js';

export async function extractEdgeFunctionErrorMessage(error: unknown, fallback: string): Promise<string> {
  if (error instanceof FunctionsHttpError) {
    try {
      const body = await error.context.json();
      if (body?.message) return body.message;
      if (body?.error) return body.error;
    } catch {
      // response body wasn't JSON — fall through to the generic message
    }
  }
  return fallback;
}
