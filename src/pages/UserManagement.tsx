import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployee } from '@/contexts/employee/EmployeeContext';
import UserList from '@/components/users/UserList';
import AddUserDialog from '@/components/users/AddUserDialog';
import EditUserDialog from '@/components/users/EditUserDialog';
import ImportEmployeeDialog from '@/components/employee/ImportEmployeeDialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, FileUp, RefreshCw, AlertCircle, Search, Users, X } from 'lucide-react';
import { User } from '@/contexts/auth/types';
import { 
  Employee,
  EmployeeType as EmployeeContextType, 
  DepartmentType as EmployeeContextDepartmentType,
  EmploymentStatus 
} from '@/contexts/employee/types';
import { toast } from "sonner";
import { 
  addNewUser, 
  updateExistingUser,
  deleteExistingUser, 
  deactivateExistingUser,
  reactivateExistingUser
} from '@/services/auth/userManagementService';
import { processEmployeeExcel } from '@/services/employee/importEmployeeService';
import { supabase } from '@/integrations/supabase/client';
import { getAllEmployeesFromApi } from '@/services/employee/employeeRetrievalService';
import { getEmployeeModuleAccessItems, getModuleAccessForUser, updateEmployeeModulePermissions } from '@/services/employee/employeeModuleService';
import { useEmployeeStore } from '@/store/EmployeeContext';
import { getEmployeeData, isEmployeeAdmin, isEmployeeSuperAdmin } from '@/store/employeeSelectors';
import { useEmployeeData } from '@/hooks/useEmployeeData';
import { ModuleAccessItem } from '@/types/moduleAccess';
import { incidentReferenceService } from '@/services/incident/incidentReferenceService';

// Import the necessary types from auth context
import { EmployeeType, DepartmentType } from '@/contexts/auth/types';

// Helper function to convert employee type and department type
const convertEmployeeType = (employeeType: EmployeeContextType): EmployeeType => {
  // Handle 'intern' which is in employee types but not in auth types
  if (employeeType === 'intern') {
    return 'consultant' as EmployeeType; // Map intern to consultant as fallback
  }
  
  // Handle the difference between 'part_time' and 'part-time'
  if (employeeType === 'part_time') {
    return 'part_time' as EmployeeType;
  }
  
  return employeeType as EmployeeType;
};

// Helper function to convert department type
const convertDepartmentType = (department: EmployeeContextDepartmentType): DepartmentType => {
  // All departments are now compatible because we've expanded the DepartmentType
  return department as DepartmentType;
};

// CPD entry shape for users list (from cpd_entries + domain name)
export type CpdEntryForUser = {
  id: string;
  title: string;
  domain_id: string;
  domain_name: string;
  hour: number | null;
  captured_date: string | null;
  category: string | null;
  cpd_learning: string | null;
};

// Export the EmployeeUser interface so it can be used by other components
export interface EmployeeUser extends Omit<User, 'modulePermissions'> {
  moduleAccessPayload?: ModuleAccessItem[];
  employeeId?: string;
  employeeType?: EmployeeType; 
  department?: DepartmentType;
  joiningDate?: string;
  cpd_entries?: CpdEntryForUser[];
  // No need to explicitly define role here since we're extending from User
}

export interface iModule {
  id: string;
  name: string;
  key?: string;
  icon?: string;
  level?: string;
  enabled?: boolean;
  order?: number;
  url?: string;
}

interface UserManagementProps {
  embedded?: boolean;
}
type DepartmentRow = {
  id: string;
  department_name: string;
};

