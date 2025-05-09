
import { Employee } from '@/contexts/employee/types';
import { parseExcelFile } from './utils/excelProcessingUtils';
import { validateExcelData } from './utils/excelValidationUtils';
import { processEmployeeData, showImportResultNotifications } from './importProcessingService';
import { toast } from 'sonner';

/**
 * Process and import employees from Excel file
 */
export const processEmployeeExcel = async (file: File): Promise<Employee[]> => {
  try {
    // Parse the Excel file
    const rawData = await parseExcelFile(file);
    
    // Validate the data before processing
    const validationErrors = validateExcelData(rawData);
    if (validationErrors.length > 0) {
      toast.error(`Validation failed with ${validationErrors.length} errors`);
      console.error('Validation errors:', validationErrors);
      throw new Error('Excel data validation failed');
    }
    
    // Process the data and add employees
    const result = await processEmployeeData(rawData);
    
    // Show notifications
    showImportResultNotifications(result);
    
    return result.addedEmployees;
  } catch (error) {
    console.error('Error in processEmployeeExcel:', error);
    throw error;
  }
};

/**
 * Validate Excel file without importing
 * This function can be used to verify the data before actual import
 */
export const validateEmployeeExcel = async (file: File): Promise<string[]> => {
  try {
    // Parse the Excel file
    const rawData = await parseExcelFile(file);
    
    // Validate the data
    const errors = validateExcelData(rawData);
    return errors;
  } catch (error) {
    console.error('Error in validateEmployeeExcel:', error);
    throw error;
  }
};
