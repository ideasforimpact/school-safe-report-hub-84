
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { User, UserRole, EmployeeType, DepartmentType } from '@/contexts/auth/types';

export function useUserManagement() {
  const { users, addUser, updateUser, deleteUser, deactivateUser, reactivateUser, isAdmin } = useAuth();
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

  const handleReactivateUser = (id: string) => {
    reactivateUser(id);
  };

  // Filter active users to the top
  const sortedUsers = [...users].sort((a, b) => {
    if (a.isActive === b.isActive) {
      return 0;
    }
    return a.isActive ? -1 : 1;
  });

  return {
    users: sortedUsers,
    isAdmin,
    formData,
    setFormData,
    isAddDialogOpen,
    setIsAddDialogOpen,
    isEditDialogOpen,
    setIsEditDialogOpen,
    currentUser,
    handleAddUser,
    handleEditClick,
    handleUpdateUser,
    handleDeleteUser,
    handleDeactivateUser,
    handleReactivateUser,
    resetForm
  };
}
