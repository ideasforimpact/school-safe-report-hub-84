import school from './school';
import institute from './institute';
import work from './work';
import type { ClientLang, ClientTypeKey } from './types';

export type { ClientLang, ClientTypeKey };

const langMap: Record<ClientTypeKey, ClientLang> = {
  school,
  institute,
  work,
};

/** Resolve the lang bundle for a given client type key. Falls back to school. */
export function getLang(typeKey: string | null | undefined): ClientLang {
  const key = (typeKey ?? '') as ClientTypeKey;
  return langMap[key] ?? school;
}

export { school, institute, work };
