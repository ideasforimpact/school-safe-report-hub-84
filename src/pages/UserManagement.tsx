
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
import { User, UserRole, EmployeeType, DepartmentType } from '@/contexts/auth/types';
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
  const { isAdmin, users = [], user, employeeData } = useAuth();
  const { addEmployee, deactivateEmployee, fetchEmployees } = useEmployee();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [employeeUsers, setEmployeeUsers] = useState<User[]>([]);
  
  // Get clientId from employee data or user context
  const clientId = employeeData?.clientId || user?.clientId;
  
  // Log the clientId for debugging
  useEffect(() => {
    console.log("UserManagement - Current employee data:", employeeData);
    console.log("UserManagement - Current user data:", user);
    console.log("UserManagement - ClientId being used:", clientId);
  }, [employeeData, user, clientId]);
  
  // Check if user is super admin
  const isSuperAdmin = true;

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
    clientId?: string; // Add clientId to form data
  }>({
    firstName: '',
    lastName: '',
    email: '',
    role: 'reporter',
    clientId: clientId, // Initialize with current clientId
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
    fetchEmployeesList();
  }, []);

  const fetchEmployeesList = async () => {
    try {
      setIsLoading(true);
      const employeeData = await getAllEmployeesFromApi();
      
      if (employeeData && employeeData.length > 0) {
        // Process each employee
        const processedUsers = await Promise.all(employeeData.map(async employee => {
          return {
            id: employee.id,
            firstName: employee.firstName,
            lastName: employee.lastName,
            email: employee.email,
            employeeId: employee.employeeId,
            employeeType: employee.employeeType as any, // Type conversion handled by helper function
            department: employee.department as any, // Type conversion handled by helper function
            joiningDate: employee.joiningDate,
            role: 'reporter' as UserRole,
            isActive: employee.status === true, // Compare with boolean true instead of string
            createdAt: employee.createdAt || new Date().toISOString(),
            clientId: employee.clientId, // Make sure to include clientId
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
      
      // Make sure clientId is set
      if (!formData.clientId && clientId) {
        // Update the form data with the current clientId if not set
        setFormData(prev => ({
          ...prev,
          clientId: clientId
        }));
      }
      
      console.log("Adding new user with data:", formData);
      console.log("Client ID being used:", formData.clientId || clientId);
      
      // In a real app, we'd validate the form data here
      const updatedUsers = await addNewUser(
        users as any, // Type casting to fix TypeScript error
        { 
          ...formData, 
          clientId: formData.clientId || clientId, // Use form clientId or fall back to context clientId
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
              clientId: formData.clientId || clientId, // Use form clientId or fall back to context clientId
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
                ...employeeData
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
          return {
            id: employee.id,
            firstName: employee.firstName,
            lastName: employee.lastName,
            email: employee.email,
            employeeId: employee.employeeId,
            employeeType: employee.employeeType as any, // Type conversion handled by helper function
            department: employee.department as any, // Type conversion handled by helper function
            joiningDate: employee.joiningDate,
            role: 'reporter' as UserRole,
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
          console.error("Error deactivating user:", error);
          toast.error("Failed to deactivate user");
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
      // First update the user in the auth context
      const updatedUsers = await updateExistingUser(
        users as any, // Type casting to fix TypeScript error
        userId,
        { isActive: true }
      );
      
      if (updatedUsers) {
        try {
          // Call the edge function to reactivate the employee
          const { data, error } = await supabase.functions.invoke('employee-management', {
            body: JSON.stringify({
              operation: 'reactivate',
              id: userId
            })
          });
          
          if (error) {
            console.error("Edge function reactivate error:", error);
            toast.error("Failed to reactivate employee record");
          } else {
            console.log("Employee reactivated via edge function:", data);
          }
          
          // After successful reactivation, refresh the employee list
          await refreshEmployeesList();
          toast.success("User reactivated successfully");
        } catch (error) {
          console.error("Error reactivating user:", error);
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

  // Function to reset the form data to defaults
  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      role: 'reporter',
      clientId: clientId, // Keep clientId when resetting
    });
    setCurrentUser(null);
  };

  // Function to open the edit dialog for a user
  const openEditDialog = (user: User) => {
    setCurrentUser(user);
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      employeeId: user.employeeId,
      employeeType: user.employeeType,
      department: user.department,
      joiningDate: user.joiningDate,
      role: user.role,
      clientId: user.clientId || clientId, // Use user's clientId or fall back to context clientId
    });
    setIsEditDialogOpen(true);
  };

  // Handler for importing employees from Excel
  const handleImportEmployees = async (file: File) => {
    try {
      setIsLoading(true);
      const importedEmployees = await processEmployeeExcel(file, clientId as string);
      if (importedEmployees && importedEmployees.length > 0) {
        toast.success(`Successfully imported ${importedEmployees.length} employees`);
        await refreshEmployeesList();
        setIsImportDialogOpen(false);
      } else {
        toast.error("No employees were imported");
      }
    } catch (error) {
      console.error("Error importing employees:", error);
      toast.error("Failed to import employees");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="px-4 md:px-6">
        <Card className="w-full">
          <CardHeader className="pb-4">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage your organization's users</CardDescription>
              </div>
              <div className="flex space-x-2">
                <Button 
                  size="sm" 
                  onClick={() => setIsAddDialogOpen(true)}
                  disabled={!clientId || isLoading}
                  className="flex items-center"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Employee
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsImportDialogOpen(true)}
                  disabled={!clientId || isLoading}
                  className="flex items-center"
                >
                  <FileUp className="h-4 w-4 mr-2" />
                  Import Employees
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={refreshEmployeesList}
                  disabled={isLoading}
                  className="flex items-center"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <UserList
              users={employeeUsers}
              onEdit={openEditDialog}
              onDelete={handleDeleteUser}
              onDeactivate={handleDeactivateUser}
              onReactivate={handleReactivateUser}
              isLoading={isLoading}
            />
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
        clientId={clientId}
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
        clientId={clientId}
      />
      
      {/* Import Employee Dialog */}
      <ImportEmployeeDialog
        isOpen={isImportDialogOpen}
        setIsOpen={setIsImportDialogOpen}
        onImport={handleImportEmployees}
        isLoading={isLoading}
      />
    </Layout>
  );
};

export default UserManagement;
