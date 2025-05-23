
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { Student } from '@/types/student';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth';

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
  const { user, employeeData } = useAuth();

  // Get client_id from authenticated user's employee data
  const getClientId = () => {
    if (employeeData?.client_id) {
      return employeeData.client_id;
    }
    console.warn('No client_id found in employee data');
    return null;
  };

  // Fetch students using the edge function on component mount
  useEffect(() => {
    if (user && employeeData) {
      fetchStudents();
    }
  }, [user, employeeData]);

  const fetchStudents = async () => {
    const clientId = getClientId();
    if (!clientId) {
      console.error('Cannot fetch students: No client_id available');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('student-management', {
        method: 'GET',
        headers: { 
          path: 'list',
          'client-id': clientId
        }
      });

      if (error) {
        throw error;
      }

      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to load students');
    } finally {
      setIsLoading(false);
    }
  };

  const addStudent = async (student: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>) => {
    const clientId = getClientId();
    if (!clientId) {
      throw new Error('Cannot add student: No client_id available');
    }

    try {
      const { data, error } = await supabase.functions.invoke('student-management', {
        body: { ...student, client_id: clientId },
        method: 'POST',
        headers: { 
          path: 'create',
          'client-id': clientId
        }
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
    const clientId = getClientId();
    if (!clientId) {
      throw new Error('Cannot update student: No client_id available');
    }

    try {
      const { data, error } = await supabase.functions.invoke('student-management', {
        body: { ...updates, client_id: clientId },
        method: 'PUT',
        headers: { 
          path: `update`, 
          id,
          'client-id': clientId
        }
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
    const clientId = getClientId();
    if (!clientId) {
      throw new Error('Cannot delete student: No client_id available');
    }

    try {
      const { error } = await supabase.functions.invoke('student-management', {
        body: { id, client_id: clientId },
        method: 'DELETE',
        headers: { 
          path: `delete`, 
          id,
          'client-id': clientId
        }
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
