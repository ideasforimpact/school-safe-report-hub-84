
import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback, useRef } from 'react';
import { Student } from '@/types/student';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth';
import { fetchStudentsByClientId } from '@/services/student/fetchStudentService';
import { useLocation } from 'react-router-dom';

// supabase.functions.invoke() only sets error.message to a generic
// "Edge Function returned a non-2xx status code" for HTTP errors - the actual
// { error: "..." } body the edge function sent back lives on error.context
// (the raw Response) and has to be read separately.
async function getEdgeFunctionErrorMessage(error: unknown, fallback: string): Promise<string> {
  const err = error as { context?: Response; message?: string } | null;
  if (err?.context && typeof err.context.json === 'function') {
    try {
      const body = await err.context.json();
      if (body?.error) return String(body.error);
    } catch {
      // Response body wasn't JSON - fall back to the generic message below.
    }
  }
  return err?.message || fallback;
}

interface StudentContextType {
  students: Student[];
  totalStudents: number;
  addStudent: (student: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateStudent: (id: string, student: Partial<Student>) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;
  getStudent: (id: string) => Student | undefined;
  refreshStudents: (page?: number, pageSize?: number, search?: string, grade?: string, section?: string, campus?: string) => Promise<void>;
  isLoading: boolean;
}

const StudentContext = createContext<StudentContextType | undefined>(undefined);

export const StudentProvider = ({ children }: { children: ReactNode }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [totalStudents, setTotalStudents] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { employeeData } = useAuth();
  const location = useLocation();
  const isUsersRoute = location.pathname === '/users';
  // The student list is also needed by the People Involved picker on the
  // report/edit incident forms, not just the Students module itself.
  const isStudentDataRoute =
    location.pathname.startsWith('/students') ||
    location.pathname.startsWith('/report-incident') ||
    location.pathname.startsWith('/edit-incident') ||
    (location.pathname.startsWith('/incident/') && location.pathname.endsWith('/edit'));
  const fetchInProgress = useRef(false);
  // On a cold load (hard refresh) this context's own bootstrap effect below
  // and the students page's own filter/pagination effect can both ask for a
  // fetch around the same time, before clientId has "settled". The loser used
  // to be silently dropped, which could leave the list stuck on stale/empty
  // data if the fetch that "won" happened to be the one that lost a race with
  // the Supabase session/auth context still finishing initialization. Instead
  // of dropping it, remember the most recent request and run it once the
  // in-flight one finishes.
  const pendingFetchRef = useRef<{
    page: number;
    pageSize: number;
    search?: string;
    grade?: string;
    section?: string;
    campus?: string;
  } | null>(null);

  // Fetch students function
  const fetchStudents = useCallback(async (
    page: number = 1,
    pageSize: number = 10,
    search?: string,
    grade?: string,
    section?: string,
    campus?: string,
    isRetry: boolean = false
  ) => {
    if (!employeeData?.clientId) {
      console.log('No client ID available, skipping student fetch');
      setStudents([]);
      setTotalStudents(0);
      setIsLoading(false);
      return;
    }

    if (fetchInProgress.current) {
      console.log('Fetch already in progress, queuing latest request');
      pendingFetchRef.current = { page, pageSize, search, grade, section, campus };
      return;
    }

    let shouldRetry = false;
    try {
      fetchInProgress.current = true;
      setIsLoading(true);
      console.log(`Fetching students for client ${employeeData.clientId}, page ${page}, filters:`, { search, grade, section, campus });
      const { students: studentData, totalCount } = await fetchStudentsByClientId(
        employeeData.clientId,
        page,
        pageSize,
        search,
        grade,
        section,
        campus,
        employeeData.clientType?.id
      );
      setStudents(studentData);
      setTotalStudents(totalCount);
      console.log(`Successfully fetched ${studentData.length} students (Total: ${totalCount})`);
    } catch (error) {
      console.error('Error fetching students:', error);
      if (!isRetry) {
        // A fetch failing right after a cold load often means the Supabase
        // session/auth context wasn't fully ready yet (a transient race, not
        // a real failure) - retry once before giving up rather than leaving
        // the list stuck empty with no way to recover short of a manual
        // refresh click.
        shouldRetry = true;
      } else {
        toast.error('Failed to load students');
        setStudents([]);
        setTotalStudents(0);
      }
    } finally {
      setIsLoading(false);
      fetchInProgress.current = false;

      if (pendingFetchRef.current) {
        const next = pendingFetchRef.current;
        pendingFetchRef.current = null;
        fetchStudents(next.page, next.pageSize, next.search, next.grade, next.section, next.campus);
      } else if (shouldRetry) {
        setTimeout(() => {
          fetchStudents(page, pageSize, search, grade, section, campus, true);
        }, 800);
      }
    }
  }, [employeeData?.clientId, employeeData?.clientType?.id]);

  // Public refresh method
  const refreshStudents = useCallback(async (
    page?: number, 
    pageSize?: number, 
    search?: string,
    grade?: string,
    section?: string,
    campus?: string
  ) => {
    console.log('Refreshing students with params:', { page, pageSize, search, grade, section, campus });
    await fetchStudents(page, pageSize, search, grade, section, campus);
  }, [fetchStudents]);
  
  // Fetch students when clientId becomes available or changes
  useEffect(() => {
    if (isUsersRoute || !isStudentDataRoute) {
      setStudents([]);
      setIsLoading(false);
      return;
    }
    console.log('StudentContext useEffect triggered, clientId:', employeeData?.clientId);
    fetchStudents();
  }, [fetchStudents, employeeData?.clientId, isUsersRoute, isStudentDataRoute]);

  const addStudent = async (student: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      // Add client_id and client_type_id to the student data
      const studentWithClientId = {
        ...student,
        client_id: employeeData?.clientId,
        client_type_id: employeeData?.clientType?.id
      };

      const { data, error } = await supabase.functions.invoke('student-management', {
        body: studentWithClientId,
        method: 'POST',
        headers: { path: 'create' }
      });

      if (error) {
        throw error;
      }

      // Update local state immediately
      setStudents(prev => [data, ...prev]);
      toast.success('Student added successfully');
      
      return data;
    } catch (error) {
      console.error('Error adding student:', error);
      toast.error(await getEdgeFunctionErrorMessage(error, 'Failed to add student'));
      throw error;
    }
  };

