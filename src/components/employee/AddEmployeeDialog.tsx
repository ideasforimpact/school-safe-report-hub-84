
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import EmployeeForm from './EmployeeForm';
import { Employee, EmployeeType, DepartmentType, EmploymentStatus } from '@/contexts/employee/types';

interface AddEmployeeDialogProps {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onAddEmployee: (employeeData: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
}

const AddEmployeeDialog = ({ isOpen, setIsOpen, onAddEmployee }: AddEmployeeDialogProps) => {
  const [formData, setFormData] = useState<Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>>({
    employeeId: '',
    firstName: '',
    lastName: '',
    email: '',
    employeeType: 'permanent' as EmployeeType,
    department: 'admin' as DepartmentType,
    joiningDate: new Date().toISOString().split('T')[0],
    status: 'active' as EmploymentStatus,
  });

  const resetForm = () => {
    setFormData({
      employeeId: '',
      firstName: '',
      lastName: '',
      email: '',
      employeeType: 'permanent',
      department: 'admin',
      joiningDate: new Date().toISOString().split('T')[0],
      status: 'active',
    });
  };

  const handleSubmit = async () => {
    await onAddEmployee(formData);
    setIsOpen(false);
    resetForm();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Employee</DialogTitle>
          <DialogDescription>
            Add a new employee to the system
          </DialogDescription>
        </DialogHeader>
        <EmployeeForm formData={formData} setFormData={setFormData} />
        <DialogFooter>
          <Button variant="outline" onClick={() => {
            setIsOpen(false);
            resetForm();
          }}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Add Employee</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddEmployeeDialog;
