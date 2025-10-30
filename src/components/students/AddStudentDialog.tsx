
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
import { Person } from '@/types/incident';
import { Student } from '@/types/student';

interface AddStudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  peopleInvolved?: Person | null;
  onStudentAdded?: (student: Student) => void;
}

const AddStudentDialog = ({ open, onOpenChange, peopleInvolved, onStudentAdded }: AddStudentDialogProps) => {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { addStudent, students } = useStudents();

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      await addStudent(data);
      
      // Call the callback with the most recently added student
      if (onStudentAdded && students.length > 0) {
        // Find the student that was just added (assuming it's the first one in the list)
        const newStudent = students[0];
        onStudentAdded(newStudent);
      }
      
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
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Student</DialogTitle>
        </DialogHeader>
        
        <StudentForm 
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          peopleInvolved={peopleInvolved}
          onCancel={() => onOpenChange(false)}
        />
        
        {/* <DialogFooter className="mt-4">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
        </DialogFooter> */}
      </DialogContent>
    </Dialog>
  );
};

export default AddStudentDialog;
