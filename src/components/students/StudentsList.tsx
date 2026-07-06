
import React, { useEffect, useState } from 'react';
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
import { useAuth } from '@/contexts/auth/useAuth';
import { incidentReferenceService, IncidentReferenceCheck } from '@/services/incident/incidentReferenceService';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Edit, Trash2, School, IdCard, User } from 'lucide-react';
import TablePaginationBar from '@/components/common/TablePaginationBar';
import { formatDate } from '@/lib/Dateformat';

interface StudentsListProps {
  students: Student[];
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
  onEditClick, 
  onDeleteStudent,
  canManageStudents = true,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  itemsPerPage = 10,
  onItemsPerPageChange
}: StudentsListProps) => {
  const totalItems = students.length;
  const { employeeData } = useAuth();
  const [studentReferences, setStudentReferences] = useState<Record<string, IncidentReferenceCheck>>({});

  // Pre-load reference info so we can disable delete button for linked students
  useEffect(() => {
    const clientId = employeeData?.clientId || employeeData?.client_id;
    if (!clientId || students.length === 0) {
      setStudentReferences({});
      return;
    }

    let isCancelled = false;

    const fetchReferences = async () => {
      try {
        const results = await Promise.all(
          students.map(async (student) => {
            const refInfo = await incidentReferenceService.checkStudentReferences(student.id, clientId);
            return { id: student.id, refInfo };
          })
        );

        if (isCancelled) return;

        const map: Record<string, IncidentReferenceCheck> = {};
        results.forEach(({ id, refInfo }) => {
          map[id] = refInfo;
        });
        setStudentReferences(map);
      } catch (error) {
        console.error('Error preloading student reference info:', error);
      }
    };

    fetchReferences();

    return () => {
      isCancelled = true;
    };
  }, [students, employeeData]);

  const handlePageChange = (page: number) => {
    if (onPageChange) {
      onPageChange(page);
    }
  };

  const handleItemsPerPageChange = (value: string) => {
    if (onItemsPerPageChange) {
      onItemsPerPageChange(Number(value));
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
                {(() => {
                  const refInfo = studentReferences[student.id];
                  const isLinked = refInfo?.hasReferences;

                  if (isLinked) {
                    const message =
                      refInfo?.message ||
                      `This student is linked to ${refInfo?.count ?? 0} incident(s) and cannot be deleted.`;

                    return (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-flex">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                disabled={true}
                                aria-disabled="true"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                }}
                                className="text-red-400 hover:text-red-400 hover:bg-transparent cursor-not-allowed opacity-60"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent 
                            side="left" 
                            align="center" 
                            sideOffset={8} 
                            className="max-w-xs whitespace-normal text-left"
                          >
                            <p className="text-xs leading-snug text-left">
                              {message}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    );
                  }

                  return (
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => onDeleteStudent(student.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                      <Trash2 className="h-4 w-4" />
                </Button>
                  );
                })()}
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
      <TablePaginationBar
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={totalItems}
        pageSize={itemsPerPage}
        itemLabel="students"
        onPageChange={handlePageChange}
      />
    )}
    </div>
  );
};

export default StudentsList;
