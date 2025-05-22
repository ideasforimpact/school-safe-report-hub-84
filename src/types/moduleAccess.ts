
export interface ModuleAccessItem {
  name: string;
  employeeId?: string;
  key: string;
  module_id: string;
  access_level?: {
    is_admin?: boolean;
    [key: string]: any;
  };
}