  const updateStudent = async (id: string, updates: Partial<Student>) => {
    try {
      // Add client_id and client_type_id to the updates if not present
      const updatesWithClientId = {
        ...updates,
        client_id: employeeData?.clientId,
        client_type_id: employeeData?.clientType?.id
      };

      const { data, error } = await supabase.functions.invoke('student-management', {
        body: updatesWithClientId,
        method: 'PUT',
        headers: { path: `update`, id }
      });

      if (error) {
        throw error;
      }

      // Update local state immediately
      setStudents(prev => 
        prev.map(student => 
          student.id === id ? data : student
        )
      );
      // toast.success('Student updated successfully');
      
      return data;
    } catch (error) {
      console.error('Error updating student:', error);
      toast.error(await getEdgeFunctionErrorMessage(error, 'Failed to update student'));
      throw error;
    }
  };

  const deleteStudent = async (id: string) => {
    try {
      // Include client_id in the delete request
      const { error } = await supabase.functions.invoke('student-management', {
        body: { 
          id,
          client_id: employeeData?.clientId
        },
        method: 'DELETE',
        headers: { path: `delete`, id }
      });

      if (error) {
        console.error('Delete error response:', error);
        throw error;
      }

      // Update local state immediately
      setStudents(prev => prev.filter(student => student.id !== id));
      toast.success('Student deleted successfully');
    } catch (error) {
      console.error('Error deleting student:', error);
      toast.error('Failed to delete student');
      throw error;
    }
  };

  const getStudent = (id: string) => {
    return students.find(student => student.id === id);
  };

  const value: StudentContextType = {
    students,
    totalStudents,
    addStudent,
    updateStudent,
    deleteStudent,
    getStudent,
    refreshStudents,
    isLoading
  };

  return (
    <StudentContext.Provider value={value}>
      {children}
    </StudentContext.Provider>
  );
};

export const useStudents = () => {
  const context = useContext(StudentContext);
  if (!context) {
    throw new Error('useStudents must be used within a StudentProvider');
  }
  return context;
};
