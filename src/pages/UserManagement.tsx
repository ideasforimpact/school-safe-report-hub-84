
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
  const { isAdmin, user, users, addUser, updateUser, deleteUser, deactivateUser, reactivateUser, employeeData } = useAuth();
  
  // Set the clientId from the logged-in user if available
  const clientId = user?.clientId || employeeData?.clientId || '';
  console.log("UserManagement component - ClientId:", clientId);
  
  const [isLoading, setIsLoading] = useState(false);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    employeeId: '',
    employeeType: '' as EmployeeType,
    department: '' as DepartmentType,
    joiningDate: '',
    role: 'reporter' as UserRole,
    clientId: clientId,
  });
  const [editFormData, setEditFormData] = useState({
    id: '',
    firstName: '',
    lastName: '',
    email: '',
    employeeId: '',
    employeeType: '' as EmployeeType,
    department: '' as DepartmentType,
    joiningDate: '',
    role: 'reporter' as UserRole,
    clientId: clientId,
  });
  
  // Filter users
  useEffect(() => {
    if (users) {
      const filtered = users.filter(user => {
        const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
        return fullName.includes(searchTerm.toLowerCase()) || 
               user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
               (user.employeeId && user.employeeId.toLowerCase().includes(searchTerm.toLowerCase()));
      });
      setFilteredUsers(filtered);
    }
  }, [users, searchTerm]);
  
  // Reset form data when dialog closes
  const resetFormData = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      employeeId: '',
      employeeType: '' as EmployeeType,
      department: '' as DepartmentType,
      joiningDate: '',
      role: 'reporter' as UserRole,
      clientId: clientId,
    });
  };
  
  const resetEditFormData = () => {
    setEditFormData({
      id: '',
      firstName: '',
      lastName: '',
      email: '',
      employeeId: '',
      employeeType: '' as EmployeeType,
      department: '' as DepartmentType,
      joiningDate: '',
      role: 'reporter' as UserRole,
      clientId: clientId,
    });
  };
  
  // Open edit dialog with user data
  const handleEditClick = (user: User) => {
    setEditFormData({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      employeeId: user.employeeId || '',
      employeeType: user.employeeType || '' as EmployeeType,
      department: user.department || '' as DepartmentType,
      joiningDate: user.joiningDate || '',
      role: user.role,
      clientId: user.clientId || clientId,
    });
    setCurrentUser(user);
    setIsEditDialogOpen(true);
  };
  
  // Handle add user
  const handleAddUser = async () => {
    setIsLoading(true);
    
    // Ensure clientId is set
    if (!formData.clientId) {
      formData.clientId = clientId;
    }
    
    try {
      const password = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(2, 4).toUpperCase() + "!";
      
      console.log("Adding new user with data:", { ...formData, password, clientId });
      
      // Create default modulePermissions object
      const defaultModulePermissions: ModulePermissions = {
        superAdmin: false,
        incidentReporting: true,
        incidentAdmin: false,
        assessmentUser: false,
        assessmentsAdmin: false,
        employeeVerificationAdmin: false,
        grievancesAdmin: false,
        transportSafetyAdmin: true,
        eduSafeResourceAccess: false
      };
      
      const newUsers = await addNewUser(users as any, {
        ...formData,
        password,
        isActive: true,
        modulePermissions: defaultModulePermissions
      });
      
      if (newUsers) {
        addUser({ ...formData, id: newUsers[newUsers.length - 1].id, isActive: true, createdAt: new Date().toISOString() });
        toast.success('User added successfully. Password has been sent to the user\'s email.');
        setIsAddDialogOpen(false);
        resetFormData();
      }
    } catch (error) {
      console.error('Error adding user:', error);
      toast.error('Failed to add user');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle update user
  const handleUpdateUser = async () => {
    setIsLoading(true);
    try {
      // Ensure clientId is set
      if (!editFormData.clientId) {
        editFormData.clientId = clientId;
      }
      
      console.log("Updating user with data:", editFormData);
      
      // Create default modulePermissions object if it doesn't exist
      const defaultModulePermissions: ModulePermissions = {
        superAdmin: false,
        incidentReporting: true,
        incidentAdmin: false,
        assessmentUser: false,
        assessmentsAdmin: false,
        employeeVerificationAdmin: false,
        grievancesAdmin: false,
        transportSafetyAdmin: true,
        eduSafeResourceAccess: false
      };
      
      // Get user's existing modulePermissions or use defaults
      const modulePermissions = currentUser?.modulePermissions || defaultModulePermissions;
      
      const { id, ...updates } = editFormData;
      const updatedUsers = await updateExistingUser(users as any, id, { ...updates, modulePermissions });
      
      if (updatedUsers) {
        updateUser(id, { ...updates });
        toast.success('User updated successfully');
        setIsEditDialogOpen(false);
        resetEditFormData();
      }
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle delete user
  const handleDeleteUser = async (userId: string) => {
    try {
      const updatedUsers = await deleteExistingUser(users as any, userId, user?.id);
      if (updatedUsers) {
        deleteUser(userId);
        toast.success('User deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };
  
  // Handle deactivate user
  const handleDeactivateUser = async (userId: string) => {
    try {
      const updatedUsers = await deactivateExistingUser(users as any, userId, user?.id);
      if (updatedUsers) {
        deactivateUser(userId);
        toast.success('User deactivated successfully');
      }
    } catch (error) {
      console.error('Error deactivating user:', error);
      toast.error('Failed to deactivate user');
    }
  };
  
  // Handle reactivate user
  const handleReactivateUser = async (userId: string) => {
    try {
      // In a real implementation, this would call an API or service
      reactivateUser(userId);
      toast.success('User reactivated successfully');
    } catch (error) {
      console.error('Error reactivating user:', error);
      toast.error('Failed to reactivate user');
    }
  };
  
  // Handle import employees
  const handleEmployeeImport = async (file: File) => {
    setIsLoading(true);
    try {
      // Process the Excel file and import employees
      const results = await processEmployeeExcel(file, clientId);
      
      console.log("Import results:", results);
      
      // Refresh users list after import
      // This would typically fetch the latest users from the server
      // For the mock implementation, we'll just show a success message
      
      toast.success(`Successfully imported ${results.length} employees`);
      setIsImportDialogOpen(false);
    } catch (error) {
      console.error('Error importing employees:', error);
      toast.error('Failed to import employees');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Disable actions if not admin
  if (!isAdmin) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <h2 className="text-xl font-semibold mb-2">Access Restricted</h2>
                <p className="text-gray-600">You don't have permission to access User Management.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Add, edit, and manage users for your organization</CardDescription>
              </div>
              <div className="flex space-x-2">
                <Button 
                  onClick={() => setIsAddDialogOpen(true)} 
                  className="flex items-center"
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add User
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsImportDialogOpen(true)}
                  className="flex items-center"
                >
                  <FileUp className="mr-2 h-4 w-4" />
                  Import Employees
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="Search users..."
                className="border rounded px-3 py-2 flex-grow"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Button variant="outline" onClick={() => setSearchTerm('')}>Clear</Button>
            </div>
          </CardHeader>
          <CardContent>
            <UserList 
              users={filteredUsers} 
              onEditClick={handleEditClick} 
              onDeleteUser={handleDeleteUser} 
              onDeactivateUser={handleDeactivateUser} 
            />
          </CardContent>
        </Card>
      </div>
      
      <AddUserDialog 
        isOpen={isAddDialogOpen}
        setIsOpen={setIsAddDialogOpen}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleAddUser}
        resetForm={resetFormData}
        isLoading={isLoading}
        clientId={clientId}
      />
      
      <EditUserDialog 
        isOpen={isEditDialogOpen}
        setIsOpen={setIsEditDialogOpen}
        formData={editFormData}
        setFormData={setEditFormData}
        onSubmit={handleUpdateUser}
        resetForm={resetEditFormData}
        isLoading={isLoading}
        clientId={editFormData.clientId || clientId}
      />
      
      <ImportEmployeeDialog 
        isOpen={isImportDialogOpen} 
        setIsOpen={setIsImportDialogOpen}
        clientId={clientId}
        onImportSubmit={handleEmployeeImport}
        isLoading={isLoading}
      />
    </Layout>
  );
};

export default UserManagement;
