
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
import { Employee } from '@/contexts/employee/types';

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
    employeeType: 'permanent',
    department: 'admin',
    joiningDate: new Date().toISOString().split('T')[0],
    status: 'active'
  });

  const handleSubmit = async () => {
    try {
      await onAddEmployee(formData);
      resetForm();
      setIsOpen(false);
    } catch (error) {
      console.error("Error adding employee:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      employeeId: '',
      firstName: '',
      lastName: '',
      email: '',
      employeeType: 'permanent',
      department: 'admin',
      joiningDate: new Date().toISOString().split('T')[0],
      status: 'active'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) resetForm();
    }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Employee</DialogTitle>
          <DialogDescription>
            Add a new employee to the system
          </DialogDescription>
        </DialogHeader>
        <EmployeeForm formData={formData} setFormData={setFormData} />
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Add Employee</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddEmployeeDialog;
