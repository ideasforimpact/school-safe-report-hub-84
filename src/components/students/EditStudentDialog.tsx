
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import StudentForm from './StudentForm';
import { useStudents } from '@/contexts/StudentContext';
import { Student } from '@/types/student';
import { toast } from 'sonner';

interface EditStudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: Student | null;
}

const EditStudentDialog = ({ open, onOpenChange, student }: EditStudentDialogProps) => {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { updateStudent } = useStudents();

  const handleSubmit = async (data: any) => {
    if (!student) return;
    
    setIsSubmitting(true);
    try {
      await updateStudent(student.id, data);
      toast.success('Student updated successfully');
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to update student');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!student) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Student</DialogTitle>
        </DialogHeader>
        <StudentForm
          defaultValues={{
            studentId: student.studentId,
            name: student.name,
            grade: student.grade,
            section: student.section,
            campus: student.campus
          }}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  );
};

export default EditStudentDialog;
