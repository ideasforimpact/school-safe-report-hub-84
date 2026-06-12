// Feature: Demo Setup — see Plan in
// /home/diwas/.claude/plans/bubbly-plotting-wren.md (final section).
//
// Gated by VITE_IS_DEMO_SETUP=true. When the demo icon in the Report /
// Edit Incident page header is clicked, this module supplies the next
// pre-canned scenario and translates the human-readable names in the
// scenario file into the IDs/strings the form state expects.
//
// Resolution strategy (per field):
//   1. Match the scenario's name (case-insensitive, trimmed) against
//      the loaded dropdown's .name field.
//   2. If no match, fall back to the loaded list at index
//      `scenarioIndex % list.length` — guarantees each demo click ALWAYS
//      fills every field even when the client's data uses different
//      category / subcategory / report-type names than the seed JSON,
//      and rotates through different options per scenario so the user
//      sees a visibly different fill each click.
//
// Cycling persists at the module level (a single `let cycleIndex`), so
// navigating between pages and back continues the rotation. A full page
// reload resets to 0, which is acceptable demo UX.

import rawScenarios from './scenarios.json';

export interface DemoScenario {
  categoryName: string;
  subcategoryName: string;
  reportTypeName: string;
  priorityName: string;
  /** 0 = today, -1 = yesterday, -3 = three days ago, etc. */
  dateOffsetDays: number;
  /** HH:MM (24-hour). */
  time: string;
  description: string;
}

const scenarios: DemoScenario[] = rawScenarios as DemoScenario[];

// Module-level cycle pointer. Intentionally NOT React state — persists
// across mounts of the demo button so navigation between pages keeps the
// rotation moving. Resets on full page reload.
let cycleIndex = 0;

export interface NextScenarioResult {
  scenario: DemoScenario;
  /** Position of this scenario in the canonical 0..N-1 sequence (NOT
   *  the post-advance cycle pointer). Used by resolvers as the offset
   *  for fallback picks when scenario field names don't match the
   *  loaded dropdowns. */
  index: number;
}

/**
 * Returns the next scenario in the cycle and advances the pointer.
 * If the JSON is empty for any reason, returns a fully-blank scenario
 * so callers don't have to null-check.
 */
export function getNextScenario(): NextScenarioResult {
  if (scenarios.length === 0) {
    return {
      scenario: {
        categoryName: '',
        subcategoryName: '',
        reportTypeName: '',
        priorityName: '',
        dateOffsetDays: 0,
        time: '',
        description: '',
      },
      index: 0,
    };
  }
  const index = cycleIndex % scenarios.length;
  const scenario = scenarios[index];
  cycleIndex = (cycleIndex + 1) % scenarios.length;
  return { scenario, index };
}

/**
 * Returns the current cycle position (0-based) without advancing. Used
 * only for debug logging.
 */
export function getCycleIndex(): number {
  return cycleIndex;
}

// =========================================================================
// Resolver — Report Incident form (src/hooks/useIncidentForm.ts)
// Form shape uses *Id fields against the loaded dropdown arrays.
// =========================================================================

interface ConfigItem {
  id: string;
  name: string;
}

interface SubcategoryItem extends ConfigItem {
  category_id?: string;
}

export interface LoadedReportData {
  reportTypes: ConfigItem[];
  categories: ConfigItem[];
  subcategories: SubcategoryItem[];
  priorities: ConfigItem[];
}

/**
 * Partial of the Report Incident form's FormData (see
 * src/hooks/useIncidentForm.ts `FormData` interface). Locations and
 * facilities are intentionally NOT included — per spec the user picks
 * them manually so they remain visible as red-asterisk required fields
 * after the demo fill.
 */
export interface ReportScenarioPartial {
  typeId?: string;
  categoryId?: string;
  subcategoryId?: string;
  priorityId?: string;
  date?: string;
  time?: string;
  description?: string;
  owner?: string;
}

const normalize = (s: string): string => s.trim().toLowerCase();

function findByName<T extends { name: string }>(
  list: T[],
  name: string,
): T | undefined {
  const target = normalize(name);
  if (!target) return undefined;
  return list.find(item => normalize(item.name) === target);
}

/**
 * Try `findByName` first; if no match, pick the loaded option at
 * `index % list.length`. Returns undefined only when the loaded list
 * is empty (in which case there's nothing to pick anyway).
 */