// Main UserManagement component
const UserManagement = ({ embedded = false }: UserManagementProps) => {
  const { user } = useAuth();
  const { addEmployee, deactivateEmployee, fetchEmployees } = useEmployee();
  const { employeeData } = useAuth();
    const { state } = useEmployeeStore();

  
  // Force refresh of employee data
  // const { refetchModules } = useEmployeeData();
  
  // useEffect(() => {
  //   // Ensure employee data is loaded
  //   refetchModules();
  // }, []);
  
  // Get employee data directly from Redux
  // const employeeData = getEmployeeData(state);
  // Determine admin status from Redux store
  const isAdmin = isEmployeeAdmin(state);
  const isSuperAdmin = isEmployeeSuperAdmin(state);
  
  // Check if user has admin access level for user management
  const hasUserManagementAdminAccess = React.useMemo(() => {
    if (isSuperAdmin) return true;
    
    // Check configured modules for user management admin access
    const userManagementModule = state.configuredModules?.find(
      module => module.key === 'userManagement' || module.name.toLowerCase().includes('user')
    );
    
    if (userManagementModule?.accessLevel) {
      // Check for different possible admin flag formats
      return userManagementModule.accessLevel.isAdmin === true || 
             userManagementModule.accessLevel.is_admin === true;
    }
    
    return false;
  }, [isSuperAdmin, state.configuredModules]);
  
  console.log("UserManagement - Redux employeeData:", employeeData);
  console.log("UserManagement - Redux isAdmin:", isAdmin);
  console.log("UserManagement - Redux isSuperAdmin:", isSuperAdmin);
  console.log("UserManagement - hasUserManagementAdminAccess:", hasUserManagementAdminAccess);
  console.log("UserManagement - User from auth context:", user);
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<EmployeeUser | null>(null);
  // Initialize loading to true - will be set to false after data is loaded
  const [isLoading, setIsLoading] = useState(true);
  const [employeeUsers, setEmployeeUsers] = useState<EmployeeUser[]>([]);
  const [cpdDomains, setCpdDomains] = useState<{ id: string; name: string }[]>([]);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [joiningDateFrom, setJoiningDateFrom] = useState('');
  const [joiningDateTo, setJoiningDateTo] = useState('');
  
  // Get clientId from employee data or user context
  const clientId = state.employeeData?.clientId || user?.clientId;
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [departmentOptions, setDepartmentOptions] = useState<DepartmentRow[]>([]);

  // Log the clientId for debugging
  useEffect(() => {
    console.log("UserManagement - Current employee data:", employeeData);
    console.log("UserManagement - Current user data:", user);
    console.log("UserManagement - ClientId being used:", clientId);
  }, [employeeData, user, clientId]);
  const fetchDepartments = async () => {
    if (!clientId) return;

    try {
      const { data, error } = await supabase
        .from('employee_departments' as any)
        .select('id, department_name')
        .order('department_name', { ascending: true });
      
      if (error) throw error;
      
      setDepartmentOptions(data as any);
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast.error('Failed to load departments');
    }
  };

  useEffect(() => {
    if (clientId) {
      fetchDepartments();
    }
  }, [clientId]);
  // Default form data for the user forms - Using only moduleAccessPayload
  const [formData, setFormData] = useState<{
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    designation?: string;
    tags?: string[];
    employeeId?: string;
    employeeType?: EmployeeType;
    department?: DepartmentType;
    joiningDate?: string;
    clientId?: string;
    moduleAccessPayload?: ModuleAccessItem[];
    is_cpd_involved?: boolean;
  }>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    designation: '',
    tags: [],
    clientId: clientId,
    moduleAccessPayload: [],
    is_cpd_involved: false,
  });
  
  // Use a ref to store the latest formData for reliable access in async operations
  const formDataRef = React.useRef(formData);
  React.useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  // Update formData when clientId changes
  useEffect(() => {
    if (clientId) {
      setFormData(prev => ({
        ...prev,
        clientId: clientId
      }));
    }
  }, [clientId]);

  // Fetch employees from Supabase and map them to User format
  useEffect(() => {
    // Only fetch if we have a clientId
    if (clientId) {
      fetchEmployeesList();
    }
  }, [clientId]);

  // Filter users based on search and filters
  const filteredUsers = React.useMemo(() => {
    try {
      const normalizeToDate = (value?: string) => {
        if (!value) return '';
        const date = new Date(value);
        if (isNaN(date.getTime())) return '';
        return date.toISOString().split('T')[0];
      };

      return employeeUsers.filter(user => {
        // Search filter
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch = 
          user.firstName?.toLowerCase().includes(searchLower) ||
          user.lastName?.toLowerCase().includes(searchLower) ||
          user.email?.toLowerCase().includes(searchLower) ||
          user.employeeId?.toLowerCase().includes(searchLower) ||
          `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchLower);

        // Status filter
        const matchesStatus = 
          statusFilter === 'all' || 
          (statusFilter === 'active' && user.isActive) ||
          (statusFilter === 'inactive' && !user.isActive);

        const selectedDept = departmentOptions.find(
          d => d.id === departmentFilter
        );
        
        const matchesDepartment =
          departmentFilter === 'all' ||
          user.department === selectedDept?.department_name;

        const normalizedJoiningDate = normalizeToDate(user.joiningDate);
        const matchesJoiningDateFrom = !joiningDateFrom || (normalizedJoiningDate !== '' && normalizedJoiningDate >= joiningDateFrom);
        const matchesJoiningDateTo = !joiningDateTo || (normalizedJoiningDate !== '' && normalizedJoiningDate <= joiningDateTo);
        const matchesJoiningDate = matchesJoiningDateFrom && matchesJoiningDateTo;

        return matchesSearch && matchesStatus && matchesDepartment && matchesJoiningDate;
      });
    } catch (error) {
      console.error('Error filtering users:', error);
      return employeeUsers; // Return all users if filtering fails
    }
  }, [employeeUsers, searchQuery, statusFilter, departmentFilter, joiningDateFrom, joiningDateTo]);

  const fetchEmployeesList = async () => {
    // Add clientId restriction check
    if (!clientId) {
      console.warn("Cannot fetch employees: No clientId available");
      toast.error("Unable to load employees: No client context available");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      // Fetch CPD domains for tabs and cpd_entries for attaching to users
      const [employeeData, domainsRes, entriesRes] = await Promise.all([
        getAllEmployeesFromApi(clientId),
        supabase.from('cpd_domain').select('id, name').eq('active', true).order('name'),
        supabase
          .from('cpd_entries')
          .select('id, employee_id, title, domain_id, hour, captured_date, category, cpd_learning')
          .eq('client_id', clientId)
          .eq('active', true),
      ]);

      const domainsList = (domainsRes.data ?? []) as { id: string; name: string }[];
      if (domainsList.length) {
        setCpdDomains(domainsList);
      } else {
        setCpdDomains([]);
      }

      const domainNameById: Record<string, string> = {};
      domainsList.forEach((d) => {
        domainNameById[d.id] = d.name;
      });

      const allCpdEntries = (entriesRes.data ?? []).map((row: any) => ({
        id: row.id,
        title: row.title ?? '',
        domain_id: row.domain_id ?? '',
        domain_name: domainNameById[row.domain_id] ?? '',
        hour: row.hour ?? null,
        captured_date: row.captured_date ?? null,
        category: row.category ?? null,
        cpd_learning: row.cpd_learning ?? null,
        employee_id: row.employee_id,
      }));

      console.log(employeeData, "employeeData124");

      if (employeeData && employeeData.length > 0) {
        // Process each employee to get their module access items and CPD entries
        const processedUsers = await Promise.all(employeeData.map(async employee => {
          const moduleAccessItems = await getModuleAccessForUser({
            id: employee.id,
            isSuperAdmin: employee.isSuperAdmin,
            clientId: employee.clientId
          });
          const cpd_entries = allCpdEntries
            .filter((e: any) => e.employee_id === employee.id)
            .map(({ employee_id: _, ...rest }: any) => rest);
          return {
            id: employee.id,
            firstName: employee.firstName,
            lastName: employee.lastName,
            email: employee.email,
            phone: (employee as any).phone,
            designation: (employee as any).designation,
            employeeId: employee.employeeId,
            employeeType: employee.employeeType as any,
            department: employee.department as any,
            joiningDate: employee.joiningDate,
            isActive: employee.status === true,
            createdAt: employee.createdAt || new Date().toISOString(),
            clientId: employee.clientId,
            isSuperAdmin: employee.isSuperAdmin,
            is_cpd_involved: employee.isCpdInvolved ?? false,
            moduleAccessPayload: moduleAccessItems,
            cpd_entries,
            role: 'user' as const
          };
        }));

        setEmployeeUsers(processedUsers);
        console.log("Fetched employees:", processedUsers);
      } else {
        console.log("No employees found or error fetching employees");
        setEmployeeUsers([]);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
      toast.error("Failed to fetch employee data");
      setEmployeeUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handler for adding a new user - Uses only moduleAccessPayload
  const handleAddUser = async (submittedFormData?: typeof formData) => {
    try {
      setIsLoading(true);
      
      // Use the submitted formData if provided, otherwise fall back to ref/state
      // This ensures we have the most recent data including moduleAccessPayload
      const currentFormData = submittedFormData ? { ...submittedFormData } : { ...formDataRef.current };
      
      // Make sure clientId is set
      if (!currentFormData.clientId && clientId) {
        currentFormData.clientId = clientId;
        setFormData(prev => ({
          ...prev,
          clientId: clientId
        }));
      }
      
      console.log("Adding new user with data:", currentFormData);
      console.log("Module access payload:", currentFormData.moduleAccessPayload);
      
      if (!currentFormData.moduleAccessPayload || currentFormData.moduleAccessPayload.length === 0) {
        console.warn("No module access items selected.");
      }
      
      // Validate required fields
      if (!currentFormData.firstName || !currentFormData.lastName || !currentFormData.employeeId) {
        console.error("Missing required fields:", currentFormData);
        toast.error("Please fill in all required fields (First Name, Last Name, and Employee ID)");
        setIsLoading(false);
        return;
      }
      
      console.log("Starting to add new user with data:", currentFormData);
      
      // In a real app, we'd validate the form data here
      const updatedUsers = await addNewUser(
        [] as any,
        { 
          ...currentFormData, 
          clientId: currentFormData.clientId || clientId,
          password: 'defaultPassword123',
          isActive: true,
          // Add required modulePermissions property to satisfy interface
          modulePermissions: {} as any,
          // Default role
          role: 'user' as const
        }
      );
      
      console.log("addNewUser returned:", updatedUsers);
      
      if (updatedUsers) {
        console.log("addNewUser succeeded, checking employee fields...");
        console.log("Employee fields check:", {
          employeeId: currentFormData.employeeId,
          employeeType: currentFormData.employeeType,
          department: currentFormData.department,
          joiningDate: currentFormData.joiningDate
        });
        
        // Also add the user as an employee using the Supabase edge function
        // Make employeeType, department, and joiningDate optional - use defaults if not provided
        if (currentFormData.employeeId) {
          try {
            // Prepare employee data for the edge function
            // Use defaults for optional fields if not provided
            const employeeData = {
              employeeId: currentFormData.employeeId,
              firstName: currentFormData.firstName,
              lastName: currentFormData.lastName,
              email: currentFormData.email || undefined,
              phone: currentFormData.phone || '',
              designation: currentFormData.designation || (currentFormData.tags?.join(', ') || ''),
              employeeType: currentFormData.employeeType ?? undefined,
              department: currentFormData.department ?? undefined,
              joiningDate: currentFormData.joiningDate || new Date().toISOString().split('T')[0],
              status: 'active' as EmploymentStatus,
              clientId: currentFormData.clientId || clientId,
              moduleAccessPayload: currentFormData.moduleAccessPayload || []
            };
            
            console.log("Prepared employee data for edge function:", employeeData);
            
            // First try the edge function
            try {
              console.log("Attempting to create employee via edge function:", employeeData);
              const { data, error } = await supabase.functions.invoke('employee-management', {
                body: JSON.stringify({
                  operation: 'create',
                  employee: employeeData
                })
              });
              
              if (error) {
                console.error("Edge function error:", error);
                throw error;
              }

              if(data?.hasOwnProperty("error")){
                 toast.error(data?.error);
              }
              else{
                  console.log("Employee created via edge function:", data);
                  toast.success("Employee record created successfully");
              }
              
            } catch (edgeFuncError) {
              console.error("Edge function error:", edgeFuncError);
              // Fall back to the context function if the edge function fails
              await addEmployee({
                ...employeeData,
              } as any); // Cast as any to bypass type checking
              
              console.log("Employee created via context function");
              toast.success("Employee record created via local storage");
            }
            
            refreshEmployeesList();
            
            // Close dialog and reset form on success
            resetForm();
            setIsAddDialogOpen(false);
            setIsLoading(false);
          } catch (empError) {
            console.error("Error adding employee record:", empError);
            toast.error("User added but employee record creation failed");
            setIsLoading(false);
            // Don't close dialog on error so user can retry
          }
        } else {
          console.warn("Employee ID is missing, skipping employee creation");
          console.log("Available fields:", currentFormData);
          // Still close the dialog and reset form even if employee creation is skipped
          resetForm();
          setIsAddDialogOpen(false);
          setIsLoading(false);
          toast.success("User added successfully (employee record creation skipped - missing employee ID)");
        }
      } else {
        console.error("addNewUser returned null or undefined - user creation failed");
        toast.error("Failed to add user. Please check the console for details.");
        setIsLoading(false);
        // Don't close the dialog on error so user can retry
      }
    } catch (error) {
      console.error("Error adding user:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Failed to add user: ${errorMessage}`);
      setIsLoading(false);
      // Don't close the dialog on error so user can retry
    }
  };

  // Function to refresh the employees list after changes
  const refreshEmployeesList = async () => {
    // Add clientId restriction check
    if (!clientId) {
      console.warn("Cannot refresh employees: No clientId available");
      return;
    }

    try {
      setIsLoading(true);
      // Pass clientId to filter employees by client
      const employeeData = await getAllEmployeesFromApi(clientId);
      
      if (employeeData && employeeData.length > 0) {
        const processedUsers = await Promise.all(employeeData.map(async employee => {
          // Get module access items (handles both super admin and regular employees)
          const moduleAccessItems = await getModuleAccessForUser({
            id: employee.id,
            isSuperAdmin: employee.isSuperAdmin,
            clientId: employee.clientId
          });
          
          return {
            id: employee.id,
            firstName: employee.firstName,
            lastName: employee.lastName,
            email: employee.email,
            employeeId: employee.employeeId,
            employeeType: employee.employeeType as any,
            department: employee.department as any,
            joiningDate: employee.joiningDate,
            isActive: employee.status === true,
            createdAt: employee.createdAt || new Date().toISOString(),
            clientId: employee.clientId,
            isSuperAdmin: employee.isSuperAdmin,
            phone: employee.phone,
            designation: employee.designation,
            is_cpd_involved: employee.isCpdInvolved ?? false,
            // Store module access items directly
            moduleAccessPayload: moduleAccessItems,
            // Add default role property to satisfy User interface
            role: 'user' as const
          };
        }));

        setEmployeeUsers(processedUsers);
        console.log("Refreshed employees list:", processedUsers);
      }
    } catch (error) {
      console.error("Error refreshing employees:", error);
      toast.error("Failed to refresh employee data");
    } finally {
      setIsLoading(false);
    }
  };

  // Handler for updating an existing user - Simplified to just refresh the list
  const handleUpdateUser = async () => {
    // This will be called after the EditUserDialog handles the update
    // Just refresh the employee list to show updated data
    await refreshEmployeesList();
  };

  // Handler for deleting a user
  const handleDeleteUser = async (userId: string) => {
    if (!employeeData?.clientId) {
      toast.error('Client information not available');
      return;
    }

    // Check if employee is linked to incidents - prevent deletion if linked
    try {
      const refInfo = await incidentReferenceService.checkEmployeeReferences(userId, employeeData.clientId);
      if (refInfo.hasReferences) {
        toast.error(refInfo.message || `This employee is linked to ${refInfo.count} incident(s) and cannot be deleted.`);
        return;
      }
    } catch (error) {
      console.error('Error checking employee references:', error);
      // Continue with deletion if check fails (fail open)
    }

    try {
      setIsLoading(true);
      
      console.log("Attempting to delete employee with ID:", userId);
      
      // Call the edge function directly to delete the employee
      const { data, error } = await supabase.functions.invoke('employee-management', {
        body: JSON.stringify({
          operation: 'delete',
          id: userId
        })
      });
      
      if (error) {
        console.error("Edge function delete error:", error);
        throw error;
      }
      
      // Check if the response contains an error
      if (data && typeof data === 'object' && 'error' in data) {
        console.error("Edge function returned error:", data.error);
        toast.error(data.error || "Failed to delete employee");
        setIsLoading(false);
        return;
      }
      
      console.log("Employee deleted via edge function:", data);
      
      // Refresh the employee list to reflect the deletion
      await refreshEmployeesList();
      
      toast.success("Employee deleted successfully");
    } catch (error) {
      console.error("Error deleting employee:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Failed to delete employee: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handler for deactivating a user
  const handleDeactivateUser = async (userId: string) => {
    try {
      setIsLoading(true);
      const updatedUsers = deactivateExistingUser([] as any, userId);
      if (updatedUsers) {
        try {
          const { data, error } = await supabase.functions.invoke('employee-management', {
            body: JSON.stringify({
              operation: 'deactivate',
              id: userId
            })
          });
          
          if (error) {
            console.error("Edge function deactivate error:", error);
            await deactivateEmployee(userId);
            console.log("Employee deactivated via context function");
          } else {
            console.log("Employee deactivated via edge function:", data);
          }
          
          await refreshEmployeesList();
          // Removed toast.success("User deactivated successfully");
        } catch (error) {
          console.error("Error deactivating employee:", error);
          // toast.error("User deactivated but employee record update failed");
        }
      }
    } catch (error) {
      console.error("Error deactivating user:", error);
      toast.error("Failed to deactivate user");
    } finally {
      setIsLoading(false);
    }
  };

  // Handler for reactivating a user
  const handleReactivateUser = async (userId: string) => {
    try {
      setIsLoading(true);
      const updatedUsers = reactivateExistingUser([] as any, userId);
      if (updatedUsers) {
        try {
          const { data, error } = await supabase.functions.invoke('employee-management', {
            body: JSON.stringify({
              operation: 'reactivate',
              id: userId
            })
          });
          
          if (error) {
            console.error("Edge function reactivate error:", error);
          } else {
            console.log("Employee reactivated via edge function:", data);
          }
          
          await refreshEmployeesList();
          // Removed toast.success("User reactivated successfully");
        } catch (error) {
          console.error("Error reactivating employee:", error);
          toast.error("Failed to reactivate user");
        }
      }
    } catch (error) {
      console.error("Error reactivating user:", error);
      toast.error("Failed to reactivate user");
    } finally {
      setIsLoading(false);
    }
  };

  // Handler for importing employees from Excel
  const handleImportEmployees = async (file: File) => {
    if (!clientId) {
      toast.error("No client context available for import");
      return;
    }

    try {
      setIsLoading(true);
      const userManagementModule = state.configuredModules;
      await processEmployeeExcel(file, clientId, userManagementModule);
      await refreshEmployeesList();
      toast.success("Employees imported successfully");
    } catch (error) {
      console.error("Error importing employees:", error);
      toast.error("Failed to import employees");
    } finally {
      setIsLoading(false);
    }
  };

  // Reset form to default values - Using only moduleAccessPayload
  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      designation: '',
      tags: [],
      clientId: clientId,
      moduleAccessPayload: []
    });
    setCurrentUser(null);
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setDepartmentFilter('all');
    setJoiningDateFrom('');
    setJoiningDateTo('');
  };

  // Get active filters count
  const activeFiltersCount = [
    searchQuery ? 1 : 0,
    statusFilter !== 'all' ? 1 : 0,
    departmentFilter !== 'all' ? 1 : 0,
    joiningDateFrom ? 1 : 0,
    joiningDateTo ? 1 : 0,
  ].reduce((sum, count) => sum + count, 0);

  // If no clientId is available, show a warning message
  if (!clientId) {
    const warningContent = (
      <Card className="mx-6">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-16 w-16 text-amber-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Client Context Available</h2>
          <p className="text-gray-600 text-center max-w-md">
            Unable to load user management. Please ensure you have a valid client context or contact your administrator.
          </p>
        </CardContent>
      </Card>
    );

    if (embedded) {
      return warningContent;
    }

    return (
      <Layout>
        <div className="w-full py-6">
          {warningContent}
        </div>
      </Layout>
    );
  }

  const content = (
    <div className="space-y-6">
      {!embedded && (
        <div className="bg-gradient-to-r from-blue-50 to-transparent p-4 rounded-lg border border-blue-100 mx-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">User Management</h1>
            </div>
            {hasUserManagementAdminAccess && (
              <div className="flex gap-2">
                <Button 
                  onClick={() => setIsImportDialogOpen(true)}
                  className="flex items-center gap-2"
                  variant="secondary"
                  disabled={isLoading}
                >
                  <FileUp className="h-4 w-4" />
                  <span>Import Employees</span>
                </Button>
                <Button 
                  onClick={() => setIsAddDialogOpen(true)}
                  disabled={isLoading}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Employee
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {embedded && hasUserManagementAdminAccess && (
        <div className="flex justify-end items-center">
          <div className="flex gap-2">
            <Button 
              onClick={() => setIsImportDialogOpen(true)}
              className="flex items-center gap-2"
              variant="secondary"
              disabled={isLoading}
            >
              <FileUp className="h-4 w-4" />
              <span>Import Employees</span>
            </Button>
            <Button 
              onClick={() => setIsAddDialogOpen(true)}
              disabled={isLoading}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add Employee
            </Button>
          </div>
        </div>
      )}

      <Card className="mx-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Users</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchEmployeesList}
            disabled={isLoading}
            title="Refresh employee list"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </CardHeader>
        
        {/* Search and Filters Section - Inside the card */}
        <CardContent className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-4 md:space-y-0 w-full mb-4">
            {/* Search Bar */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by name, email, employee ID, or address..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10"
                />
              </div>
            </div>
            
            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] h-10">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={departmentFilter}
                onValueChange={setDepartmentFilter}
                >
                <SelectTrigger className="w-[180px] h-10">
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>

                  {departmentOptions.map((dept) => (
                    <SelectItem value={dept.id}>
                      {dept.department_name
                        ? dept.department_name.charAt(0).toUpperCase() +
                          dept.department_name.slice(1)
                        : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 whitespace-nowrap">
                  Joining Date From:
                </span>
                <Input
                  type="date"
                  value={joiningDateFrom}
                  onChange={(e) => setJoiningDateFrom(e.target.value)}
                  className="w-[170px] h-10"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 whitespace-nowrap">
                  Joining Date To:
                </span>
                <Input
                  type="date"
                  value={joiningDateTo}
                  onChange={(e) => setJoiningDateTo(e.target.value)}
                  className="w-[170px] h-10"
                />
              </div>
              {activeFiltersCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllFilters}
                  className="text-gray-600 h-10"
                >
                  <X className="h-4 w-4" />
                  Clear Filters ({activeFiltersCount})
                </Button>
              )}
            </div>
          </div>
          
          {/* User count after search and filters */}
          <div className="mb-6">
            <p className="text-sm text-gray-600">
              Showing {filteredUsers.length} of {employeeUsers.length} users
            </p>
          </div>
          
          {isLoading ? (
            <div className="flex flex-col justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mb-4"></div>
              <p className="text-sm text-gray-600">Loading employees...</p>
            </div>
          ) : (
            <div>
              {filteredUsers && filteredUsers.length > 0 ? (
                <UserList 
                  users={filteredUsers}
                  onEditClick={(user) => {
                    // Use latest user from list by id so we always show fresh data (e.g. after a save)
                    const latestUser = employeeUsers.find((u: any) => u.id === user.id) ?? user;
                    const cpdValue = (latestUser as any).is_cpd_involved ?? (latestUser as any).isCpdInvolved ?? false;
                    setCurrentUser(latestUser);

                    // Format joiningDate to YYYY-MM-DD format for date input
                    let formattedJoiningDate = latestUser.joiningDate || '';
                    if (formattedJoiningDate) {
                      try {
                        // If it's an ISO string or other format, convert to YYYY-MM-DD
                        const date = new Date(formattedJoiningDate);
                        if (!isNaN(date.getTime())) {
                          formattedJoiningDate = date.toISOString().split('T')[0];
                        }
                      } catch (e) {
                        console.warn("Error formatting joining date:", e);
                        // If already in YYYY-MM-DD format, keep it as is
                      }
                    }

                    setFormData({
                      firstName: latestUser.firstName,
                      lastName: latestUser.lastName,
                      email: latestUser.email,
                      phone: (latestUser as any).phone,
                      designation: (latestUser as any).designation,
                      tags: ((latestUser as any).designation || '')
                        .split(',')
                        .map((tag: string) => tag.trim())
                        .filter(Boolean)
                        .slice(0, 2),
                      employeeId: latestUser.employeeId,
                      employeeType: latestUser.employeeType,
                      department: latestUser.department,
                      joiningDate: formattedJoiningDate,
                      clientId: latestUser.clientId || clientId,
                      moduleAccessPayload: latestUser.moduleAccessPayload || [],
                      is_cpd_involved: cpdValue,
                    });
                    setIsEditDialogOpen(true);
                  }}
                  onDeleteUser={handleDeleteUser}
                  onDeactivateUser={async (id) => {
                    try {
                      await deactivateExistingUser([] as any, id);
                      await refreshEmployeesList();
                      // toast.success("User deactivated successfully");
                    } catch (error) {
                      console.error("Error deactivating user:", error);
                      toast.error("Failed to deactivate user");
                    }
                  }}
                  onReactivateUser={async (id) => {
                    try {
                      await reactivateExistingUser([] as any, id);
                      await refreshEmployeesList();
                      // toast.success("User reactivated successfully");
                    } catch (error) {
                      console.error("Error reactivating user:", error);
                      toast.error("Failed to reactivate user");
                    }
                  }}
                  hasAdminAccess={hasUserManagementAdminAccess}
                  onRefresh={refreshEmployeesList}
                />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {searchQuery || statusFilter !== 'all' ? 'No users found matching your filters.' : 'No users found.'}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add User Dialog - Only render if user has admin access */}
      {hasUserManagementAdminAccess && (
        <AddUserDialog 
          isOpen={isAddDialogOpen}
          setIsOpen={setIsAddDialogOpen}
          formData={formData}
          setFormData={setFormData}
          onSubmit={(formData) => handleAddUser(formData)}
          resetForm={resetForm}
          isLoading={isLoading}
          clientId={clientId}
        />
      )}

      {/* Edit User Dialog - Remove clientId prop */}
      <EditUserDialog 
        isOpen={isEditDialogOpen}
        setIsOpen={setIsEditDialogOpen}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleUpdateUser}
        resetForm={resetForm}
        isLoading={isLoading}
        currentUser={currentUser}
        employeeUsers={employeeUsers}
      />

      {/* Import Employees Dialog - Only render if user has admin access */}
      {hasUserManagementAdminAccess && (
        <ImportEmployeeDialog
          isOpen={isImportDialogOpen}
          setIsOpen={setIsImportDialogOpen}
          onImportEmployees={handleImportEmployees}
          clientId={clientId}
        />
      )}
    </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <Layout>
      <div className="w-full py-6">
        {content}
      </div>
    </Layout>
  );
};

export default UserManagement;
