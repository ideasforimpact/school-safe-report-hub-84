
import { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
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
import { UserPlus, Users, FileUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { User, UserRole, ModulePermissions, EmployeeType, DepartmentType } from '@/contexts/auth/types';
import { toast } from "sonner";
import { 
  addNewUser, 
  updateExistingUser,
  deleteExistingUser, 
  deactivateExistingUser
} from '@/services/auth/userManagementService';
import { processEmployeeExcel } from '@/services/employee/importEmployeeService';

const UserManagement = () => {
  const { isAdmin, users = [] } = useAuth();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
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

  // Handler for adding a new user
  const handleAddUser = async () => {
    try {
      // In a real app, we'd validate the form data here
      const updatedUsers = await addNewUser(
        users,
        { 
          ...formData, 
          password: 'defaultPassword123', // In a real app, we'd generate this or let the user set it
          isActive: true 
        }
      );
      
      if (updatedUsers) {
        // Since we don't have setUsers in this context, we'll redirect to refresh
        toast.success("User added successfully");
        resetForm();
        setIsAddDialogOpen(false);
        window.location.reload(); // Refresh to see the new user
      }
    } catch (error) {
      console.error("Error adding user:", error);
      toast.error("Failed to add user");
    }
  };

  // Handler for updating an existing user
  const handleUpdateUser = async () => {
    if (!currentUser) return;
    
    try {
      const updatedUsers = await updateExistingUser(
        users,
        currentUser.id,
        formData
      );
      
      if (updatedUsers) {
        toast.success("User updated successfully");
        resetForm();
        setIsEditDialogOpen(false);
        window.location.reload(); // Refresh to see the updated user
      }
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Failed to update user");
    }
  };

  // Handler for deleting a user
  const handleDeleteUser = async (userId: string) => {
    try {
      const updatedUsers = deleteExistingUser(users, userId);
      if (updatedUsers) {
        toast.success("User deleted successfully");
        window.location.reload(); // Refresh to see the changes
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete user");
    }
  };

  // Handler for deactivating a user
  const handleDeactivateUser = async (userId: string) => {
    try {
      const updatedUsers = deactivateExistingUser(users, userId);
      if (updatedUsers) {
        toast.success("User deactivated successfully");
        window.location.reload(); // Refresh to see the changes
      }
    } catch (error) {
      console.error("Error deactivating user:", error);
      toast.error("Failed to deactivate user");
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
      await processEmployeeExcel(file);
      toast.success("Employees imported successfully");
      window.location.reload(); // Refresh to see the imported employees
    } catch (error) {
      console.error("Import process failed:", error);
      toast.error("Failed to process employee import");
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
              asChild
              variant="outline"
            >
              <Link to="/employees" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>Go to Employee Management</span>
              </Link>
            </Button>
            <Button 
              onClick={() => setIsImportDialogOpen(true)}
              className="flex items-center gap-2"
              variant="secondary"
            >
              <FileUp className="h-4 w-4" />
              <span>Import Employees</span>
            </Button>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add User
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
            <UserList 
              users={users}
              onEditClick={handleEditClick}
              onDeleteUser={handleDeleteUser}
              onDeactivateUser={handleDeactivateUser}
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
      />

      {/* Edit User Dialog */}
      <EditUserDialog 
        isOpen={isEditDialogOpen}
        setIsOpen={setIsEditDialogOpen}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleUpdateUser}
        resetForm={resetForm}
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
