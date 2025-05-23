
import { toast } from 'sonner';
import { Student } from '@/types/student';
import { RawStudentData, ImportResult } from './types/importTypes';
import { supabase } from '@/integrations/supabase/client';

/**
 * Process the raw student data from Excel/CSV and add valid students to the system
 * Handles both new student insertion and existing student updates
 */
export const processStudentData = async (rawData: RawStudentData[], clientId: string): Promise<ImportResult> => {
  const result: ImportResult = {
    addedStudents: [],
    successCount: 0,
    errorCount: 0,
    errors: [],
    updatedCount: 0
  };

  console.log("Processing student data for client:", clientId, "Data:", rawData);
  
  try {
    // Use the edge function for bulk processing with client_id
    const { data: processedResult, error } = await supabase.functions.invoke('student-management', {
      method: 'POST',
      headers: { 
        path: 'bulk-import',
        'client-id': clientId
      },
      body: {
        students: rawData,
        client_id: clientId
      }
    });

    if (error) {
      console.error('Error in bulk import:', error);
      throw new Error(`Bulk import failed: ${error.message}`);
    }

    if (processedResult) {
      result.addedStudents = processedResult.addedStudents || [];
      result.successCount = processedResult.successCount || 0;
      result.updatedCount = processedResult.updatedCount || 0;
      result.errorCount = processedResult.errorCount || 0;
      result.errors = processedResult.errors || [];
    }

    return result;
  } catch (error) {
    console.error('Error in bulk student processing:', error);
    result.errors.push(`Bulk operation error: ${(error as Error).message || 'Unknown error'}`);
    result.errorCount += 1;
    return result;
  }
};

/**
 * Display appropriate toast notifications for import results
 */
export const showImportResultNotifications = (result: ImportResult): void => {
  // Show success toast for new students
  if (result.successCount > 0) {
    toast.success(`Successfully imported ${result.successCount} new students`);
  }
  
  // Show success toast for updated students
  if (result.updatedCount > 0) {
    toast.success(`Successfully updated ${result.updatedCount} existing students`);
  }
  
  // Show error toasts
  if (result.errors.length > 0) {
    console.error('Import errors:', result.errors);
    if (result.errors.length <= 3) {
      result.errors.forEach(error => toast.error(error));
    } else {
      toast.error(`Failed to process ${result.errors.length} student records. Check console for details.`);
    }
  }
};
