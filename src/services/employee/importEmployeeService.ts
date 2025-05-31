
import { Employee } from '@/contexts/employee/types';
import { ModulePermissions } from '@/contexts/auth/types';
import { parseExcelFile } from './utils/excelProcessingUtils';
import { validateExcelData } from './utils/excelValidationUtils';
import { processEmployeeData, showImportResultNotifications } from './importProcessingService';
import { isValidEmployeeType, isValidDepartment, isValidStatus } from './utils/employeeValidationUtils';
import { toast } from 'sonner';
import { ModuleAccessItem } from '@/types/moduleAccess';

/**
 * Process and import employees from Excel file
 * Handles both new employee insertion and existing employee updates
 * Uses bulk operations for better performance
 * @param file The Excel file to process
 * @param clientId The client ID to associate with the imported employees
 * @param configuredModules Optional array of configured modules from Redux
 */
export const processEmployeeExcel = async (
  file: File, 
  clientId?: string,
  configuredModules?: Array<{id: string, name: string, key?: string}>
): Promise<Employee[]> => {
  try {
    // Parse the Excel file
    //console.log("Starting Excel processing for file:", file.name);
    const rawData = await parseExcelFile(file);
    //console.log("Excel data parsed successfully, records:", rawData.length);

    // Verify that we have email data in the parsed records
    const missingEmails = rawData.filter(emp => !emp.email || emp.email.trim() === '').length;
    if (missingEmails > 0) {
      console.error(`Warning: ${missingEmails} records are missing email addresses`);
      toast.warning(`${missingEmails} records are missing email addresses. Please check your Excel file.`);
    }

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
    
    // Create default module access payload based on configured modules or use Dashboard as fallback
    let defaultModuleAccessPayload: ModuleAccessItem[] = [];
    
    if (configuredModules && configuredModules.length > 0) {
      // Filter for Dashboard and other basic modules
      const basicModules = configuredModules.filter(
        module => module.name === "Dashboard" || module.name === "User"
      );
      
      if (basicModules.length > 0) {
        defaultModuleAccessPayload = basicModules.map(module => ({
          name: module.name,
          key: module.key || module.id,
          module_id: module.id,
          employeeId: '' // Will be filled in per employee
        }));
      }
      
      //console.log("Using configured modules for import:", defaultModuleAccessPayload);
    }
    
    // If no modules were found in configured modules, use the default Dashboard module
    if (defaultModuleAccessPayload.length === 0) {
      defaultModuleAccessPayload = [{
        name: "Dashboard",
        key: "user",
        module_id: "f84132f7-48e0-45f1-ad3a-59e794ac9a8d",
        employeeId: '' // Will be filled in per employee
      }];
      //console.log("Using default Dashboard module for import");
    }
    
    // Add default module permissions to each employee record
    // and normalize/validate employee data fields
    const processedData = rawData.map(emp => {
      // Generate default email if missing using firstName.lastName@example.com format
      const email = emp.email && emp.email.trim() !== '' 
        ? emp.email 
        : `${emp.firstName.toLowerCase().replace(/\s/g, '')}.${emp.lastName.toLowerCase().replace(/\s/g, '')}@example.com`;
      
      // Log generated emails for debugging
      if (!emp.email || emp.email.trim() === '') {
        console.warn(`Generated default email for ${emp.firstName} ${emp.lastName}: ${email}`);
      }
      
      // Assign module access payload with employee ID
      const moduleAccessPayload = defaultModuleAccessPayload.map(module => ({
        ...module,
        employeeId: String(emp.employeeId || '')
      }));
      
      return {
        ...emp,
        email,
        employeeType: isValidEmployeeType(String(emp.employeeType)) ? String(emp.employeeType) : 'permanent',
        department: isValidDepartment(String(emp.department)) ? String(emp.department) : 'admin',
        status: isValidStatus(String(emp.status)) ? String(emp.status) : 'active',
        modulePermissions: defaultModulePermissions,
        moduleAccessPayload, // Add module access payload
        clientId // Make sure clientId is included
      };
    });
    
    //console.log("Processed data before sending to API:", processedData);
    
    // Process the data and add/update employees using bulk operations
    console.time('Bulk import processing');
    const result = await processEmployeeData(processedData, clientId);
    console.timeEnd('Bulk import processing');
    
    // Show notifications
    showImportResultNotifications(result);
    
    return result.addedEmployees;
  } catch (error) {
    console.error('Error in processEmployeeExcel:', error);
    toast.error(`Import failed: ${(error as Error).message}`);
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
