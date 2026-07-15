import { supabase } from "@/integrations/supabase/client";

export interface IncidentReferenceCheck {
  hasReferences: boolean;
  count: number;
  message: string;
}

export type ReferenceCheckType =
  | 'category'
  | 'subcategory'
  | 'priority'
  | 'reportType'
  | 'facility'
  | 'location'
  | 'contributingFactor'
  | 'employee'
  | 'grade'
  | 'section'
  | 'student';

interface ReferenceCheckRequest {
  type: ReferenceCheckType;
  id: string;
}

interface ReferenceCheckResult {
  type: ReferenceCheckType;
  id: string;
  hasReferences: boolean;
  count: number;
}

const NOUN_BY_TYPE: Record<ReferenceCheckType, string> = {
  category: 'category',
  subcategory: 'subcategory',
  priority: 'priority',
  reportType: 'report type',
  facility: 'facility',
  location: 'campus',
  contributingFactor: 'contributing factor',
  employee: 'employee',
  grade: 'grade',
  section: 'section',
  student: 'student',
};

// grade/section reference students, not incidents — everything else references incidents.
const LINKED_TO_STUDENTS: Set<ReferenceCheckType> = new Set(['grade', 'section']);
// employee/student are people — "they are linked", not "it is linked".
const PERSON_TYPES: Set<ReferenceCheckType> = new Set(['employee', 'student']);

function buildMessage(type: ReferenceCheckType, count: number): string {
  if (count === 0) return '';
  const noun = NOUN_BY_TYPE[type];
  const linkedTo = LINKED_TO_STUDENTS.has(type) ? 'student' : 'incident';
  const subject = PERSON_TYPES.has(type) ? 'they are' : 'it is';
  return `Cannot delete this ${noun} because ${subject} currently linked to ${count} ${linkedTo}${count > 1 ? 's' : ''}`;
}

type ReferenceCheckResponse = { data: { success?: boolean; results?: ReferenceCheckResult[] } | null; error: { message?: string } | null };

// De-duplicate identical checks (helps React StrictMode double-effect in dev,
// and callers like UserList whose `checks` array is rebuilt with a new
// reference but the same content on every re-render).
const referenceCheckInflight = new Map<string, Promise<ReferenceCheckResponse>>();
const referenceCheckRecent = new Map<string, { at: number; value: ReferenceCheckResponse }>();
const REFERENCE_CHECK_DEDUPE_MS = 1200;

const invokeCheckReferences = async (clientId: string, checks: ReferenceCheckRequest[]): Promise<ReferenceCheckResponse> => {
  const key = JSON.stringify({ clientId, checks });
  const recent = referenceCheckRecent.get(key);
  const now = Date.now();
  if (recent && now - recent.at < REFERENCE_CHECK_DEDUPE_MS) {
    return recent.value;
  }

  const existing = referenceCheckInflight.get(key);
  if (existing) {
    return existing;
  }

  const request = supabase.functions
    .invoke('fetch-incidents', {
      body: { operation: 'check_references', clientId, checks },
    })
    .then((res) => {
      referenceCheckRecent.set(key, { at: Date.now(), value: res });
      return res;
    })
    .finally(() => {
      referenceCheckInflight.delete(key);
    });

  referenceCheckInflight.set(key, request);
  return request;
};

// Batches any number of {type, id} checks into a single fetch-incidents call
// (operation: 'check_references'), which groups them server-side into one
// query per type instead of one request per row.
async function checkBatchReferences(
  checks: ReferenceCheckRequest[],
  clientId: string
): Promise<Record<string, IncidentReferenceCheck>> {
  const map: Record<string, IncidentReferenceCheck> = {};
  if (checks.length === 0) return map;

  try {
    const { data, error } = await invokeCheckReferences(clientId, checks);

    if (error) throw error;
    if (!data?.success) throw new Error('Failed to check references');

    for (const result of (data.results || []) as ReferenceCheckResult[]) {
      map[result.id] = {
        hasReferences: result.hasReferences,
        count: result.count,
        message: buildMessage(result.type, result.count),
      };
    }
  } catch (error) {
    console.error('Error checking references:', error);
    // Fail open (no references found) so delete buttons aren't stuck disabled
    // on a transient network error — matches the previous per-item behavior.
    for (const check of checks) {
      map[check.id] = { hasReferences: false, count: 0, message: '' };
    }
  }

  return map;
}

async function checkOne(type: ReferenceCheckType, id: string, clientId: string): Promise<IncidentReferenceCheck> {
  const map = await checkBatchReferences([{ type, id }], clientId);
  return map[id] || { hasReferences: false, count: 0, message: '' };
}

export const incidentReferenceService = {
  // Batched check — pass every row's id at once (e.g. from a list/table) to
  // fetch all of their reference states in a single round trip.
  checkBatchReferences,

  // Check if a category is referenced by incidents
  checkCategoryReferences: (categoryId: string, clientId: string) =>
    checkOne('category', categoryId, clientId),

  // Check if a subcategory is referenced by incidents
  checkSubcategoryReferences: (subcategoryId: string, clientId: string) =>
    checkOne('subcategory', subcategoryId, clientId),

  // Check if a priority is referenced by incidents
  checkPriorityReferences: (priorityId: string, clientId: string) =>
    checkOne('priority', priorityId, clientId),

  // Check if a report type is referenced by incidents
  checkReportTypeReferences: (typeId: string, clientId: string) =>
    checkOne('reportType', typeId, clientId),

  // Check if a facility is referenced by incidents
  checkFacilityReferences: (facilityId: string, clientId: string) =>
    checkOne('facility', facilityId, clientId),

  // Check if a location (campus) is referenced by incidents
  checkLocationReferences: (locationId: string, clientId: string) =>
    checkOne('location', locationId, clientId),

  // Check if a contributing factor is referenced by incidents (JSONB array column)
  checkContributingFactorReferences: (factorId: string, clientId: string) =>
    checkOne('contributingFactor', factorId, clientId),

  // Check if a student is referenced by incidents (people_involved JSONB array)
  checkStudentReferences: (studentId: string, clientId: string) =>
    checkOne('student', studentId, clientId),

  // Check if a grade is referenced by students
  checkGradeReferences: (gradeId: string, clientId: string) =>
    checkOne('grade', gradeId, clientId),

  // Check if a section is referenced by students
  checkSectionReferences: (sectionId: string, clientId: string) =>
    checkOne('section', sectionId, clientId),

  // Check if an employee is referenced by incidents in people_involved column
  checkEmployeeReferences: (employeeId: string, clientId: string) =>
    checkOne('employee', employeeId, clientId),
};
