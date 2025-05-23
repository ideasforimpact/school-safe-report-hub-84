
import { Student } from '@/types/student';
import { parseExcelFile } from './utils/excelProcessingUtils';
import { validateExcelData } from './utils/excelValidationUtils';
import { processStudentData, showImportResultNotifications } from './importProcessingService';
import { toast } from 'sonner';

/**
 * Process and import students from Excel/CSV file
 * Handles both new student insertion and existing student updates
 * Uses bulk operations for better performance
 */
export const processStudentExcel = async (file: File, clientId: string | null = null): Promise<Student[]> => {
  try {
    // Check if clientId is provided
    if (!clientId) {
      toast.error('Client ID is required for student import');
      throw new Error('Client ID is required');
    }
    
    // Parse the Excel/CSV file
    const rawData = await parseExcelFile(file);
    
    // Show status message for large imports
    if (rawData.length > 100) {
      toast.info(`Processing ${rawData.length} records. This may take a moment...`);
    }
    
    // Validate the data before processing
    const validationErrors = await validateExcelData(rawData, clientId);
    if (validationErrors.length > 0) {
      toast.error(`Validation failed with ${validationErrors.length} errors`);
      console.error('Validation errors:', validationErrors);
      throw new Error('Data validation failed');
    }
    
    // Process the data and add/update students using bulk operations
    console.time('Bulk import processing');
    const result = await processStudentData(rawData, clientId);
    console.timeEnd('Bulk import processing');
    
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
export const validateStudentExcel = async (file: File, clientId: string | null = null): Promise<string[]> => {
  try {
    // Parse the Excel/CSV file
    const rawData = await parseExcelFile(file);
    
    // Validate the data
    const errors = await validateExcelData(rawData, clientId);
    return errors;
  } catch (error) {
    console.error('Error in validateStudentExcel:', error);
    throw error;
  }
};
