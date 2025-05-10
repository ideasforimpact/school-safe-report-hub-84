
import { Employee } from '@/contexts/employee/types';
import { ModulePermissions } from '@/contexts/auth/types';
import { parseExcelFile } from './utils/excelProcessingUtils';
import { validateExcelData } from './utils/excelValidationUtils';
import { processEmployeeData, showImportResultNotifications } from './importProcessingService';
import { validateEmployeeType, validateDepartment, validateEmploymentStatus } from './utils/employeeValidationUtils';
import { toast } from 'sonner';

/**
 * Process and import employees from Excel file
 * Handles both new employee insertion and existing employee updates
 * Uses bulk operations for better performance
 */
export const processEmployeeExcel = async (file: File): Promise<Employee[]> => {
  try {
    // Parse the Excel file
    const rawData = await parseExcelFile(file);

    // Show status message for large imports
    if (rawData.length > 100) {
      toast.info(`Processing ${rawData.length} records. This may take a moment...`);
    }
    
    // Validate the data before processing
    const validationErrors = validateExcelData(rawData);
    if (validationErrors.length > 0) {
      toast.error(`Validation failed with ${validationErrors.length} errors`);
      console.error('Validation errors:', validationErrors);
      throw new Error('Excel data validation failed');
    }
    
    // Set default module permissions for all imported employees
    const defaultModulePermissions: ModulePermissions = {
      superAdmin: false,
      incidentReporting: true, // Enable Incident Reporting by default as requested
      incidentAdmin: false,
      assessmentUser: false,
      assessmentsAdmin: false,
      employeeVerificationAdmin: false,
      grievancesAdmin: false,
      transportSafetyAdmin: true, // Enable Transport Safety Admin by default as requested
      eduSafeResourceAccess: false
    };
    
    // Add default module permissions to each employee record
    // and normalize/validate employee data fields
    const processedData = rawData.map(emp => {
      return {
        ...emp,
        employeeType: validateEmployeeType(String(emp.employeeType)),
        department: validateDepartment(String(emp.department)),
        status: validateEmploymentStatus(String(emp.status)),
        modulePermissions: defaultModulePermissions
      };
    });
    
    // Process the data and add/update employees using bulk operations
    console.time('Bulk import processing');
    const result = await processEmployeeData(processedData);
    console.timeEnd('Bulk import processing');
    
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
