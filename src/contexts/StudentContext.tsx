
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

  // Fetch students from Supabase on component mount
  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Transform database response to match Student type
      const transformedData = data.map(item => ({
        ...item,
        id: item.id,
        studentId: item.student_id,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at)
      }));

      setStudents(transformedData);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to load students');
    } finally {
      setIsLoading(false);
    }
  };

  const addStudent = async (student: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const { data, error } = await supabase
        .from('students')
        .insert([{
          student_id: student.studentId,
          name: student.name,
          grade: student.grade,
          section: student.section,
          campus: student.campus
        }])
        .select();

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        // Transform the returned data to match Student type
        const newStudent = {
          ...data[0],
          id: data[0].id,
          studentId: data[0].student_id,
          createdAt: new Date(data[0].created_at),
          updatedAt: new Date(data[0].updated_at)
        };

        setStudents(prev => [newStudent, ...prev]);
      }
    } catch (error) {
      console.error('Error adding student:', error);
      throw error;
    }
  };

  const updateStudent = async (id: string, updates: Partial<Student>) => {
    try {
      // Transform updates to match database column names
      const dbUpdates: Record<string, any> = {};
      if (updates.studentId) dbUpdates.student_id = updates.studentId;
      if (updates.name) dbUpdates.name = updates.name;
      if (updates.grade) dbUpdates.grade = updates.grade;
      if (updates.section) dbUpdates.section = updates.section;
      if (updates.campus) dbUpdates.campus = updates.campus;

      const { data, error } = await supabase
        .from('students')
        .update(dbUpdates)
        .eq('id', id)
        .select();

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        // Transform the returned data to match Student type
        const updatedStudent = {
          ...data[0],
          id: data[0].id,
          studentId: data[0].student_id,
          createdAt: new Date(data[0].created_at),
          updatedAt: new Date(data[0].updated_at)
        };

        setStudents(prev => 
          prev.map(student => 
            student.id === id ? updatedStudent : student
          )
        );
      }
    } catch (error) {
      console.error('Error updating student:', error);
      throw error;
    }
  };

  const deleteStudent = async (id: string) => {
    try {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', id);

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
