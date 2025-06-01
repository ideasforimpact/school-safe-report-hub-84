
import React, { useState } from 'react';
import { Student } from '@/types/student';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle, UserSearch, FileUp } from 'lucide-react';
import StudentsList from '@/components/students/StudentsList';
import AddStudentDialog from '@/components/students/AddStudentDialog';
import EditStudentDialog from '@/components/students/EditStudentDialog';
import ImportStudentDialog from '@/components/students/ImportStudentDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from 'sonner';
import { Skeleton } from "@/components/ui/skeleton";
import { useStudents } from '@/contexts/StudentContext';
import { processStudentExcel } from '@/services/student/importStudentService';
import { useEmployeeStore } from '@/store/EmployeeContext';
import { hasModulePermission } from '@/store/employeeSelectors';

const StudentManagementContent = () => {
  const { students, deleteStudent, isLoading } = useStudents();
  const { state } = useEmployeeStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Check module permissions - assuming student management requires admin access
  const hasStudentManagementAccess = hasModulePermission(state, 'studentManagement');
  const canAddStudent = hasStudentManagementAccess;
  const canImportStudents = hasStudentManagementAccess;
  const canEditStudent = hasStudentManagementAccess;
  const canDeleteStudent = hasStudentManagementAccess;

  const handleEditClick = (student: Student) => {
    if (!canEditStudent) {
      toast.error('You do not have permission to edit students');
      return;
    }
    setSelectedStudent(student);
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    if (!canDeleteStudent) {
      toast.error('You do not have permission to delete students');
      return;
    }
    setStudentToDelete(id);
    setIsDeleteAlertOpen(true);
  };

  const confirmDelete = async () => {
    if (studentToDelete) {
      setIsDeleting(true);
      try {
        await deleteStudent(studentToDelete);
        toast.success('Student deleted successfully');
      } catch (error) {
        console.error('Delete error:', error);
        toast.error('Failed to delete student. Please try again.');
      } finally {
        setIsDeleteAlertOpen(false);
        setStudentToDelete(null);
        setIsDeleting(false);
      }
    }
  };

  const handleImportStudents = async (file: File) => {
    if (!canImportStudents) {
      toast.error('You do not have permission to import students');
      return;
    }
    try {
      await processStudentExcel(file);
      toast.success("Students imported successfully");
    } catch (error) {
      console.error("Import process failed:", error);
      toast.error("Failed to process student import");
    }
  };

  const filteredStudents = students.filter(
    student =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.grade.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.section.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.campus.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Student Management</h2>
          <p className="text-muted-foreground text-sm">
            Manage students in your institution
          </p>
        </div>
        <div className="flex gap-2">
          {canImportStudents && (
            <Button 
              onClick={() => setIsImportDialogOpen(true)}
              className="flex items-center gap-2"
              variant="secondary"
            >
              <FileUp className="h-4 w-4" />
              <span>Import Students</span>
            </Button>
          )}
          {canAddStudent && (
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Student
            </Button>
          )}
        </div>
      </div>

      {/* Search and filter */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <UserSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search students..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : (
        /* Students list */
        <StudentsList
          students={filteredStudents}
          onEditClick={handleEditClick}
          onDeleteStudent={handleDeleteClick}
        />
      )}

      {/* Add Student Dialog */}
      {canAddStudent && (
        <AddStudentDialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
        />
      )}

      {/* Edit Student Dialog */}
      {selectedStudent && canEditStudent && (
        <EditStudentDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          student={selectedStudent}
        />
      )}

      {/* Import Students Dialog */}
      {canImportStudents && (
        <ImportStudentDialog
          open={isImportDialogOpen}
          onOpenChange={setIsImportDialogOpen}
          onImportStudents={handleImportStudents}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the student record 
              from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default StudentManagementContent;
