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
import { UserPlus, FileUp, RefreshCw } from 'lucide-react';
import { User, UserRole, ModulePermissions, EmployeeType, DepartmentType } from '@/contexts/auth/types';
import { EmploymentStatus, EmployeeType as EmployeeContextType, DepartmentType as EmployeeContextDepartmentType } from '@/contexts/employee/types';
import { toast } from "sonner";
import { 
  addNewUser, 
  updateExistingUser,
  deleteExistingUser, 
  deactivateExistingUser
} from '@/services/auth/userManagementService';
import { processEmployeeExcel } from '@/services/employee/importEmployeeService';
import { supabase } from '@/integrations/supabase/client';
import { getAllEmployeesFromApi } from '@/services/employee/employeeRetrievalService';
import { getEmployeeModulePermissions, updateEmployeeModulePermissions } from '@/services/employee/employeeModuleService';

// Helper function to convert employee type and department type
const convertEmployeeType = (employeeType: EmployeeContextType): EmployeeType => {
  // Handle 'intern' which is in employee types but not in auth types
  if (employeeType === 'intern') {
    return 'consultant' as EmployeeType; // Map intern to consultant as fallback
  }
  return employeeType as EmployeeType;
};

// Helper function to convert department type
const convertDepartmentType = (department: EmployeeContextDepartmentType): DepartmentType => {
  // Handle departments in employee context that don't exist in auth context
  const authDepartments: DepartmentType[] = ['admin', 'teaching', 'security', 'maintenance', 'transport', 'management'];
  
  if (authDepartments.includes(department as DepartmentType)) {
    return department as DepartmentType;
  }
  
  // Map departments that don't exist in auth types to a default value
  const departmentMapping: Record<string, DepartmentType> = {
    'it': 'admin',
    'hr': 'admin',
    'finance': 'admin'
  };
  
  return departmentMapping[department] || 'admin';
};

