import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { Student } from '@/types/student';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth';
import { fetchStudentsByClientId } from '@/services/student/fetchStudentService';

interface StudentContextType {
  students: Student[];
  addStudent: (student: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateStudent: (id: string, student: Partial<Student>) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;
  getStudent: (id: string) => Student | undefined;
  isLoading: boolean;
}

const StudentContext = createContext<StudentContextType | undefined>(undefined);

export const StudentProvider = ({ children }: { children: ReactNode }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { employeeData } = useAuth();

  // Fetch students using the new fetch service on component mount
  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    if (!employeeData?.clientId) {
      //console.log('No client ID available, skipping student fetch');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const studentData = await fetchStudentsByClientId(employeeData.clientId);
      setStudents(studentData);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to load students');
    } finally {
      setIsLoading(false);
    }
  };

  const addStudent = async (student: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      // Add client_id to the student data
      const studentWithClientId = {
        ...student,
        client_id: employeeData?.clientId
      };

      const { data, error } = await supabase.functions.invoke('student-management', {
        body: studentWithClientId,
        method: 'POST',
        headers: { path: 'create' }
      });

      if (error) {
        throw error;
      }

      setStudents(prev => [data, ...prev]);
      return data;
    } catch (error) {
      console.error('Error adding student:', error);
      throw error;
    }
  };

  const updateStudent = async (id: string, updates: Partial<Student>) => {
    try {
      // Add client_id to the updates if it's not present
      const updatesWithClientId = {
        ...updates,
        client_id: employeeData?.clientId
      };

      const { data, error } = await supabase.functions.invoke('student-management', {
        body: updatesWithClientId,
        method: 'PUT',
        headers: { path: `update`, id }
      });

      if (error) {
        throw error;
      }

      setStudents(prev => 
        prev.map(student => 
          student.id === id ? data : student
        )
      );
      return data;
    } catch (error) {
      console.error('Error updating student:', error);
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

      setStudents(prev => prev.filter(student => student.id !== id));
    } catch (error) {
      console.error('Error deleting student:', error);
      throw error;
    }
  };

  const getStudent = (id: string) => {
    return students.find(student => student.id === id);
  };

  const value: StudentContextType = {
    students,
    addStudent,
    updateStudent,
    deleteStudent,
    getStudent,
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
