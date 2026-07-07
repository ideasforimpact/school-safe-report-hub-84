
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import EmployeeForm from './EmployeeForm';
import { useEmployeeVerification } from '@/contexts/employee-verification';
import { useToast } from '@/hooks/use-toast';

const AddEmployeeDialog = () => {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addEmployee } = useEmployeeVerification();
  const { toast } = useToast();

  const handleSubmit = (data: {
    employeeId: string;
    name: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    address: string;
    joiningDate: string;
    department: string;
    position: string;
    employeeType: 'permanent' | 'contract' | 'temporary' | 'part_time' | 'consultant' | 'intern';
  }) => {
    setIsSubmitting(true);
    try {
      addEmployee(data);
      toast({
        title: 'Employee Added',
        description: 'The employee has been added successfully.',
      });
      setOpen(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add employee. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Employee
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Employee</DialogTitle>
        </DialogHeader>
        <EmployeeForm 
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  );
};

export default AddEmployeeDialog;
