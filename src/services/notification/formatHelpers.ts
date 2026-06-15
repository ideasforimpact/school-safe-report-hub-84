/**
 * Shared formatting helpers for the notification services.
 *
 * Kept tiny on purpose — the only thing both incident and assessment services need
 * is a safe way to render an employee's display name. Single-name accounts (e.g. the
 * "safeschool" shared mailbox with no last_name) are common in this product, so a
 * naive `${first} ${last}` interpolation leaves a trailing space in greetings and
 * tripped a `!last_name` guard that silently dropped emails.
 */

interface NameableEmployee {
  first_name?: string | null;
  last_name?: string | null;
  email: string;
}

/**
 * Returns a clean display name: trimmed "first last" if either part is present,
 * otherwise the email so the rendered greeting / recipient_name column is never blank.
 */
export function formatEmployeeName(employee: NameableEmployee): string {
  return `${employee.first_name ?? ''} ${employee.last_name ?? ''}`.trim() || employee.email;
}
