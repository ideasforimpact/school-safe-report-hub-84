import React, { useState, useMemo } from 'react';
import Layout from '@/components/layout/Layout';
import { useStudents } from '@/contexts/StudentContext';
import { useAuth } from '@/contexts/auth';
import { Student } from '@/types/student';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle, UserSearch, FileUp, Search, RefreshCw } from 'lucide-react';
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
import { processStudentExcel } from '@/services/student/importStudentService';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface StudentManagementProps {
  embedded?: boolean;
}

const StudentManagement = ({ embedded = false }: StudentManagementProps) => {
  const { students, deleteStudent, refreshStudents, isLoading } = useStudents();
  const { employeeData } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [sectionFilter, setSectionFilter] = useState('all');
  const [campusFilter, setCampusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleEditClick = (student: Student) => {
    setSelectedStudent(student);
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setStudentToDelete(id);
    setIsDeleteAlertOpen(true);
  };

  const confirmDelete = async () => {
    if (studentToDelete) {
      setIsDeleting(true);
      try {
        await deleteStudent(studentToDelete);
      } catch (error) {
        console.error('Delete error:', error);
      } finally {
        setIsDeleteAlertOpen(false);
        setStudentToDelete(null);
        setIsDeleting(false);
      }
    }
  };

  const handleImportStudents = async (file: File) => {
    try {
      if (!employeeData?.clientId) {
        toast.error('Client information not available. Please ensure you are logged in properly.');
        return;
      }

      console.log('Starting import process...');
      await processStudentExcel(file, employeeData.clientId);
      
      // Refresh the students list after successful import
      console.log('Import completed, refreshing student list...');
      await refreshStudents();
      
      toast.success("Students imported successfully");
      setIsImportDialogOpen(false);
    } catch (error) {
      console.error("Import process failed:", error);
      toast.error("Failed to process student import");
    }
  };

  // Filter students based on search query and filters
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const matchesSearch = 
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.grade.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.section.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.campus.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesGrade = gradeFilter === 'all' || student.grade === gradeFilter;
      const matchesSection = sectionFilter === 'all' || student.section === sectionFilter;
      const matchesCampus = campusFilter === 'all' || student.campus === campusFilter;
      
      return matchesSearch && matchesGrade && matchesSection && matchesCampus;
    });
  }, [students, searchQuery, gradeFilter, sectionFilter, campusFilter]);

  // Pagination logic
  const totalItems = filteredStudents.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  const paginatedStudents = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredStudents.slice(startIndex, endIndex);
  }, [filteredStudents, currentPage, itemsPerPage]);

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, gradeFilter, sectionFilter, campusFilter, itemsPerPage]);

  // Clear all filters
  const clearAllFilters = () => {
    setSearchQuery('');
    setGradeFilter('all');
    setSectionFilter('all');
    setCampusFilter('all');
    setItemsPerPage(10);
  };

  // Get active filters count
  const activeFiltersCount = [
    searchQuery ? 1 : 0,
    gradeFilter !== 'all' ? 1 : 0,
    sectionFilter !== 'all' ? 1 : 0,
    campusFilter !== 'all' ? 1 : 0,
    itemsPerPage !== 10 ? 1 : 0,
  ].reduce((sum, count) => sum + count, 0);

  const content = (
    <div className="space-y-6">
      {!embedded && (
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Student Management</h1>
            <p className="text-muted-foreground">
              Manage students in your institution
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => setIsImportDialogOpen(true)}
              className="flex items-center gap-2"
              variant="secondary"
            >
              <FileUp className="h-4 w-4" />
              <span>Import Students</span>
            </Button>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Student
            </Button>
          </div>
        </div>
      )}

      {embedded && (
        <div className="flex justify-end items-center">
          <div className="flex gap-2">
            <Button 
              onClick={() => setIsImportDialogOpen(true)}
              className="flex items-center gap-2"
              variant="secondary"
            >
              <FileUp className="h-4 w-4" />
              <span>Import Students</span>
            </Button>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Student
            </Button>
          </div>
        </div>
      )}

      <Card className="mx-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Students</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshStudents}
            disabled={isLoading}
            title="Refresh student list"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </CardHeader>
        
        {/* Search and Filters Section - Inside the card */}
        <CardContent className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-4 md:space-y-0 w-full mb-4">
            {/* Search Bar */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by name, student ID, grade, section, or campus..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10"
                />
              </div>
            </div>
            
            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              {/* Grade Filter */}
              <Select value={gradeFilter} onValueChange={setGradeFilter}>
                <SelectTrigger className="w-[140px] h-10">
                  <SelectValue placeholder="All Grades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Grades</SelectItem>
                  {Array.from(new Set(students.map(s => s.grade))).sort().map(grade => (
                    <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Section Filter */}
              <Select value={sectionFilter} onValueChange={setSectionFilter}>
                <SelectTrigger className="w-[140px] h-10">
                  <SelectValue placeholder="All Sections" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sections</SelectItem>
                  {Array.from(new Set(students.map(s => s.section))).sort().map(section => (
                    <SelectItem key={section} value={section}>{section}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Campus Filter */}
              <Select value={campusFilter} onValueChange={setCampusFilter}>
                <SelectTrigger className="w-[140px] h-10">
                  <SelectValue placeholder="All Campuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Campuses</SelectItem>
                  {Array.from(new Set(students.map(s => s.campus))).sort().map(campus => (
                    <SelectItem key={campus} value={campus}>{campus}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Clear Filters Button */}
              {activeFiltersCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllFilters}
                  className="text-gray-600 h-10"
                >
                  Clear Filters ({activeFiltersCount})
                </Button>
              )}
            </div>
          </div>
          
          {/* Student count after search and filters */}
          <div className="mb-6">
            <p className="text-sm text-gray-600">
              Showing {filteredStudents.length} of {students.length} students
            </p>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div>
              {filteredStudents && filteredStudents.length > 0 ? (
                <StudentsList
                  students={paginatedStudents}
                  onEditClick={handleEditClick}
                  onDeleteStudent={handleDeleteClick}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  itemsPerPage={itemsPerPage}
                  onItemsPerPageChange={setItemsPerPage}
                />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {searchQuery || gradeFilter !== 'all' || sectionFilter !== 'all' || campusFilter !== 'all' ? 'No students found matching your filters.' : 'No students found.'}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Student Dialog */}
      <AddStudentDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
      />

      {/* Edit Student Dialog */}
      {selectedStudent && (
        <EditStudentDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          student={selectedStudent}
        />
      )}

      {/* Import Students Dialog */}
      <ImportStudentDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        onImportStudents={handleImportStudents}
      />

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

  if (embedded) {
    return content;
  }

  return (
    <Layout>
      {content}
    </Layout>
  );
};

export default StudentManagement;
