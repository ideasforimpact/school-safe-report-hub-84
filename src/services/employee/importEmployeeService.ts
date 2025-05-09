
import { Employee } from '@/contexts/employee/types';
import { parseExcelFile } from './utils/excelProcessingUtils';
import { processEmployeeData, showImportResultNotifications } from './importProcessingService';

/**
 * Process and import employees from Excel file
 */
export const processEmployeeExcel = async (file: File): Promise<Employee[]> => {
  try {
    // Parse the Excel file
    const rawData = await parseExcelFile(file);
    
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
