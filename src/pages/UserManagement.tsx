import { useState, useEffect } from 'react';
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
import { UserPlus, FileUp, RefreshCw, AlertCircle } from 'lucide-react';
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
import { getEmployeeModuleAccessItems, updateEmployeeModulePermissions } from '@/services/employee/employeeModuleService';
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

// Define a custom type for employees that we display in the UI - extending User properly
interface EmployeeUser extends User {
  moduleAccessPayload?: ModuleAccessItem[];
  employeeId?: string;
  employeeType?: EmployeeType; 
  department?: DepartmentType;
  joiningDate?: string;
}

// Main UserManagement component
const UserManagement = () => {
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
  
  console.log("UserManagement - Redux employeeData:", employeeData);
  console.log("UserManagement - Redux isAdmin:", isAdmin);
  console.log("UserManagement - Redux isSuperAdmin:", isSuperAdmin);
  console.log("UserManagement - User from auth context:", user);
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<EmployeeUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [employeeUsers, setEmployeeUsers] = useState<EmployeeUser[]>([]);
  
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
          // Get module access items directly
          const moduleAccessItems = await getEmployeeModuleAccessItems(employee.id);
          
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
            // Add required properties from User interface
            role: 'user' as const,
            modulePermissions: {} as any
          } as EmployeeUser;
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
            
            await fetchEmployeesList();
          } catch (empError) {
            console.error("Error adding employee record:", empError);
            toast.error("User added but employee record creation failed");
          }
        }
        
        // toast.success("User added successfully");
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          clientId: clientId,
          moduleAccessPayload: []
        });
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
          // Get module access items directly
          const moduleAccessItems = await getEmployeeModuleAccessItems(employee.id);
          
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

  // Handler for updating an existing user - Uses only moduleAccessPayload
  const handleUpdateUser = async () => {
    if (!currentUser) return;
    
    try {
      setIsLoading(true);
      
      console.log("Updating user with data:", formData);
      console.log("Module access payload:", formData.moduleAccessPayload);
      
      // Need to provide modulePermissions for API compatibility
      const updatedUsers = await updateExistingUser(
        [] as any,
        currentUser.id,
        {
          ...formData,
          // Add required modulePermissions property to satisfy interface
          modulePermissions: {} as any,
          // Keep existing role
          role: currentUser.role || 'user' as const
        }
      );
      
      if (updatedUsers) {
        // Also update the employee record if it exists
        if (formData.employeeId) {
          try {
            // Prepare update data
            const updateData = {
              firstName: formData.firstName,
              lastName: formData.lastName,
              email: formData.email,
              employeeType: formData.employeeType,
              department: formData.department,
              moduleAccessPayload: formData.moduleAccessPayload || []
            };
            
            // Try to update via edge function first
            try {
              const { data, error } = await supabase.functions.invoke('employee-management', {
                body: JSON.stringify({
                  operation: 'update',
                  employee: {
                    id: currentUser.id,
                    ...updateData
                  }
                })
              });
              
              if (error) throw error;
              
              // Check if the response contains an error
              if (data && data.error) {
                console.error("Error from edge function:", data.error);
                toast.error(data.error);
                return;
              }
              
              // If moduleAccessPayload exists, update it directly
              if (formData.moduleAccessPayload && formData.moduleAccessPayload.length > 0) {
                await updateEmployeeModulePermissions(currentUser.id, formData.moduleAccessPayload);
              }
              
              console.log("Employee updated via edge function:", data);
              
              // Only show success message if no error
              if (!data.error) {
                toast.success("User updated successfully");
              }
            } catch (edgeFuncError) {
              console.error("Edge function update error:", edgeFuncError);
              // Fall back to context if needed
              toast.error("Error updating employee via edge function");
            }
          } catch (empError) {
            console.error("Error updating employee record:", empError);
            toast.error("User updated but employee record update failed");
          }
        }
        
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          clientId: clientId,
          moduleAccessPayload: []
        });
        setIsEditDialogOpen(false);
        await refreshEmployeesList();
      }
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Failed to update user");
    } finally {
      setIsLoading(false);
    }
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
          toast.success("User deactivated successfully");
        } catch (error) {
          console.error("Error deactivating employee:", error);
          toast.error("User deactivated but employee record update failed");
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
          toast.success("User reactivated successfully");
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
      await fetchEmployeesList();
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

  // If no clientId is available, show a warning message
  if (!clientId) {
    return (
      <Layout>
        <div className="container mx-auto py-6 max-w-7xl">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-16 w-16 text-amber-500 mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">No Client Context Available</h2>
              <p className="text-gray-600 text-center max-w-md">
                Unable to load user management. Please ensure you have a valid client context or contact your administrator.
              </p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">User Management</h1>
          {isSuperAdmin && (
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Users</CardTitle>
              <CardDescription>
                Manage system users and their permissions
              </CardDescription>
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
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : (
              <UserList 
                users={employeeUsers.length > 0 ? employeeUsers : []}
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
                    await fetchEmployeesList();
                    toast.success("User deleted successfully");
                  } catch (error) {
                    console.error("Error deleting user:", error);
                    toast.error("Failed to delete user");
                  }
                }}
                onDeactivateUser={async (id) => {
                  try {
                    await deactivateExistingUser([] as any, id);
                    await fetchEmployeesList();
                    toast.success("User deactivated successfully");
                  } catch (error) {
                    console.error("Error deactivating user:", error);
                    toast.error("Failed to deactivate user");
                  }
                }}
                onReactivateUser={async (id) => {
                  try {
                    await reactivateExistingUser([] as any, id);
                    await fetchEmployeesList();
                    toast.success("User reactivated successfully");
                  } catch (error) {
                    console.error("Error reactivating user:", error);
                    toast.error("Failed to reactivate user");
                  }
                }}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add User Dialog */}
      <AddUserDialog 
        isOpen={isAddDialogOpen}
        setIsOpen={setIsAddDialogOpen}
        formData={formData}
        setFormData={setFormData}
        onSubmit={async () => {
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
                  
                  await fetchEmployeesList();
                } catch (empError) {
                  console.error("Error adding employee record:", empError);
                  toast.error("User added but employee record creation failed");
                }
              }
              
              // toast.success("User added successfully");
              setFormData({
                firstName: '',
                lastName: '',
                email: '',
                clientId: clientId,
                moduleAccessPayload: []
              });
              setIsAddDialogOpen(false);
            }
          } catch (error) {
            console.error("Error adding user:", error);
            toast.error("Failed to add user");
          } finally {
            setIsLoading(false);
          }
        }}
        resetForm={() => {
          setFormData({
            firstName: '',
            lastName: '',
            email: '',
            clientId: clientId,
            moduleAccessPayload: []
          });
          setCurrentUser(null);
        }}
        isLoading={isLoading}
        clientId={clientId}
      />

      {/* Edit User Dialog */}
      <EditUserDialog 
        isOpen={isEditDialogOpen}
        setIsOpen={setIsEditDialogOpen}
        formData={formData}
        setFormData={setFormData}
        onSubmit={async () => {
          if (!currentUser) return;
          
          try {
            setIsLoading(true);
            
            console.log("Updating user with data:", formData);
            console.log("Module access payload:", formData.moduleAccessPayload);
            
            // Need to provide modulePermissions for API compatibility
            const updatedUsers = await updateExistingUser(
              [] as any,
              currentUser.id,
              {
                ...formData,
                // Add required modulePermissions property to satisfy interface
                modulePermissions: {} as any,
                // Keep existing role
                role: currentUser.role || 'user' as const
              }
            );
            
            if (updatedUsers) {
              // Also update the employee record if it exists
              if (formData.employeeId) {
                try {
                  // Prepare update data
                  const updateData = {
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    email: formData.email,
                    employeeType: formData.employeeType,
                    department: formData.department,
                    moduleAccessPayload: formData.moduleAccessPayload || []
                  };
                  
                  // Try to update via edge function first
                  try {
                    const { data, error } = await supabase.functions.invoke('employee-management', {
                      body: JSON.stringify({
                        operation: 'update',
                        employee: {
                          id: currentUser.id,
                          ...updateData
                        }
                      })
                    });
                    
                    if (error) throw error;
                    
                    // Check if the response contains an error
                    if (data && data.error) {
                      console.error("Error from edge function:", data.error);
                      toast.error(data.error);
                      return;
                    }
                    
                    // If moduleAccessPayload exists, update it directly
                    if (formData.moduleAccessPayload && formData.moduleAccessPayload.length > 0) {
                      await updateEmployeeModulePermissions(currentUser.id, formData.moduleAccessPayload);
                    }
                    
                    console.log("Employee updated via edge function:", data);
                    
                    // Only show success message if no error
                    if (!data.error) {
                      toast.success("User updated successfully");
                    }
                  } catch (edgeFuncError) {
                    console.error("Edge function update error:", edgeFuncError);
                    // Fall back to context if needed
                    toast.error("Error updating employee via edge function");
                  }
                } catch (empError) {
                  console.error("Error updating employee record:", empError);
                  toast.error("User updated but employee record update failed");
                }
              }
              
              setFormData({
                firstName: '',
                lastName: '',
                email: '',
                clientId: clientId,
                moduleAccessPayload: []
              });
              setIsEditDialogOpen(false);
              await fetchEmployeesList();
            }
          } catch (error) {
            console.error("Error updating user:", error);
            toast.error("Failed to update user");
          } finally {
            setIsLoading(false);
          }
        }}
        resetForm={() => {
          setFormData({
            firstName: '',
            lastName: '',
            email: '',
            clientId: clientId,
            moduleAccessPayload: []
          });
          setCurrentUser(null);
        }}
        isLoading={isLoading}
        clientId={clientId}
      />

      {/* Import Employees Dialog */}
      <ImportEmployeeDialog
        isOpen={isImportDialogOpen}
        setIsOpen={setIsImportDialogOpen}
        onImportEmployees={async (file: File) => {
          if (!clientId) {
            toast.error("No client context available for import");
            return;
          }

          try {
            setIsLoading(true);
            await processEmployeeExcel(file, clientId);
            await fetchEmployeesList();
            toast.success("Employees imported successfully");
          } catch (error) {
            console.error("Error importing employees:", error);
            toast.error("Failed to import employees");
          } finally {
            setIsLoading(false);
          }
        }}
        clientId={clientId}
      />
    </Layout>
  );
};

export default UserManagement;
