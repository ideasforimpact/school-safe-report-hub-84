
import { Student } from '@/types/student';
import { parseExcelFile } from './utils/excelProcessingUtils';
import { validateExcelData } from './utils/excelValidationUtils';
import { processStudentData, showImportResultNotifications } from './importProcessingService';
import { toast } from 'sonner';

/**
 * Process and import students from Excel/CSV file
 * Handles both new student insertion and existing student updates
 */
export const processStudentExcel = async (file: File): Promise<Student[]> => {
  try {
    // Parse the Excel/CSV file
    const rawData = await parseExcelFile(file);
    
    // Validate the data before processing
    const validationErrors = validateExcelData(rawData);
    if (validationErrors.length > 0) {
      toast.error(`Validation failed with ${validationErrors.length} errors`);
      console.error('Validation errors:', validationErrors);
      throw new Error('Data validation failed');
    }
    
    // Process the data and add/update students
    const result = await processStudentData(rawData);
    
    // Show notifications
    showImportResultNotifications(result);
    
    return result.addedStudents;
  } catch (error) {
    console.error('Error in processStudentExcel:', error);
    throw error;
  }
};

/**
 * Validate Excel/CSV file without importing
 * This function can be used to verify the data before actual import
 */
export const validateStudentExcel = async (file: File): Promise<string[]> => {
  try {
    // Parse the Excel/CSV file
    const rawData = await parseExcelFile(file);
    
    // Validate the data
    const errors = validateExcelData(rawData);
    return errors;
  } catch (error) {
    console.error('Error in validateStudentExcel:', error);
    throw error;
  }
};
