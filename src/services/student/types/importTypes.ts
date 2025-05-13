
export interface RawStudentData {
  studentId?: string;
  name?: string;
  grade?: string;
  section?: string;
  campus?: string;
  [key: string]: any;
}

export interface ImportResult {
  addedStudents: any[];
  successCount: number;
  errorCount: number;
  errors: string[];
  updatedCount: number;
}
