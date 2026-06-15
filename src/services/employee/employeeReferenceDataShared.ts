import { supabase } from '@/integrations/supabase/client';

export interface EmployeeDepartmentOption {
  id: string;
  department_name: string;
  created_at?: string;
  updated_at?: string;
}

export interface EmployeeTypeOption {
  id: string;
  type_name: string;
  created_at?: string;
  updated_at?: string;
}

interface ReferenceData {
  departments: EmployeeDepartmentOption[];
  employeeTypes: EmployeeTypeOption[];
}

// Single module-level promise — fetched ONCE per app session.
// Departments and employee types are static reference data: no need to re-fetch
// after a successful load. All callers (FilterBar, useEmployeeTypes, etc.) share
// the same in-flight request and cached result.
let referenceDataInflight: Promise<ReferenceData> | null = null;
let referenceDataCache: ReferenceData | null = null; // permanent once set

function fetchEmployeeReferenceDataShared(): Promise<ReferenceData> {
  // Return immediately if already fetched
  if (referenceDataCache) {
    return Promise.resolve(referenceDataCache);
  }

  // Attach to in-flight request if one is already running
  if (!referenceDataInflight) {
    referenceDataInflight = (async () => {
      const { data, error } = await supabase.functions.invoke('employee-management', {
        body: { operation: 'get_reference_data' },
      });
      if (error) throw error;
      referenceDataCache = {
        departments: (data?.departments as EmployeeDepartmentOption[]) || [],
        employeeTypes: (data?.employeeTypes as EmployeeTypeOption[]) || [],
      };
      return referenceDataCache;
    })().finally(() => {
      referenceDataInflight = null;
    });
  }
  return referenceDataInflight;
}

// Both functions share the same underlying combined call.
// Whichever fires first fetches both; the second gets the cached/in-flight result.
export function fetchEmployeeDepartmentsShared(): Promise<EmployeeDepartmentOption[]> {
  return fetchEmployeeReferenceDataShared().then(r => r.departments);
}

export function fetchEmployeeTypesShared(): Promise<EmployeeTypeOption[]> {
  return fetchEmployeeReferenceDataShared().then(r => r.employeeTypes);
}
