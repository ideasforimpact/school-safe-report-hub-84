
import { Student } from '@/types/student';
import { parseExcelFile } from './utils/excelProcessingUtils';
import { validateExcelData } from './utils/excelValidationUtils';
import { processStudentData, showImportResultNotifications } from './importProcessingService';
import { toast } from 'sonner';

/**
 * Process and import students from Excel/CSV file
 * Handles both new student insertion and existing student updates
 * Uses bulk operations for better performance
 * Now includes client-specific duplicate checking
 */
export const processStudentExcel = async (file: File, clientId?: string): Promise<Student[]> => {
  try {
    if (!clientId) {
      throw new Error('Client information not available. Please ensure you are logged in properly.');
    }

    console.log('Starting import process for client:', clientId);

    // Parse the Excel/CSV file
    const rawData = await parseExcelFile(file);
    console.log('Parsed data:', rawData.length, 'records');
    
    // Show status message for large imports
    if (rawData.length > 100) {
      toast.info(`Processing ${rawData.length} records. This may take a moment...`);
    }
    
    // Validate the data before processing (includes client-specific duplicate checking)
    const validationErrors = await validateExcelData(rawData, clientId);
    if (validationErrors.length > 0) {
      toast.error(`Validation failed with ${validationErrors.length} errors`);
      console.error('Validation errors:', validationErrors);
      throw new Error('Data validation failed');
    }
    
    console.log('Validation passed, processing student data...');
    
    // Process the data and add/update students using bulk operations
    console.time('Bulk import processing');
    const result = await processStudentData(rawData, clientId);
    console.timeEnd('Bulk import processing');
    
    console.log('Import completed:', result);
    
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
 * Now includes client-specific duplicate checking
 */
export const validateStudentExcel = async (file: File, clientId?: string): Promise<string[]> => {
  try {
    if (!clientId) {
      return ['Client information not available. Please ensure you are logged in properly.'];
    }

    // Parse the Excel/CSV file
    const rawData = await parseExcelFile(file);
    
    // Validate the data (includes client-specific duplicate checking)
    const errors = await validateExcelData(rawData, clientId);
    return errors;
  } catch (error) {
    console.error('Error in validateStudentExcel:', error);
    throw error;
  }
};
