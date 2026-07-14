import type { Database } from '@/integrations/supabase/types';

export interface RawStudentData {
  studentId?: string;
  name?: string;
  grade?: string;
  section?: string;
  campus?: string;
  [key: string]: unknown;
}

export interface ImportResult {
  addedStudents: Database['public']['Tables']['students']['Row'][];
  successCount: number;
  errorCount: number;
  errors: string[];
  updatedCount: number;
}
