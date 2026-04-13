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

/**
 * Single in-flight promise per resource so React 18 Strict Mode (double effect run)
 * does not duplicate identical REST calls.
 */
let departmentsInflight: Promise<EmployeeDepartmentOption[]> | null = null;
let typesInflight: Promise<EmployeeTypeOption[]> | null = null;
let departmentsRecent: { at: number; value: EmployeeDepartmentOption[] } | null = null;
let typesRecent: { at: number; value: EmployeeTypeOption[] } | null = null;
const SHARED_DEDUPE_MS = 1200;

export function fetchEmployeeDepartmentsShared(): Promise<EmployeeDepartmentOption[]> {
  const now = Date.now();
  if (departmentsRecent && now - departmentsRecent.at < SHARED_DEDUPE_MS) {
    return Promise.resolve(departmentsRecent.value);
  }

  if (!departmentsInflight) {
    departmentsInflight = (async () => {
      const { data, error } = await supabase.functions.invoke('employee-management', {
        body: JSON.stringify({
          operation: 'list_departments',
        }),
      });
      if (error) throw error;
      const departments = ((data?.departments as EmployeeDepartmentOption[]) || []);
      departmentsRecent = { at: Date.now(), value: departments };
      return departments;
    })().finally(() => {
      departmentsInflight = null;
    });
  }
  return departmentsInflight;
}

export function fetchEmployeeTypesShared(): Promise<EmployeeTypeOption[]> {
  const now = Date.now();
  if (typesRecent && now - typesRecent.at < SHARED_DEDUPE_MS) {
    return Promise.resolve(typesRecent.value);
  }

  if (!typesInflight) {
    typesInflight = (async () => {
      const { data, error } = await supabase
        .from('employee_type')
        .select('*')
        .order('type_name', { ascending: true });
      if (error) throw error;
      const types = (data || []) as EmployeeTypeOption[];
      typesRecent = { at: Date.now(), value: types };
      return types;
    })().finally(() => {
      typesInflight = null;
    });
  }
  return typesInflight;
}
