import { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { useAuth, User, UserRole, ModulePermissions, EmployeeType, DepartmentType } from '@/contexts/AuthContext';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';
import UserList from '@/components/users/UserList';
import AddUserDialog from '@/components/users/AddUserDialog';
import EditUserDialog from '@/components/users/EditUserDialog';

const UserManagement = () => {
  const { users, addUser, updateUser, deleteUser, deactivateUser, isAdmin } = useAuth();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    employeeId: '',
    employeeType: 'permanent' as EmployeeType,
    department: 'admin' as DepartmentType,
    joiningDate: '',
    role: 'reporter' as UserRole,
    modulePermissions: {
      superAdmin: false,
      incidentReporting: true,
      incidentAdmin: false,
      assessmentUser: true,
      assessmentsAdmin: false,
      employeeVerificationAdmin: false,
      grievancesAdmin: false,
      transportSafetyAdmin: false,
      eduSafeResourceAccess: true
    }
  });

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      employeeId: '',
      employeeType: 'permanent' as EmployeeType,
      department: 'admin' as DepartmentType,
      joiningDate: '',
      role: 'reporter',
      modulePermissions: {
        superAdmin: false,
        incidentReporting: true,
        incidentAdmin: false,
        assessmentUser: true,
        assessmentsAdmin: false,
        employeeVerificationAdmin: false,
        grievancesAdmin: false,
        transportSafetyAdmin: false,
        eduSafeResourceAccess: true
      }
    });
    setCurrentUser(null);
  };

  const handleAddUser = () => {
    addUser(formData);
    setIsAddDialogOpen(false);
    resetForm();
  };

  const handleEditClick = (user: User) => {
    setCurrentUser(user);
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: '',
      employeeId: user.employeeId || '',
      employeeType: user.employeeType || 'permanent',
      department: user.department || 'admin',
      joiningDate: user.joiningDate || '',
      role: user.role,
      modulePermissions: {
        superAdmin: user.modulePermissions?.superAdmin ?? false,
        incidentReporting: user.modulePermissions?.incidentReporting ?? true,
        incidentAdmin: user.modulePermissions?.incidentAdmin ?? false,
        assessmentUser: user.modulePermissions?.assessmentUser ?? true,
        assessmentsAdmin: user.modulePermissions?.assessmentsAdmin ?? false,
        employeeVerificationAdmin: user.modulePermissions?.employeeVerificationAdmin ?? false,
        grievancesAdmin: user.modulePermissions?.grievancesAdmin ?? false,
        transportSafetyAdmin: user.modulePermissions?.transportSafetyAdmin ?? false,
        eduSafeResourceAccess: user.modulePermissions?.eduSafeResourceAccess ?? true
      }
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateUser = () => {
    if (currentUser) {
      updateUser(currentUser.id, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        employeeId: formData.employeeId,
        employeeType: formData.employeeType,
        department: formData.department,
        joiningDate: formData.joiningDate,
        role: formData.role,
        modulePermissions: formData.modulePermissions,
        ...(formData.password ? { password: formData.password } : {})
      });
      setIsEditDialogOpen(false);
      resetForm();
    }
  };

  const handleDeleteUser = (id: string) => {
    deleteUser(id);
  };

  const handleDeactivateUser = (id: string) => {
    deactivateUser(id);
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

  // Filter active users to the top
  const sortedUsers = [...users].sort((a, b) => {
    if (a.isActive === b.isActive) {
      return 0;
    }
    return a.isActive ? -1 : 1;
  });

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Employee Management</h1>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Employee
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Employees</CardTitle>
            <CardDescription>
              Manage system employees and their roles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UserList 
              users={sortedUsers}
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
    </Layout>
  );
};

export default UserManagement;
