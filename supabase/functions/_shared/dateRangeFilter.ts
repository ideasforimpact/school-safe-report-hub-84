/**
 * A bare "to date" filter (e.g. "2026-06-24") is parsed by Postgres as
 * midnight UTC on that day. Comparing a `timestamptz` column with `.lte()`
 * against that raw value excludes every row recorded later that same day.
 * This converts the "to date" into an inclusive end-of-day UTC boundary
 * so the entire day is included in the range.
 */
export function toInclusiveDateTo(dateTo: string): string {
  const endOfDay = new Date(dateTo);
  endOfDay.setUTCHours(23, 59, 59, 999);
  return endOfDay.toISOString();
}
