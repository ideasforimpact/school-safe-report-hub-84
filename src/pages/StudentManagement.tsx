import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { useStudents } from '@/contexts/StudentContext';
import { useAuth } from '@/contexts/auth';
import { Student } from '@/types/student';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle, UserSearch, FileUp, Search, RefreshCw, X } from 'lucide-react';
import StudentsList from '@/components/students/StudentsList';
import AddStudentDialog from '@/components/students/AddStudentDialog';
import EditStudentDialog from '@/components/students/EditStudentDialog';
import ImportStudentDialog from '@/components/students/ImportStudentDialog';
import { useRealTimeSubHook } from '@/hooks/useRealTimeSubHook';
import { fetchStudentsByClientId } from '@/services/student/fetchStudentService';
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
import { incidentReferenceService } from '@/services/incident/incidentReferenceService';
import { Skeleton } from "@/components/ui/skeleton";
import { processStudentExcel } from '@/services/student/importStudentService';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Loader from '@/components/common/Loader';
import { useIsReadOnlySwitchedContext } from '@/hooks/useIsReadOnlySwitchedContext';

interface StudentManagementProps {
  embedded?: boolean;
}

const StudentManagement = ({ embedded = false }: StudentManagementProps) => {
  const { students, deleteStudent, refreshStudents, isLoading } = useStudents();
  const { employeeData } = useAuth();
  const isReadOnlySwitchedContext = useIsReadOnlySwitchedContext();
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
  
  useEffect(() => {
    if (employeeData?.clientId) {
      refreshStudents(); 
    }
  }, [employeeData?.clientId]);
  
  const handleEditClick = (student: Student) => {
    if (isReadOnlySwitchedContext) {
      return;
    }
    setSelectedStudent(student);
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = async (id: string) => {
    if (isReadOnlySwitchedContext) {
      return;
    }
    if (!employeeData?.clientId) {
      toast.error('Client information not available');
      return;
    }

    // Check if student is linked to incidents - prevent deletion if linked
    try {
      const refInfo = await incidentReferenceService.checkStudentReferences(id, employeeData.clientId);
      if (refInfo.hasReferences) {
        toast.error(refInfo.message || `This student is linked to ${refInfo.count} incident(s) and cannot be deleted.`);
        return;
      }
    } catch (error) {
      console.error('Error checking student references:', error);
      // Continue with deletion if check fails (fail open)
    }

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

  // Toast deduplication - prevent multiple toasts for the same event within 2 seconds
  const lastToastRef = useRef<{ message: string; timestamp: number } | null>(null);
  const TOAST_DEBOUNCE_MS = 2000; // 2 seconds

  const showToast = useCallback((message: string, type: 'success' | 'info' | 'error' = 'info') => {
    const now = Date.now();
    const lastToast = lastToastRef.current;

    // Check if this is a duplicate toast within the debounce window
    if (lastToast && lastToast.message === message && (now - lastToast.timestamp) < TOAST_DEBOUNCE_MS) {
      console.log('[Toast] Duplicate toast prevented:', message);
      return;
    }

    // Update the last toast reference
    lastToastRef.current = { message, timestamp: now };

    // Show the toast
    if (type === 'success') {
      toast.success(message);
    } else if (type === 'error') {
      toast.error(message);
    } else {
      toast.info(message);
    }
  }, []);

  // Get client_id from auth context
  const clientId = employeeData?.clientId;
  
  // Debug: Log when clientId changes
  React.useEffect(() => {
    console.log('[StudentManagement] ClientId changed:', clientId);
    console.log('[StudentManagement] Setting up realtime subscriptions for:', {
      students: !!clientId,
      grades: !!clientId,
      sections: !!clientId
    });
  }, [clientId]);

  // Handle realtime student updates
  const handleStudentUpdate = useCallback(async () => {
    await refreshStudents();
  }, [refreshStudents]);

  // Handle realtime grades updates
  const handleGradeUpdate = useCallback(async (payload: any) => {
    console.log('[Realtime] ===== Grade update handler called =====');
    console.log('[Realtime] Full payload:', JSON.stringify(payload, null, 2));
    console.log('[Realtime] Payload keys:', Object.keys(payload));
    console.log('[Realtime] Event type:', payload.eventType);
    
    const updatedGrade = payload.new;
    const oldGrade = payload.old;
    
    console.log('[Realtime] Updated grade (new):', updatedGrade);
    console.log('[Realtime] Old grade:', oldGrade);
    
    // Filter by client_id
    const gradeToCheck = updatedGrade || oldGrade;
    
    if (!gradeToCheck) {
      console.log('[Realtime] ❌ No grade data in payload, skipping');
      return;
    }

    console.log('[Realtime] Grade to check:', gradeToCheck);
    console.log('[Realtime] Current clientId:', clientId);
    console.log('[Realtime] Grade client_id:', gradeToCheck.client_id);

    if (!clientId || gradeToCheck.client_id !== clientId) {
      console.log('[Realtime] ❌ Client ID mismatch for grade, skipping:', {
        payloadClientId: gradeToCheck.client_id,
        currentClientId: clientId,
        match: gradeToCheck.client_id === clientId
      });
      return;
    }

    console.log('[Realtime] ✅ Grade updated matches client, refreshing students list to update grade names');
    
    // Refresh students list to get updated grade names
    try {
      await refreshStudents();
      console.log('[Realtime] ✅ Students list refreshed successfully');
      showToast('Grade updated - student list refreshed', 'info');
    } catch (error) {
      console.error('[Realtime] ❌ Error refreshing students after grade update:', error);
    }
  }, [clientId, refreshStudents, showToast]);

  // Handle realtime sections updates
  const handleSectionUpdate = useCallback(async (payload: any) => {
    console.log('[Realtime] Section update payload received:', payload);
    
    const updatedSection = payload.new;
    const oldSection = payload.old;
    
    // Filter by client_id
    const sectionToCheck = updatedSection || oldSection;
    
    if (!sectionToCheck) {
      console.log('[Realtime] No section data in payload, skipping');
      return;
    }

    if (!clientId || sectionToCheck.client_id !== clientId) {
      console.log('[Realtime] Client ID mismatch for section, skipping:', {
        payloadClientId: sectionToCheck.client_id,
        currentClientId: clientId
      });
      return;
    }

    console.log('[Realtime] Section updated, refreshing students list to update section names');
    
    // Refresh students list to get updated section names
    try {
      await refreshStudents();
      showToast('Section updated - student list refreshed', 'info');
    } catch (error) {
      console.error('[Realtime] Error refreshing students after section update:', error);
    }
  }, [clientId, refreshStudents, showToast]);

  // Handle realtime campuses updates
  const handleCampusUpdate = useCallback(async (payload: any) => {
    console.log('[Realtime] Campus update payload received:', payload);
    
    const updatedCampus = payload.new;
    const oldCampus = payload.old;
    
    // Filter by client_id
    const campusToCheck = updatedCampus || oldCampus;
    
    if (!campusToCheck) {
      console.log('[Realtime] No campus data in payload, skipping');
      return;
    }

    if (!clientId || campusToCheck.client_id !== clientId) {
      console.log('[Realtime] Client ID mismatch for campus, skipping:', {
        payloadClientId: campusToCheck.client_id,
        currentClientId: clientId
      });
      return;
    }

    console.log('[Realtime] Campus updated, refreshing students list to update campus names');
    
    // Refresh students list to get updated campus names
    try {
      await refreshStudents();
      showToast('Campus updated - student list refreshed', 'info');
    } catch (error) {
      console.error('[Realtime] Error refreshing students after campus update:', error);
    }
  }, [clientId, refreshStudents, showToast]);

  // Set up realtime subscription for students table
  // Filter by client_id
  useRealTimeSubHook({
    channelName: `students-${clientId || 'all'}`,
    events: '*',
    table: 'students',
    enabled: !!clientId,
    onPayload: handleStudentUpdate,
  });

  // Set up realtime subscription for grades table
  // Filter by client_id - when grades are updated, refresh students to show updated grade names
  useRealTimeSubHook({
    channelName: `grades-${clientId || 'all'}`,
    events: ['UPDATE', 'INSERT', 'DELETE'],
    table: 'grades',
    filter: clientId ? `client_id=eq.${clientId}` : undefined,
    enabled: !!clientId,
    onPayload: (payload) => {
      console.log('[Realtime] Grades subscription - Raw payload received:', payload);
      console.log('[Realtime] Grades subscription - Event type:', payload.eventType);
      console.log('[Realtime] Grades subscription - New data:', payload.new);
      console.log('[Realtime] Grades subscription - Old data:', payload.old);
      handleGradeUpdate(payload);
    },
    onStatusChange: (status) => {
      console.log('[Realtime] Grades subscription status changed:', status);
      if (status === 'SUBSCRIBED') {
        console.log('[Realtime] Successfully subscribed to grades table for client:', clientId);
      } else if (status === 'CHANNEL_ERROR') {
        console.error('[Realtime] Error subscribing to grades table');
      }
    },
  });

  // Set up realtime subscription for sections table
  // Filter by client_id - when sections are updated, refresh students to show updated section names
  useRealTimeSubHook({
    channelName: `sections-${clientId || 'all'}`,
    events: ['UPDATE', 'INSERT', 'DELETE'],
    table: 'sections',
    filter: clientId ? `client_id=eq.${clientId}` : undefined,
    enabled: !!clientId,
    onPayload: handleSectionUpdate,
  });

  // Set up realtime subscription for campuses table
  // Filter by client_id - when campuses are updated, refresh students to show updated campus names
  useRealTimeSubHook({
    channelName: `campuses-${clientId || 'all'}`,
    events: ['UPDATE', 'INSERT', 'DELETE'],
    table: 'campuses',
    filter: clientId ? `client_id=eq.${clientId}` : undefined,
    enabled: !!clientId,
    onPayload: handleCampusUpdate,
  });

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
          {!isReadOnlySwitchedContext && (
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
          )}
        </div>
      )}

      {embedded && (
        <div className="flex justify-end items-center">
          {!isReadOnlySwitchedContext && (
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
          )}
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
                  <X className="h-4 w-4 mr-1" />
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
              <Loader text="Loading students..." />
            </div>
          ) : (
            <div>
              {filteredStudents && filteredStudents.length > 0 ? (
                <StudentsList
                  students={paginatedStudents}
                  onEditClick={handleEditClick}
                  onDeleteStudent={handleDeleteClick}
                  canManageStudents={!isReadOnlySwitchedContext}
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
      {selectedStudent && !isReadOnlySwitchedContext && (
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
      <AlertDialog open={isDeleteAlertOpen && !isReadOnlySwitchedContext} onOpenChange={setIsDeleteAlertOpen}>
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
