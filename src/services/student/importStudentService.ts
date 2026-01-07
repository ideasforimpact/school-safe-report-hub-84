
import { Student } from '@/types/student';
import { parseStudentFile } from './utils/excelProcessingUtils';
import { validateExcelData } from './utils/excelValidationUtils';
import { processStudentData, showImportResultNotifications } from './importProcessingService';
import { toast } from 'sonner';

/**
 * Process and import students from Excel/CSV file
 * Handles both new student insertion and existing student updates
 * Uses bulk operations for better performance
 * Now includes client-specific duplicate checking
 * @param file - The Excel/CSV file to import
 * @param clientId - The client ID for the import
 * @param errorRowNumbers - Optional array of row numbers (1-indexed, including header) to exclude from import
 */
export const processStudentExcel = async (file: File, clientId?: string, errorRowNumbers?: number[]): Promise<Student[]> => {
  try {
    if (!clientId) {
      throw new Error('Client information not available. Please ensure you are logged in properly.');
    }

    console.log('Starting import process for client:', clientId);

    // Parse the file (Excel or CSV)
    const rawData = await parseStudentFile(file);
    console.log('Parsed data:', rawData.length, 'records');
    
    // Filter out error rows if provided
    // Note: errorRowNumbers are 1-indexed (including header), so row 2 = first data row (index 0)
    let filteredData = rawData;
    if (errorRowNumbers && errorRowNumbers.length > 0) {
      // Convert 1-indexed row numbers (with header) to 0-indexed array indices
      const errorIndices = new Set(errorRowNumbers.map(rowNum => rowNum - 2)); // -2 because header is row 1, first data is row 2
      filteredData = rawData.filter((_, index) => !errorIndices.has(index));
      console.log(`Filtered out ${rawData.length - filteredData.length} error rows. Processing ${filteredData.length} valid records.`);
    }
    
    // Show status message for large imports
    if (filteredData.length > 100) {
      toast.info(`Processing ${filteredData.length} records. This may take a moment...`);
    }
    
    // If error rows were provided, skip validation (already done) and proceed directly to import
    if (errorRowNumbers && errorRowNumbers.length > 0) {
      console.log('Skipping validation - error rows already identified. Processing valid records...');
      
      // Process the data and add/update students using bulk operations
      console.time('Bulk import processing');
      const result = await processStudentData(filteredData, clientId);
      console.timeEnd('Bulk import processing');
      
      console.log('Import completed:', result);
      
      // Show notifications
      showImportResultNotifications(result);
      
      return result.addedStudents;
    }
    
    // Otherwise, validate the data before processing (includes client-specific duplicate checking)
    const validationErrors = await validateExcelData(filteredData, clientId);
    if (validationErrors.length > 0) {
      toast.error(`Validation failed with ${validationErrors.length} errors`);
      console.error('Validation errors:', validationErrors);
      throw new Error('Data validation failed');
    }
    
    console.log('Validation passed, processing student data...');
    
    // Process the data and add/update students using bulk operations
    console.time('Bulk import processing');
    const result = await processStudentData(filteredData, clientId);
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

    // Parse the file (Excel or CSV)
    const rawData = await parseStudentFile(file);
    
    // Validate the data (includes client-specific duplicate checking)
    const errors = await validateExcelData(rawData, clientId);
    return errors;
  } catch (error) {
    console.error('Error in validateStudentExcel:', error);
    throw error;
  }
};
