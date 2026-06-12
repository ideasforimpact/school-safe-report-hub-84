// Demo Setup helper for the Create Assessment form
// (src/components/assessments/create/CreateAssessmentForm.tsx).
//
// Cycles through three pre-canned scenarios and resolves the
// templateName against the loaded `templates` array (matched by
// `.title` case-insensitively). If no template matches the name, falls
// back to the loaded template at `scenarioIndex % templates.length`
// so a valid templateId is always selected.

import rawScenarios from './scenarios.json';

export interface AssessmentScenario {
  name: string;
  description: string;
  templateName: string;
}

const scenarios: AssessmentScenario[] = rawScenarios as AssessmentScenario[];

let assessmentCycleIndex = 0;

export interface NextAssessmentResult {
  scenario: AssessmentScenario;
  index: number;
}

export function getNextAssessmentScenario(): NextAssessmentResult {
  if (scenarios.length === 0) {
    return {
      scenario: { name: '', description: '', templateName: '' },
      index: 0,
    };
  }
  const index = assessmentCycleIndex % scenarios.length;
  const scenario = scenarios[index];
  assessmentCycleIndex = (assessmentCycleIndex + 1) % scenarios.length;
  return { scenario, index };
}

interface TemplateLike {
  id: string;
  title?: string;
  type?: string;
  [k: string]: unknown;
}

export interface AssessmentScenarioPartial {
  name: string;
  description: string;
  templateId: string;
}

const normalize = (s: string): string => s.trim().toLowerCase();

/**
 * Resolve a scenario into the Create Assessment form's `formData`
 * partial. templateId is matched by `title` from the loaded templates;
 * if no match, falls back to position scenarioIndex in the loaded
 * array so the dropdown always ends up populated. assignedTo and
 * targetCompletionDate are intentionally left untouched — the user
 * fills those manually per spec.
 */
export function resolveScenarioForAssessment(
  scenario: AssessmentScenario,
  templates: TemplateLike[],
  scenarioIndex: number,
): AssessmentScenarioPartial {
  let templateId = '';
  if (templates.length > 0) {
    const target = normalize(scenario.templateName);
    const byTitle = templates.find(
      t => typeof t.title === 'string' && normalize(t.title) === target,
    );
    if (byTitle) {
      templateId = byTitle.id;
    } else {
      templateId = templates[scenarioIndex % templates.length].id;
      console.info(
        '[Demo Setup] templateName',
        scenario.templateName,
        'not found; falling back to',
        templates[scenarioIndex % templates.length].title,
      );
    }
  }

  return {
    name: scenario.name,
    description: scenario.description,
    templateId,
  };
}
