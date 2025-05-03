
import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import StudentForm from './StudentForm';
import { useStudents } from '@/contexts/StudentContext';
import { toast } from 'sonner';

interface AddStudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AddStudentDialog = ({ open, onOpenChange }: AddStudentDialogProps) => {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { addStudent } = useStudents();

  const handleSubmit = (data: any) => {
    setIsSubmitting(true);
    try {
      addStudent(data);
      toast.success('Student added successfully');
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to add student');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Student</DialogTitle>
        </DialogHeader>
        
        <StudentForm 
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
        
        <DialogFooter className="mt-4">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddStudentDialog;
