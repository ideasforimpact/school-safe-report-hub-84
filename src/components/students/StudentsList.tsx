
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
import TablePaginationBar from '@/components/common/TablePaginationBar';
import { formatDate } from '@/lib/Dateformat';
import { useLang } from '@/hooks/useLang';

interface StudentsListProps {
  students: Student[];
  totalStudents: number;
  onEditClick: (student: Student) => void;
  onDeleteStudent: (id: string) => void;
  canManageStudents?: boolean;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  itemsPerPage?: number;
  onItemsPerPageChange?: (itemsPerPage: number) => void;
}

const StudentsList = ({ 
  students, 
  totalStudents,
  onEditClick, 
  onDeleteStudent,
  canManageStudents = true,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  itemsPerPage = 10,
  onItemsPerPageChange
}: StudentsListProps) => {
  const totalItems = totalStudents;
  const lang = useLang();

  const handlePageChange = (page: number) => {
    if (onPageChange) {
      onPageChange(page);
    }
  };

  return (
    <div>
      <Table>
      <TableHeader>
        <TableRow className=''>
        <TableHead>
          <div className="flex items-center">
            <IdCard className="h-4 w-4 mr-2" />
            <span> {lang.labels.memberId}</span>
          </div>
        </TableHead>
        <TableHead>
          <div className="flex items-center">
            <User className="h-4 w-4 mr-2" />
            <span> Name</span>
          </div>
        </TableHead>
        <TableHead>
          <div className="flex items-center">
            <School className="h-4 w-4 mr-2" />
            <span> {lang.structure.grade}</span>
          </div>
        </TableHead>
          <TableHead>{lang.structure.section}</TableHead>
          <TableHead>{lang.structure.campus}</TableHead>
          <TableHead>Added</TableHead>
          {canManageStudents && <TableHead className="w-[100px]">Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {students.map((student) => (
          <TableRow key={student.id}>
            <TableCell>{student.studentId}</TableCell>
            <TableCell>{student.name}</TableCell>
            <TableCell>{student.grade_name || student.grade || '-'}</TableCell>
            <TableCell>{student.section_name || student.section || '-'}</TableCell>
            <TableCell>{student.campus}</TableCell>
            <TableCell>
              {formatDate(student.createdAt)}
            </TableCell>

            {canManageStudents && (
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
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
            )}
          </TableRow>
        ))}
        {students.length === 0 && (
          <TableRow>
            <TableCell colSpan={7} className="text-center py-8 text-gray-500">
              No {lang.people.members.toLowerCase()} found. Add your first {lang.people.member.toLowerCase()} to get started.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>

    {/* Pagination Controls */}
    {totalItems > 0 && onPageChange && (
      <TablePaginationBar
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={totalItems}
        pageSize={itemsPerPage}
        itemLabel={lang.people.members.toLowerCase()}
        onPageChange={handlePageChange}
      />
    )}
    </div>
  );
};

export default StudentsList;
