// Demo Setup helper for the Close Incident dialog
// (src/components/incident/IncidentClosureForm.tsx).
//
// Loads pre-canned closure scenarios and resolves them against the
// client's actual contributing_factors list (loaded at runtime from
// Supabase). The "factorPicks" field in the JSON says how many factors
// to randomly select; descriptions are filled from the
// factorDescriptionTemplate so the demo presenter sees coherent text.

import rawScenarios from './closureScenarios.json';
import { supabase } from '@/integrations/supabase/client';
import type { ContributingFactor } from '@/types/incident';

export interface ClosureScenario {
  rootCause: string;
  learningPoints: string;
  actionTaken: string;
  contributingFactorPicks: number;
  factorDescriptionTemplate: string;
}

const scenarios: ClosureScenario[] = rawScenarios as ClosureScenario[];

// Module-level cycle pointer. Same pattern as the report-incident
// demo — persists across re-opens of the close dialog within a tab,
// resets on full page reload.
let closureCycleIndex = 0;

export interface NextClosureResult {
  scenario: ClosureScenario;
  index: number;
}

export function getNextClosureScenario(): NextClosureResult {
  if (scenarios.length === 0) {
    return {
      scenario: {
        rootCause: '',
        learningPoints: '',
        actionTaken: '',
        contributingFactorPicks: 0,
        factorDescriptionTemplate: '',
      },
      index: 0,
    };
  }
  const index = closureCycleIndex % scenarios.length;
  const scenario = scenarios[index];
  closureCycleIndex = (closureCycleIndex + 1) % scenarios.length;
  return { scenario, index };
}

interface FactorRow {
  id: string;
  name: string;
  weight?: string | null;
}

/**
 * Fetch the current client's contributing_factors and pick N of them
 * (deterministic-per-scenario rather than randomised, so cycling
 * through demos is reproducible). Each pick becomes a ContributingFactor
 * with the description from the scenario template and a weight
 * normalized to the form's enum.
 *
 * If the client has fewer factors than requested, returns whatever is
 * available. If the table is empty / RLS blocks it, returns an empty
 * array and the demo presenter sees zero contributing factors (the
 * form will still let them add manually).
 */
export async function pickContributingFactors(
  clientId: string,
  scenario: ClosureScenario,
  scenarioIndex: number,
  excludeIds: string[] = [],
): Promise<ContributingFactor[]> {
  if (!clientId) return [];

  const { data, error } = await supabase
    .from('contributing_factors')
    .select('id, name, weight')
    .eq('client_id', clientId)
    .order('name');

  if (error) {
    console.warn('[Demo Setup] Failed to load contributing_factors for close:', error.message);
    return [];
  }

  const all: FactorRow[] = (data as FactorRow[] | null) || [];
  const available = all.filter(f => !excludeIds.includes(f.id));
  if (available.length === 0) return [];

  const pickCount = Math.min(
    Math.max(scenario.contributingFactorPicks || 1, 1),
    available.length,
  );

  // Deterministic offset based on scenarioIndex so different scenarios
  // pick different starting points.
  const picks: ContributingFactor[] = [];
  for (let i = 0; i < pickCount; i++) {
    const row = available[(scenarioIndex + i) % available.length];
    picks.push({
      id: row.id,
      category: row.name,
      description: scenario.factorDescriptionTemplate,
      weight: normalizeWeight(row.weight),
    });
  }
  return picks;
}

function normalizeWeight(raw: string | null | undefined): 'Low' | 'Medium' | 'High' {
  const norm = (raw || '').trim().toLowerCase();
  if (norm === 'low') return 'Low';
  if (norm === 'high') return 'High';
  return 'Medium';
}
