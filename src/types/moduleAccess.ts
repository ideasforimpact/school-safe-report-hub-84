
export interface ModuleAccessItem {
  name: string;
  employeeId?: string;
  key: string; // Required field
  module_id?: string; // Optional since it will be looked up by name in the edge function
  id?: string; // Add this for backward compatibility
}
