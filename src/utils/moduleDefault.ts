import type { ModuleAccessItem } from '@/types/moduleAccess';

export type DefaultModule = {
  key: string;
  module_id?: string;
  name?: string;
  enabled?: boolean;
  defaultAdmin?: boolean;
};

/**
 * Merge availableModules (from Redux/config) with defaultModules (from JSON)
 * Matching is done ONLY by module_id (normalized). Returns ModuleAccessItem[] ready to be used as selectedModules
 */
export const applyDefaultModules = (
  availableModules: { key?: string; name?: string; module_id?: string }[],
  defaultModules: DefaultModule[],
  employeeId?: string
): ModuleAccessItem[] => {
  const normalize = (s?: string) => String(s || '').trim().toLowerCase();

  // Build a lookup of available modules by normalized module_id
  const availableById = new Map<string, { key?: string; name?: string; module_id?: string }>();
  (availableModules || []).forEach(mod => {
    const id = normalize(mod.module_id);
    if (id) availableById.set(id, mod);
  });

  const result: ModuleAccessItem[] = [];

  // For each default entry (process all defaults so multiple entries are respected)
  for (const def of (defaultModules || [])) {
    if (!def || !def.enabled) continue;

    const defIdNorm = normalize(def.module_id);

    if (defIdNorm && availableById.has(defIdNorm)) {
      const matched = availableById.get(defIdNorm)!;
      result.push({
        key: matched.key || def.key,
        module_id: matched.module_id || def.module_id || def.key,
        name: matched.name || def.name || def.key,
        employeeId,
        level: { is_admin: !!def.defaultAdmin }
      } as ModuleAccessItem);
    } else {
      result.push({
        key: def.key,
        module_id: def.module_id || def.key,
        name: def.name || def.key,
        employeeId,
        level: { is_admin: !!def.defaultAdmin }
      } as ModuleAccessItem);
    }
  }

  // Deduplicate by module_id (keep first occurrence)
  const seen = new Set<string>();
  const deduped: ModuleAccessItem[] = [];
  for (const item of result) {
    const id = normalize(item.module_id) || normalize(item.key) || normalize(item.name);
    if (!seen.has(id)) {
      seen.add(id);
      deduped.push(item);
    }
  }

  return deduped;
};
