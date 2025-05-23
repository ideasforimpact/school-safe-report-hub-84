
import React, { useState } from 'react';
import StudentsList from '@/components/students/StudentsList';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  studentId: string;
  grade: string;
  section: string;
  parentName: string;
  parentContact: string;
}

const StudentManagementContent = () => {
  const [students, setStudents] = useState<Student[]>([
    {
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      studentId: 'STU001',
      grade: '10',
      section: 'A',
      parentName: 'James Doe',
      parentContact: '+1-123-456-7890'
    },
    {
      id: '2',
      firstName: 'Jane',
      lastName: 'Smith',
      studentId: 'STU002',
      grade: '8',
      section: 'B',
      parentName: 'Mary Smith',
      parentContact: '+1-234-567-8901'
    }
  ]);

  const handleEditStudent = (student: Student) => {
    // Implementation would open edit dialog and update the student
    toast.info(`Edit student: ${student.firstName} ${student.lastName}`);
  };

  const handleDeleteStudent = (id: string) => {
    // Implementation would delete the student
    setStudents(prev => prev.filter(student => student.id !== id));
    toast.success('Student deleted successfully');
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Student Management</h2>
        <Button 
          className="flex items-center gap-1"
          onClick={() => toast.info('Add student functionality to be implemented')}
        >
          <PlusCircle className="h-4 w-4" />
          Add Student
        </Button>
      </div>

      <StudentsList 
        students={students}
        onEditClick={handleEditStudent}
        onDeleteStudent={handleDeleteStudent}
      />
    </div>
  );
};

export default StudentManagementContent;