function findByNameOrFallback<T extends { name: string }>(
  list: T[],
  name: string,
  index: number,
): T | undefined {
  const byName = findByName(list, name);
  if (byName) return byName;
  if (list.length === 0) return undefined;
  return list[index % list.length];
}

/**
 * Resolve a scenario's preferred (offsetDays, timeHHMM) to a SAFE
 * (date, time) pair that the IncidentDetailsForm will accept.
 *
 * The form has two HTML5 validations to satisfy, both with the same
 * UTC-vs-local quirk:
 *
 *   1. Date input's `max` attribute is set to
 *      `new Date().toISOString().split('T')[0]` — i.e. UTC TODAY as a
 *      YYYY-MM-DD string. In any timezone east of UTC during the local
 *      evening / late night, this differs from local today by one day.
 *      Our chosen date must be ≤ this UTC string.
 *
 *   2. Time input's `max` is set ONLY when `formData.date` matches the
 *      same UTC-today string — in that case, max = local now's HH:MM.
 *      Our chosen time must be ≤ that local HH:MM whenever our date
 *      equals UTC today.
 *
 * Strategy: compute the proposed date using UTC components so it always
 * tracks the form's max-date reference (offset 0 ⇒ exactly UTC today,
 * never UTC tomorrow). For the time, clamp to "local now − 1 minute"
 * whenever the resolved date equals UTC today; otherwise pass through
 * the scenario's preferred time (any time is fine for past dates).
 *
 * The 1-minute safety buffer accounts for the minute-precision of the
 * form's time `max` — without it, a value exactly equal to local now
 * could still trip the validator on minute rollover.
 */
function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function resolveSafeDateTime(
  offsetDays: number,
  timeHHMM: string,
): { date: string; time: string } {
  // Compute the proposed date by offsetting UTC today. This aligns
  // exactly with the form's `max={new Date().toISOString().split('T')[0]}`
  // calculation, guaranteeing our date is always ≤ the form's max.
  const proposedUtc = new Date();
  proposedUtc.setUTCDate(proposedUtc.getUTCDate() + offsetDays);
  const dateStr = proposedUtc.toISOString().split('T')[0]; // YYYY-MM-DD (UTC)

  // The form's time max activates only when formData.date === UTC today.
  // If our resolved date matches UTC today (i.e. offsetDays === 0, or
  // any case where offsetting still lands on UTC today's string), we
  // clamp the time to local now − 1 minute so it can't exceed the
  // form's local-HH:MM time max.
  const utcTodayStr = new Date().toISOString().split('T')[0];
  let timeStr = timeHHMM || '';

  if (dateStr === utcTodayStr) {
    const safeNow = new Date(Date.now() - 60_000); // local now − 1 min
    timeStr = `${pad2(safeNow.getHours())}:${pad2(safeNow.getMinutes())}`;
  }

  return { date: dateStr, time: timeStr };
}

/**
 * Translate a DemoScenario into a partial Report-Incident FormData using
 * the currently-loaded dropdowns. Per-field rules:
 *
 *   reportType, category, priority — match scenarios.json name first,
 *     else fall back to the loaded list at `scenarioIndex % list.length`.
 *   subcategory — first try to find a subcategory matching the JSON name
 *     AMONG those whose category_id equals the resolved category.id.
 *     If that fails, fall back to the first available subcategory in
 *     that category (also picked by `scenarioIndex` for variety).
 *   description, date, time — straight from the scenario.
 *   owner — set to the supplied employeeId (current logged-in user).
 *
 * This guarantees every field is filled on every click as long as the
 * client has at least one option in each dropdown.
 */
