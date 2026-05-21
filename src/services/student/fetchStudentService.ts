import { supabase } from '@/integrations/supabase/client';
import { Student, StudentListResponse } from '@/types/student';

/**
 * Fetch students for a specific client with pagination
 */
export const fetchStudentsByClientId = async (
  clientId: string, 
  page: number = 1, 
  pageSize: number = 10,
  search?: string,
  grade?: string,
  section?: string,
  campus?: string
): Promise<StudentListResponse> => {
  try {
    console.log(`Fetching students for client_id ${clientId}, page ${page}, size ${pageSize}, filters:`, { search, grade, section, campus });
    
    // Build query parameters
    const queryParams = new URLSearchParams();
    queryParams.append('page', page.toString());
    queryParams.append('pageSize', pageSize.toString());
    if (search) queryParams.append('search', search);

    const { data, error } = await supabase.functions.invoke('student-management', {
      body: { 
        client_id: clientId,
        page,
        pageSize,
        search,
        grade,
        section,
        campus
      },
      headers: { path: 'list' },
      method: 'POST'
    });

    if (error) {
      console.error('Error fetching students via edge function:', error);
      throw new Error(`Failed to fetch students: ${error.message}`);
    }

    const { students = [], totalCount = 0 } = data || {};

    // Transform database student data to match frontend Student type
    const transformedStudents: Student[] = students.map((dbStudent: any) => ({
      id: dbStudent.id,
      studentId: dbStudent.studentId || dbStudent.student_id,
      name: dbStudent.name,
      grade: dbStudent.grade_name || dbStudent.grade || '',
      section: dbStudent.section_name || dbStudent.section || '',
      campus: dbStudent.campus_name || dbStudent.campus || '',
      createdAt: new Date(dbStudent.createdAt || dbStudent.created_at),
      updatedAt: new Date(dbStudent.updatedAt || dbStudent.updated_at),
      grade_id: dbStudent.grade_id || null,
      section_id: dbStudent.section_id || null,
      campus_id: dbStudent.campus_id || null,
      grade_name: dbStudent.grade_name || dbStudent.grade || '',
      section_name: dbStudent.section_name || dbStudent.section || '',
      campus_name: dbStudent.campus_name || dbStudent.campus || ''
    }));

    console.log(`Successfully fetched ${transformedStudents.length} students (Total: ${totalCount}) via edge function`);
    return {
      students: transformedStudents,
      totalCount: totalCount
    };
  } catch (error) {
    console.error('Error in fetchStudentsByClientId:', error);
    throw error;
  }
};
