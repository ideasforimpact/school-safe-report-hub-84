
import React from 'react';
import { Student } from '@/types/student';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Edit, Trash2, School, IdCard, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface StudentsListProps {
  students: Student[];
  onEditClick: (student: Student) => void;
  onDeleteStudent: (id: string) => void;
}

const StudentsList = ({ students, onEditClick, onDeleteStudent }: StudentsListProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead><IdCard className="h-4 w-4 mr-2" /> Student ID</TableHead>
          <TableHead><User className="h-4 w-4 mr-2" /> Name</TableHead>
          <TableHead><School className="h-4 w-4 mr-2" /> Grade</TableHead>
          <TableHead>Section</TableHead>
          <TableHead>Campus</TableHead>
          <TableHead>Added</TableHead>
          <TableHead className="w-[100px]">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {students.map((student) => (
          <TableRow key={student.id}>
            <TableCell>{student.studentId}</TableCell>
            <TableCell>{student.name}</TableCell>
            <TableCell>{student.grade}</TableCell>
            <TableCell>{student.section}</TableCell>
            <TableCell>{student.campus}</TableCell>
            <TableCell>{formatDistanceToNow(new Date(student.createdAt), { addSuffix: true })}</TableCell>
            <TableCell>
              <div className="flex space-x-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => onEditClick(student)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => onDeleteStudent(student.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
        {students.length === 0 && (
          <TableRow>
            <TableCell colSpan={7} className="text-center py-8 text-gray-500">
              No students found. Add your first student to get started.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};

export default StudentsList;
