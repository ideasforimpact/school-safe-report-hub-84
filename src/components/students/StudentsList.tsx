
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
import { Edit, Trash2, School, IdCard, User, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { formatDate } from '@/lib/Dateformat';

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
            <span> Student ID</span>
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
            <span> Grade</span>
          </div>
        </TableHead>
          <TableHead>Section</TableHead>
          <TableHead>Campus</TableHead>
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
              No students found. Add your first student to get started.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>

    {/* Pagination Controls */}
    {totalItems > 0 && onPageChange && (
      <div className="flex items-center justify-center space-x-6 lg:space-x-8 py-4">
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
            >
              <span className="sr-only">Go to first page</span>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <span className="sr-only">Go to previous page</span>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            {/* Page Numbers */}
            <div className="flex items-center space-x-1">
              {Array.from({ length: totalPages }, (_, index) => {
                const pageNumber = index + 1;
                const isCurrentPage = pageNumber === currentPage;
                
                // Show first page, last page, current page, and pages around current page
                const shouldShow = 
                  pageNumber === 1 || 
                  pageNumber === totalPages || 
                  (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1);
                
                if (!shouldShow) {
                  // Show ellipsis if there's a gap
                  if (pageNumber === currentPage - 2 || pageNumber === currentPage + 2) {
                    return (
                      <span key={`ellipsis-${pageNumber}`} className="px-2 text-sm text-gray-500">
                        ...
                      </span>
                    );
                  }
                  return null;
                }
                
                return (
                  <Button
                    key={pageNumber}
                    variant={isCurrentPage ? "default" : "outline"}
                    className="h-8 w-8 p-0"
                    onClick={() => handlePageChange(pageNumber)}
                  >
                    {pageNumber}
                  </Button>
                );
              })}
            </div>
            
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <span className="sr-only">Go to next page</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
            >
              <span className="sr-only">Go to last page</span>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentsList;