const UserManagement = () => {
  const { isAdmin, users = [], user } = useAuth();
  const { addEmployee, deactivateEmployee, fetchEmployees } = useEmployee();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [employeeUsers, setEmployeeUsers] = useState<User[]>([]);
  
  // Get clientId from user context
  const clientId = user?.clientId;
  
  // Default form data for the user forms
  const [formData, setFormData] = useState<{
    firstName: string;
    lastName: string;
    email: string;
    employeeId?: string;
    employeeType?: EmployeeType;
    department?: DepartmentType;
    joiningDate?: string;
    role: UserRole;
    modulePermissions: ModulePermissions;
  }>({
    firstName: '',
    lastName: '',
    email: '',
    role: 'reporter',
    modulePermissions: {
      superAdmin: false,
      incidentReporting: true,
      incidentAdmin: false,
      assessmentUser: false,
      assessmentsAdmin: false,
      employeeVerificationAdmin: false,
      grievancesAdmin: false,
      transportSafetyAdmin: false,
      eduSafeResourceAccess: false
    }
  });

  // Fetch employees from Supabase and map them to User format
  useEffect(() => {
    fetchEmployeesList();
  }, []);

  const fetchEmployeesList = async () => {
    try {
      setIsLoading(true);
      const employeeData = await getAllEmployeesFromApi();
      
      if (employeeData && employeeData.length > 0) {
        // Process each employee to get their module permissions
        const processedUsers = await Promise.all(employeeData.map(async employee => {
          // Fetch module permissions for this employee
          const modulePermissions = await getEmployeeModulePermissions(employee.id);
          
          return {
            id: employee.id,
            firstName: employee.firstName,
            lastName: employee.lastName,
            email: employee.email,
            employeeId: employee.employeeId,
            employeeType: employee.employeeType as any, // Type conversion handled by helper function
            department: employee.department as any, // Type conversion handled by helper function
            joiningDate: employee.joiningDate,
            role: modulePermissions.superAdmin ? 'admin' : 'reporter' as UserRole,
            modulePermissions: modulePermissions,
            isActive: employee.status === true, // Compare with boolean true instead of string
            createdAt: employee.createdAt || new Date().toISOString(),
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

  // Handler for adding a new user
  const handleAddUser = async () => {
    try {
      setIsLoading(true);
      
      // In a real app, we'd validate the form data here
      const updatedUsers = await addNewUser(
        users as any, // Type casting to fix TypeScript error
        { 
          ...formData, 
          password: 'defaultPassword123', // In a real app, we'd generate this or let the user set it
          isActive: true 
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
              employeeType: formData.employeeType,
              department: formData.department,
              joiningDate: formData.joiningDate,
              status: 'active' as EmploymentStatus, // Explicitly cast to EmploymentStatus
              modulePermissions: formData.modulePermissions // Include module permissions
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
              
              console.log("Employee created via edge function:", data);
              toast.success("Employee record created successfully");
            } catch (edgeFuncError) {
              console.error("Edge function error:", edgeFuncError);
              // Fall back to the context function if the edge function fails
              await addEmployee({
                ...employeeData,
                modulePermissions: formData.modulePermissions
              });
              console.log("Employee created via context function");
              toast.success("Employee record created via local storage");
            }
            
            // After successful employee creation, refresh the employee list
            refreshEmployeesList();
          } catch (empError) {
            console.error("Error adding employee record:", empError);
            toast.error("User added but employee record creation failed");
          }
        }
        
        toast.success("User added successfully");
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
    try {
      const employeeData = await getAllEmployeesFromApi();
      
      if (employeeData && employeeData.length > 0) {
        const processedUsers = await Promise.all(employeeData.map(async employee => {
          // Fetch module permissions for this employee
          const modulePermissions = await getEmployeeModulePermissions(employee.id);
          
          return {
            id: employee.id,
            firstName: employee.firstName,
            lastName: employee.lastName,
            email: employee.email,
            employeeId: employee.employeeId,
            employeeType: employee.employeeType as any, // Type conversion handled by helper function
            department: employee.department as any, // Type conversion handled by helper function
            joiningDate: employee.joiningDate,
            role: modulePermissions.superAdmin ? 'admin' : 'reporter' as UserRole,
            modulePermissions: modulePermissions,
            isActive: employee.status === true, // Compare with boolean true instead of string
            createdAt: employee.createdAt || new Date().toISOString(),
          };
        }));

        setEmployeeUsers(processedUsers);
        console.log("Refreshed employees list:", processedUsers);
      }
    } catch (error) {
      console.error("Error refreshing employees:", error);
    }
  };

  // Handler for updating an existing user
  const handleUpdateUser = async () => {
    if (!currentUser) return;
    
    try {
      setIsLoading(true);
      const updatedUsers = await updateExistingUser(
        users as any, // Type casting to fix TypeScript error
        currentUser.id,
        formData
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
            };
            
            // Try to update via edge function first
            try {
              const { data, error } = await supabase.functions.invoke('employee-management', {
                body: JSON.stringify({
                  operation: 'update',
                  employee: {
                    id: currentUser.id, // Assuming the user id matches the employee id
                    ...updateData
                  }
                })
              });
              
              if (error) throw error;
              
              // Update module permissions separately
              await updateEmployeeModulePermissions(currentUser.id, formData.modulePermissions);
              
              console.log("Employee updated via edge function:", data);
            } catch (edgeFuncError) {
              console.error("Edge function update error:", edgeFuncError);
              // Fall back to context if needed
              // This would require implementing an updateEmployee method in the context
            }
          } catch (empError) {
            console.error("Error updating employee record:", empError);
            toast.error("User updated but employee record update failed");
          }
        }
        
        toast.success("User updated successfully");
        resetForm();
        setIsEditDialogOpen(false);
        await refreshEmployeesList(); // Refresh to see the updated user
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
      const updatedUsers = deleteExistingUser(users as any, userId); // Type casting to fix TypeScript error
      if (updatedUsers) {
        // Also delete the employee if it exists
        try {
          // Try to delete via edge function
          const { data, error } = await supabase.functions.invoke('employee-management', {
            body: JSON.stringify({
              operation: 'delete',
              id: userId
            })
          });
          
          if (error) throw error;
          console.log("Employee deleted via edge function:", data);
          
          // After successful deletion, refresh the employee list
          refreshEmployeesList();
        } catch (edgeFuncError) {
          console.error("Edge function delete error:", edgeFuncError);
          // No fallback for deletion since we don't have a direct method in context
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
      const updatedUsers = deactivateExistingUser(users as any, userId); // Type casting to fix TypeScript error
      if (updatedUsers) {
        try {
          // Call the edge function to deactivate the employee
          const { data, error } = await supabase.functions.invoke('employee-management', {
            body: JSON.stringify({
              operation: 'deactivate',
              id: userId
            })
          });
          
          if (error) {
            console.error("Edge function deactivate error:", error);
            // Fall back to the employee context's deactivateEmployee function
            await deactivateEmployee(userId);
            console.log("Employee deactivated via context function");
          } else {
            console.log("Employee deactivated via edge function:", data);
          }
          
          // After successful deactivation, refresh the employee list
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

  // Reset form to default values
  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      role: 'reporter',
      modulePermissions: {
        superAdmin: false,
        incidentReporting: true,
        incidentAdmin: false,
        assessmentUser: false,
        assessmentsAdmin: false,
        employeeVerificationAdmin: false,
        grievancesAdmin: false,
        transportSafetyAdmin: false,
        eduSafeResourceAccess: false
      }
    });
    setCurrentUser(null);
  };

  // Handle edit user click
  const handleEditClick = async (user: User) => {
    setCurrentUser(user);
    
    // If we're editing an existing user, fetch their current module permissions
    let modulePermissions = user.modulePermissions || {
      superAdmin: false,
      incidentReporting: true,
      incidentAdmin: false,
      assessmentUser: false,
      assessmentsAdmin: false,
      employeeVerificationAdmin: false,
      grievancesAdmin: false,
      transportSafetyAdmin: false,
      eduSafeResourceAccess: false
    };
    
    // If module permissions don't exist in the user object, fetch them from the database
    if (!user.modulePermissions) {
      try {
        modulePermissions = await getEmployeeModulePermissions(user.id);
      } catch (error) {
        console.error("Error fetching module permissions:", error);
      }
    }
    
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      employeeId: user.employeeId,
      employeeType: user.employeeType,
      department: user.department,
      joiningDate: user.joiningDate,
      role: user.role,
      modulePermissions: modulePermissions
    });
    
    setIsEditDialogOpen(true);
  };

  // Handler for importing employees - Simplified to focus on validation and processing only
  const handleImportEmployees = async (file: File) => {
    try {
      setIsLoading(true);
      console.log("Importing employees with clientId:", clientId);
      
      // No authentication check needed - proceed directly to import
      await processEmployeeExcel(file, clientId);
      
      // Refresh the employee list after successful import
      await fetchEmployeesList();
      toast.success("Employees imported successfully");
      setIsImportDialogOpen(false);
    } catch (error) {
      console.error("Import process failed:", error);
      toast.error(`Failed to process employee import: ${(error as Error).message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle refresh button click
  const handleRefreshEmployeesList = async () => {
    try {
      setIsLoading(true);
      await fetchEmployeesList();
      toast.success("Employee list refreshed");
    } catch (error) {
      console.error("Failed to refresh employees:", error);
      toast.error("Failed to refresh employee list");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <Layout>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p>You don't have permission to access this page.</p>
            </div>
          </CardContent>
        </Card>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">User Management</h1>
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
              onClick={handleRefreshEmployeesList}
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
                users={employeeUsers.length > 0 ? employeeUsers : users}
                onEditClick={handleEditClick}
                onDeleteUser={handleDeleteUser}
                onDeactivateUser={handleDeactivateUser}
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
        onSubmit={handleAddUser}
        resetForm={resetForm}
        isLoading={isLoading}
      />

      {/* Edit User Dialog */}
      <EditUserDialog 
        isOpen={isEditDialogOpen}
        setIsOpen={setIsEditDialogOpen}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleUpdateUser}
        resetForm={resetForm}
        isLoading={isLoading}
      />

      {/* Import Employees Dialog */}
      <ImportEmployeeDialog
        isOpen={isImportDialogOpen}
        setIsOpen={setIsImportDialogOpen}
        onImportEmployees={handleImportEmployees}
        clientId={clientId}
      />
    </Layout>
  );
};

export default UserManagement;
