
import { supabase } from '@/integrations/supabase/client';
import { Student } from '@/types/student';

/**
 * Fetch all students for a specific client
 */
export const fetchStudentsByClientId = async (clientId: string): Promise<Student[]> => {
  try {
    console.log('Fetching students for client_id:', clientId);
    
    // Fetch students with joined grade and section names using foreign keys
    // Try different join syntaxes to handle various Supabase configurations
    let data: any[] | null = null;
    let error: any = null;
    
    // First try: using explicit foreign key relationship
    const query1 = supabase
      .from('students')
      .select(`
        *,
        grade_info:grades!students_grade_id_fkey(id, name),
        section_info:sections!students_section_id_fkey(id, name),
        campus_info:campuses!students_campus_id_fkey(id, name)
      `)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });
    
    const result1 = await query1;
    error = result1.error;
    data = result1.data;
    
    // If that fails, try without explicit foreign key name
    if (error) {
      console.log('First query failed, trying alternative join syntax...');
      const query2 = supabase
        .from('students')
        .select(`
          *,
          grade_info:grades(id, name),
          section_info:sections(id, name),
          campus_info:campuses(id, name)
        `)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });
      
      const result2 = await query2;
      error = result2.error;
      data = result2.data;
    }

    if (error) {
      console.error('Error fetching students:', error);
      // If foreign key join fails, try without joins as fallback
      console.log('Trying fallback query without joins...');
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('students')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (fallbackError) {
        throw new Error(`Failed to fetch students: ${fallbackError.message}`);
      }

      // Transform with fallback (use grade/section/campus text fields)
      const transformedStudents: Student[] = (fallbackData || []).map(dbStudent => ({
        id: dbStudent.id,
        studentId: dbStudent.student_id,
        name: dbStudent.name,
        grade: dbStudent.grade || '',
        section: dbStudent.section || '',
        campus: dbStudent.campus || '',
        createdAt: new Date(dbStudent.created_at),
        updatedAt: new Date(dbStudent.updated_at),
        grade_id: (dbStudent as any).grade_id || null,
        section_id: (dbStudent as any).section_id || null,
        campus_id: (dbStudent as any).campus_id || null,
        grade_name: dbStudent.grade || '',
        section_name: dbStudent.section || '',
        campus_name: dbStudent.campus || ''
      }));

      return transformedStudents;
    }

    // Transform database student data to match frontend Student type
    const transformedStudents: Student[] = (data || []).map(dbStudent => {
      // Get grade name from relation or fallback to grade field
      const gradeInfo = (dbStudent as any).grade_info;
      const gradeName = gradeInfo?.name || dbStudent.grade || '';
      
      // Get section name from relation or fallback to section field
      const sectionInfo = (dbStudent as any).section_info;
      const sectionName = sectionInfo?.name || dbStudent.section || '';
      
      // Get campus name from relation or fallback to campus field
      const campusInfo = (dbStudent as any).campus_info;
      const campusName = campusInfo?.name || dbStudent.campus || '';
      
      return {
      id: dbStudent.id,
      studentId: dbStudent.student_id,
      name: dbStudent.name,
        grade: gradeName, // Use name from grades table
        section: sectionName, // Use name from sections table
        campus: campusName, // Use name from campuses table
      createdAt: new Date(dbStudent.created_at),
        updatedAt: new Date(dbStudent.updated_at),
        grade_id: (dbStudent as any).grade_id || gradeInfo?.id || null,
        section_id: (dbStudent as any).section_id || sectionInfo?.id || null,
        campus_id: (dbStudent as any).campus_id || campusInfo?.id || null,
        grade_name: gradeName,
        section_name: sectionName,
        campus_name: campusName
      };
    });

    console.log(`Successfully fetched ${transformedStudents.length} students`);
    return transformedStudents;
  } catch (error) {
    console.error('Error in fetchStudentsByClientId:', error);
    throw error;
  }
};
