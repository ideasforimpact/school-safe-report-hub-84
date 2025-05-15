
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Edit2 } from 'lucide-react';
import EmployeeForm from './EmployeeForm';
import { useEmployeeVerification } from '@/contexts/employee-verification';
import { Employee } from '@/types/employeeVerification';
import { useToast } from '@/hooks/use-toast';

interface EditEmployeeDialogProps {
  employee: Employee;
}

const EditEmployeeDialog: React.FC<EditEmployeeDialogProps> = ({ employee }) => {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { updateEmployee } = useEmployeeVerification();
  const { toast } = useToast();

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      await updateEmployee(employee.id, data);
      toast({
        title: 'Employee Updated',
        description: 'The employee has been updated successfully.',
      });
      setOpen(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update employee. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit2 className="h-4 w-4 mr-1" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Employee</DialogTitle>
        </DialogHeader>
        <EmployeeForm
          initialData={employee}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  );
};

export default EditEmployeeDialog;