export function resolveScenarioForReport(
  scenario: DemoScenario,
  loaded: LoadedReportData,
  employeeId: string,
  scenarioIndex: number,
): ReportScenarioPartial {
  const reportType = findByNameOrFallback(
    loaded.reportTypes,
    scenario.reportTypeName,
    scenarioIndex,
  );
  const category = findByNameOrFallback(
    loaded.categories,
    scenario.categoryName,
    scenarioIndex,
  );

  // Subcategory MUST belong to the resolved category. We filter the
  // subcategory list to the chosen category first, then look for a name
  // match, then fall back to position `scenarioIndex` within that
  // filtered list.
  let subcategory: SubcategoryItem | undefined;
  if (category) {
    const within = loaded.subcategories.filter(
      s => s.category_id === category.id,
    );
    subcategory = findByNameOrFallback(
      within,
      scenario.subcategoryName,
      scenarioIndex,
    );
  }
  // Last-resort: if no category resolved (shouldn't happen given the
  // fallback above, but defensively) pick any subcategory.
  if (!subcategory) {
    subcategory = findByNameOrFallback(
      loaded.subcategories,
      scenario.subcategoryName,
      scenarioIndex,
    );
  }

  const priority = findByNameOrFallback(
    loaded.priorities,
    scenario.priorityName,
    scenarioIndex,
  );

  const safeDateTime = resolveSafeDateTime(
    scenario.dateOffsetDays,
    scenario.time,
  );
  const partial: ReportScenarioPartial = {
    description: scenario.description,
    date: safeDateTime.date,
    time: safeDateTime.time,
    owner: employeeId || '',
  };
  if (reportType) partial.typeId = reportType.id;
  if (category) partial.categoryId = category.id;
  if (subcategory) partial.subcategoryId = subcategory.id;
  if (priority) partial.priorityId = priority.id;

  // Lightweight observability: log which fields used the fallback so the
  // demo presenter knows to update scenarios.json if they want a specific
  // value to stick. Only fires when env is on, so production logs stay
  // clean (the button doesn't run there anyway).
  const usedFallback: string[] = [];
  if (reportType && !findByName(loaded.reportTypes, scenario.reportTypeName)) {
    usedFallback.push(`reportType '${scenario.reportTypeName}' → '${reportType.name}'`);
  }
  if (category && !findByName(loaded.categories, scenario.categoryName)) {
    usedFallback.push(`category '${scenario.categoryName}' → '${category.name}'`);
  }
  if (subcategory && !findByName(loaded.subcategories, scenario.subcategoryName)) {
    usedFallback.push(`subcategory '${scenario.subcategoryName}' → '${subcategory.name}'`);
  }
  if (priority && !findByName(loaded.priorities, scenario.priorityName)) {
    usedFallback.push(`priority '${scenario.priorityName}' → '${priority.name}'`);
  }
  if (usedFallback.length > 0) {
    console.info(
      '[Demo Setup] Scenarios.json names did not match loaded options; used fallback picks:',
      usedFallback,
    );
  }

  return partial;
}

// =========================================================================
// Resolver — Edit Incident form
// (src/features/edit-incident/hooks/useEditIncidentForm.ts)
// Shape differs: `type` is a name string, `subcategory` is a name string,
// `priority` is an enum 'Low' | 'Medium' | 'High' | 'Critical'.
// =========================================================================

export interface LoadedEditData {
  categories: ConfigItem[];
}

export type EditPriorityEnum = 'Low' | 'Medium' | 'High' | 'Critical';

export interface EditScenarioPartial {
  type?: string;
  categoryId?: string;
  subcategory?: string;
  priority?: EditPriorityEnum;
  date?: string;
  time?: string;
  description?: string;
}

const VALID_EDIT_PRIORITIES: EditPriorityEnum[] = [
  'Low',
  'Medium',
  'High',
  'Critical',
];

function mapPriorityToEnum(
  priorityName: string,
): EditPriorityEnum | undefined {
  const norm = normalize(priorityName);
  const match = VALID_EDIT_PRIORITIES.find(p => p.toLowerCase() === norm);
  return match;
}

export function resolveScenarioForEdit(
  scenario: DemoScenario,
  loaded: LoadedEditData,
  scenarioIndex: number,
): EditScenarioPartial {
  const category = findByNameOrFallback(
    loaded.categories,
    scenario.categoryName,
    scenarioIndex,
  );
  const priorityEnum =
    mapPriorityToEnum(scenario.priorityName) ??
    VALID_EDIT_PRIORITIES[scenarioIndex % VALID_EDIT_PRIORITIES.length];

  const safeDateTime = resolveSafeDateTime(
    scenario.dateOffsetDays,
    scenario.time,
  );
  const partial: EditScenarioPartial = {
    // Edit form stores `type` as a name string, not an id. We pass it
    // through verbatim from the scenario — the dropdown's actual
    // options are populated elsewhere; this just primes the field.
    type: scenario.reportTypeName,
    subcategory: scenario.subcategoryName,
    description: scenario.description,
    date: safeDateTime.date,
    time: safeDateTime.time,
    priority: priorityEnum,
  };
  if (category) partial.categoryId = category.id;

  return partial;
}
