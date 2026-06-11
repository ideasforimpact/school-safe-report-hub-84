
export interface Student {
  id: string;
  studentId: string;
  name: string;
  grade: string; // Keep for backward compatibility, but will be populated from grade relation
  section: string; // Keep for backward compatibility, but will be populated from section relation
  campus: string; // Keep for backward compatibility, but will be populated from campus relation
  createdAt: Date;
  updatedAt: Date;
  // Foreign key IDs
  grade_id?: string | null;
  section_id?: string | null;
  campus_id?: string | null;
  // Related table names (from joins)
  grade_name?: string;
  section_name?: string;
  campus_name?: string;
}
