
export interface ModuleAccessItem {
  name: string;
  employeeId?: string;
  key: string;
  module_id: string; // Now required since we're not looking it up in the edge function
}
