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

export function fetchEmployeeDepartmentsShared(): Promise<EmployeeDepartmentOption[]> {
  if (!departmentsInflight) {
    departmentsInflight = (async () => {
      const { data, error } = await supabase
        .from('employee_departments')
        .select('*')
        .order('department_name', { ascending: true });
      if (error) throw error;
      return (data || []) as EmployeeDepartmentOption[];
    })().finally(() => {
      departmentsInflight = null;
    });
  }
  return departmentsInflight;
}

export function fetchEmployeeTypesShared(): Promise<EmployeeTypeOption[]> {
  if (!typesInflight) {
    typesInflight = (async () => {
      const { data, error } = await supabase
        .from('employee_type')
        .select('*')
        .order('type_name', { ascending: true });
      if (error) throw error;
      return (data || []) as EmployeeTypeOption[];
    })().finally(() => {
      typesInflight = null;
    });
  }
  return typesInflight;
}
