
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
import { UserPlus, FileUp } from 'lucide-react';
import { User, UserRole, ModulePermissions, EmployeeType, DepartmentType } from '@/contexts/auth/types';
import { EmploymentStatus } from '@/contexts/employee/types';
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

const UserManagement = () => {
  const { isAdmin, users = [] } = useAuth();
  const { addEmployee } = useEmployee(); // Connect to employee context
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [employeeUsers, setEmployeeUsers] = useState<User[]>([]);
  
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
    const fetchEmployees = async () => {
      try {
        setIsLoading(true);
        const employeeData = await getAllEmployeesFromApi();
        
        if (employeeData && employeeData.length > 0) {
          // Map employee data to User format for display in UserList
          const mappedUsers = employeeData.map(employee => ({
            id: employee.id,
            firstName: employee.firstName,
            lastName: employee.lastName,
            email: employee.email,
            employeeId: employee.employeeId,
            employeeType: employee.employeeType,
            department: employee.department,
            joiningDate: employee.joiningDate,
            role: employee.applicationFields?.modulePermissions?.superAdmin ? 'admin' : 'reporter' as UserRole,
            modulePermissions: employee.applicationFields?.modulePermissions || {
              superAdmin: false,
              incidentReporting: true,
              incidentAdmin: false,
              assessmentUser: false,
              assessmentsAdmin: false,
              employeeVerificationAdmin: false,
              grievancesAdmin: false,
              transportSafetyAdmin: false,
              eduSafeResourceAccess: false
            },
            isActive: employee.status === 'active',
            createdAt: employee.createdAt || new Date().toISOString(), // Add the missing createdAt field
          }));

          setEmployeeUsers(mappedUsers);
          console.log("Fetched employees:", mappedUsers);
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

    fetchEmployees();
  }, []);

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
              applicationFields: {
                modulePermissions: formData.modulePermissions
              }
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
              await addEmployee(employeeData);
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
        const mappedUsers = employeeData.map(employee => ({
          id: employee.id,
          firstName: employee.firstName,
          lastName: employee.lastName,
          email: employee.email,
          employeeId: employee.employeeId,
          employeeType: employee.employeeType,
          department: employee.department,
          joiningDate: employee.joiningDate,
          role: employee.applicationFields?.modulePermissions?.superAdmin ? 'admin' : 'reporter' as UserRole,
          modulePermissions: employee.applicationFields?.modulePermissions || {
            superAdmin: false,
            incidentReporting: true,
            incidentAdmin: false,
            assessmentUser: false,
            assessmentsAdmin: false,
            employeeVerificationAdmin: false,
            grievancesAdmin: false,
            transportSafetyAdmin: false,
            eduSafeResourceAccess: false
          },
          isActive: employee.status === 'active',
          createdAt: employee.createdAt || new Date().toISOString(), // Add the missing createdAt field
        }));

        setEmployeeUsers(mappedUsers);
        console.log("Refreshed employees list:", mappedUsers);
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
              applicationFields: {
                modulePermissions: formData.modulePermissions
              }
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
        window.location.reload(); // Refresh to see the updated user
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
        // Also update the employee status if it exists
        try {
          // Try to update via edge function
          const { data, error } = await supabase.functions.invoke('employee-management', {
            body: JSON.stringify({
              operation: 'update',
              employee: {
                id: userId,
                status: 'inactive' as EmploymentStatus // Explicitly cast to EmploymentStatus
              }
            })
          });
          
          if (error) throw error;
          console.log("Employee deactivated via edge function:", data);
          
          // After successful deactivation, refresh the employee list
          refreshEmployeesList();
        } catch (edgeFuncError) {
          console.error("Edge function deactivate error:", edgeFuncError);
          // No direct fallback for deactivation
        }
        
        toast.success("User deactivated successfully");
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
  const handleEditClick = (user: User) => {
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
      modulePermissions: user.modulePermissions || {
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
    setIsEditDialogOpen(true);
  };

  // Handle import employees
  const handleImportEmployees = async (file: File) => {
    try {
      setIsLoading(true);
      await processEmployeeExcel(file);
      toast.success("Employees imported successfully");
      // Refresh employees list after import
      await refreshEmployeesList();
    } catch (error) {
      console.error("Import process failed:", error);
      toast.error("Failed to process employee import");
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
          <CardHeader>
            <CardTitle>Users</CardTitle>
            <CardDescription>
              Manage system users and their permissions
            </CardDescription>
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
      />
    </Layout>
  );
};

export default UserManagement;
