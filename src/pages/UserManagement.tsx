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
import { UserPlus, FileUp, RefreshCw, AlertCircle, Search } from 'lucide-react';
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

// Export the EmployeeUser interface so it can be used by other components
export interface EmployeeUser extends Omit<User, 'modulePermissions'> {
  moduleAccessPayload?: ModuleAccessItem[];
  employeeId?: string;
  employeeType?: EmployeeType; 
  department?: DepartmentType;
  joiningDate?: string;
  // No need to explicitly define role here since we're extending from User
}

interface UserManagementProps {
  embedded?: boolean;
}

// Main UserManagement component
const UserManagement = ({ embedded = false }: UserManagementProps) => {
  const { user } = useAuth();
  const { addEmployee, deactivateEmployee, fetchEmployees } = useEmployee();
  const { state } = useEmployeeStore();
  
  // Force refresh of employee data
  const { refetchModules } = useEmployeeData();
  
  useEffect(() => {
    // Ensure employee data is loaded
    refetchModules();
  }, []);
  
  // Get employee data directly from Redux
  const employeeData = getEmployeeData(state);
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
  const [isLoading, setIsLoading] = useState(false);
  const [employeeUsers, setEmployeeUsers] = useState<EmployeeUser[]>([]);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Get clientId from employee data or user context
  const clientId = state.employeeData?.clientId || user?.clientId;

  // Log the clientId for debugging
  useEffect(() => {
    console.log("UserManagement - Current employee data:", employeeData);
    console.log("UserManagement - Current user data:", user);
    console.log("UserManagement - ClientId being used:", clientId);
  }, [employeeData, user, clientId]);
  
  // Default form data for the user forms - Using only moduleAccessPayload
  const [formData, setFormData] = useState<{
    firstName: string;
    lastName: string;
    email: string;
    employeeId?: string;
    employeeType?: EmployeeType;
    department?: DepartmentType;
    joiningDate?: string;
    clientId?: string;
    moduleAccessPayload?: ModuleAccessItem[];
  }>({
    firstName: '',
    lastName: '',
    email: '',
    clientId: clientId,
    moduleAccessPayload: []
  });

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

        return matchesSearch && matchesStatus;
      });
    } catch (error) {
      console.error('Error filtering users:', error);
      return employeeUsers; // Return all users if filtering fails
    }
  }, [employeeUsers, searchQuery, statusFilter]);

  const fetchEmployeesList = async () => {
    // Add clientId restriction check
    if (!clientId) {
      console.warn("Cannot fetch employees: No clientId available");
      toast.error("Unable to load employees: No client context available");
      return;
    }

    try {
      setIsLoading(true);
      // Pass clientId to filter employees by client
      const employeeData = await getAllEmployeesFromApi(clientId);
      console.log(employeeData, "employeeData124")
      
      if (employeeData && employeeData.length > 0) {
        // Process each employee to get their module access items
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
            // Store module access items directly
            moduleAccessPayload: moduleAccessItems,
            // Add default role property to satisfy User interface
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
    } finally {
      setIsLoading(false);
    }
  };

  // Handler for adding a new user - Uses only moduleAccessPayload
  const handleAddUser = async () => {
    try {
      setIsLoading(true);
      
      // Make sure clientId is set
      if (!formData.clientId && clientId) {
        setFormData(prev => ({
          ...prev,
          clientId: clientId
        }));
      }
      
      console.log("Adding new user with data:", formData);
      console.log("Module access payload:", formData.moduleAccessPayload);
      
      if (!formData.moduleAccessPayload || formData.moduleAccessPayload.length === 0) {
        console.warn("No module access items selected.");
      }
      
      // In a real app, we'd validate the form data here
      const updatedUsers = await addNewUser(
        [] as any,
        { 
          ...formData, 
          clientId: formData.clientId || clientId,
          password: 'defaultPassword123',
          isActive: true,
          // Add required modulePermissions property to satisfy interface
          modulePermissions: {} as any,
          // Default role
          role: 'user' as const
        }
      );
      
      if (updatedUsers) {
        // Also add the user as an employee using the Supabase edge function
        if (formData.employeeId && formData.employeeType && formData.department && formData.joiningDate) {
          try {
            // Prepare employee data for the edge function
            const employeeData = {
              employeeId: formData.employeeId,
              firstName: formData.firstName,
              lastName: formData.lastName,
              email: formData.email,
              employeeType: formData.employeeType as any,
              department: formData.department as any,
              joiningDate: formData.joiningDate,
              status: 'active' as EmploymentStatus,
              clientId: formData.clientId || clientId,
              moduleAccessPayload: formData.moduleAccessPayload || []
            };
            
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
          } catch (empError) {
            console.error("Error adding employee record:", empError);
            toast.error("User added but employee record creation failed");
          }
        }
        
        // toast.success("User added successfully");
        resetForm();
        setIsAddDialogOpen(false);
      }
    } catch (error) {
      console.error("Error adding user:", error);
      toast.error("Failed to add user");
    } finally {
      setIsLoading(false);
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
    try {
      setIsLoading(true);
      const updatedUsers = deleteExistingUser([] as any, userId);
      if (updatedUsers) {
        try {
          const { data, error } = await supabase.functions.invoke('employee-management', {
            body: JSON.stringify({
              operation: 'delete',
              id: userId
            })
          });
          
          if (error) throw error;
          console.log("Employee deleted via edge function:", data);
          
          refreshEmployeesList();
        } catch (edgeFuncError) {
          console.error("Edge function delete error:", edgeFuncError);
        }
        
        toast.success("User deleted successfully");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete user");
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
      await processEmployeeExcel(file, clientId);
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
      clientId: clientId,
      moduleAccessPayload: []
    });
    setCurrentUser(null);
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
  };

  // Get active filters count
  const activeFiltersCount = [
    searchQuery ? 1 : 0,
    statusFilter !== 'all' ? 1 : 0,
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
        <div className="flex justify-between items-center mx-6">
          <h1 className="text-2xl font-bold">User Management</h1>
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



              {/* Clear Filters Button */}
              {activeFiltersCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllFilters}
                  className="text-gray-600 h-10"
                >
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
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div>
              {filteredUsers && filteredUsers.length > 0 ? (
                <UserList 
                  users={filteredUsers}
                  onEditClick={(user) => {
                    setCurrentUser(user);
                    setFormData({
                      firstName: user.firstName,
                      lastName: user.lastName,
                      email: user.email,
                      employeeId: user.employeeId,
                      employeeType: user.employeeType,
                      department: user.department,
                      joiningDate: user.joiningDate,
                      clientId: user.clientId || clientId,
                      moduleAccessPayload: user.moduleAccessPayload || []
                    });
                    setIsEditDialogOpen(true);
                  }}
                  onDeleteUser={async (id) => {
                    try {
                      await deleteExistingUser([] as any, id);
                      await refreshEmployeesList();
                      toast.success("User deleted successfully");
                    } catch (error) {
                      console.error("Error deleting user:", error);
                      toast.error("Failed to delete user");
                    }
                  }}
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
          onSubmit={handleAddUser}
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
