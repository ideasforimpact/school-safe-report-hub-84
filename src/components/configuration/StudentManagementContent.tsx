
import React, { useState } from 'react';
import { Student } from '@/types/student';
import StudentsList from '@/components/students/StudentsList';

const StudentManagementContent = () => {
  const [students] = useState<Student[]>([]);

  const handleEditClick = (student: Student) => {
    console.log('Edit student:', student);
  };

  const handleDeleteStudent = (id: string) => {
    console.log('Delete student:', id);
  };

  return (
    <div className="space-y-6">
      <StudentsList
        students={students}
        onEditClick={handleEditClick}
        onDeleteStudent={handleDeleteStudent}
      />
    </div>
  );
};

export default StudentManagementContent;
