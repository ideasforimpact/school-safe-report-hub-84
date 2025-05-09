
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { Student } from '@/types/student';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

  // Fetch students using the edge function on component mount
  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('student-management', {
        body: {},
        method: 'GET',
        path: 'list'
      });

      if (error) {
        throw error;
      }

      setStudents(data);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to load students');
    } finally {
      setIsLoading(false);
    }
  };

  const addStudent = async (student: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const { data, error } = await supabase.functions.invoke('student-management', {
        body: student,
        method: 'POST',
        path: 'create'
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
      const { data, error } = await supabase.functions.invoke('student-management', {
        body: updates,
        method: 'PUT',
        path: `update?id=${id}`
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
      const { error } = await supabase.functions.invoke('student-management', {
        body: {},
        method: 'DELETE',
        path: `delete?id=${id}`
      });

      if (error) {
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
