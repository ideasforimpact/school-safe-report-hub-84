
import React, { useState, useEffect } from 'react';
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

interface EditEmployeeDialogProps {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  employee: Employee;
  onUpdateEmployee: (id: string, updates: Partial<Employee>) => Promise<void>;
}

const EditEmployeeDialog = ({ 
  isOpen, 
  setIsOpen, 
  employee,
  onUpdateEmployee
}: EditEmployeeDialogProps) => {
  const [formData, setFormData] = useState<Partial<Employee>>({
    ...employee
  });

  // Update form data when employee changes
  useEffect(() => {
    setFormData({...employee});
  }, [employee]);

  const handleSubmit = async () => {
    await onUpdateEmployee(employee.id, formData);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Employee</DialogTitle>
          <DialogDescription>
            Update employee information
          </DialogDescription>
        </DialogHeader>
        <EmployeeForm formData={formData} setFormData={setFormData} isEditMode={true} />
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Update Employee</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditEmployeeDialog;
