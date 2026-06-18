import { useMemo } from 'react';
import { useAuth } from '@/contexts/auth';
import { getLang } from '@/lang';
import type { ClientLang } from '@/lang/types';

/**
 * Returns the language bundle for the current client type.
 * Falls back to school terminology when the type cannot be resolved.
 *
 * Usage:
 *   const lang = useLang();
 *   <h1>{lang.people.member}s</h1>  // "Students" for school, "Employees" for work
 */
export function useLang(): ClientLang {
  const { employeeData, user } = useAuth();
  const typeKey =
    employeeData?.clientType?.key ??
    (user as any)?.clientType?.key ??
    null;

  return useMemo(() => getLang(typeKey), [typeKey]);
}
