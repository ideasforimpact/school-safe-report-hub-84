
export interface ModuleAccessItem {
  name: string;
  employeeId?: string;
  key: string; // Required field
  module_id?: string; // Add this field to match backend expectations
  id?: string; // Add this for backward compatibility
}
