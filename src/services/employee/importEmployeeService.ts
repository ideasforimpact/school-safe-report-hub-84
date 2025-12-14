
import { Employee } from '@/contexts/employee/types';
import { ModulePermissions } from '@/contexts/auth/types';
import { parseEmployeeFile } from './utils/excelProcessingUtils';
import { validateExcelData } from './utils/excelValidationUtils';
import { processEmployeeData, showImportResultNotifications } from './importProcessingService';
import { isValidEmployeeType, isValidDepartment, isValidStatus } from './utils/employeeValidationUtils';
import { toast } from 'sonner';
import { ModuleAccessItem } from '@/types/moduleAccess';
import { iModule } from '@/pages/UserManagement';

/**
 * Process and import employees from Excel or CSV file
 * Handles both new employee insertion and existing employee updates
 * Uses bulk operations for better performance
 * @param file The Excel or CSV file to process
 * @param clientId The client ID to associate with the imported employees
 * @param configuredModules Optional array of configured modules from Redux
 */
export const processEmployeeExcel = async (
  file: File,
  clientId?: string,
  configuredModules?: iModule[]
): Promise<Employee[]> => {
  try {
    // Parse the file (Excel or CSV)
    console.log("Starting file processing for file:", file.name);
    const rawData = await parseEmployeeFile(file);
    console.log("File data parsed successfully, records:", rawData.length);

    // Verify that we have email data in the parsed records
    const missingEmails = rawData.filter(emp => !emp.email || emp.email.trim() === '').length;
    if (missingEmails > 0) {
      console.error(`Warning: ${missingEmails} records are missing email addresses`);
      toast.warning(`${missingEmails} records are missing email addresses. Please check your file.`);
    }

    // Show status message for large imports
    if (rawData.length > 100) {
      toast.info(`Processing ${rawData.length} records. This may take a moment...`);
    }
    
    // Validate the data before processing
    const validationErrors = await validateExcelData(rawData, clientId);
    if (validationErrors.length > 0) {
      toast.error(`Validation failed with ${validationErrors.length} errors`);
      console.error('Validation errors:', validationErrors);
      throw new Error('File data validation failed');
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

    const importedModuleNames = new Set(
      rawData
        .map(r => r.moduleAccessPayload?.trim().toLowerCase())
        .filter(Boolean)
    );

    let matchedModules: iModule[] = [];

    if (configuredModules && configuredModules.length > 0) {
      matchedModules = configuredModules.filter(m =>
        importedModuleNames.has(m.name.trim().toLowerCase())
      );
    }

    let defaultModuleAccessPayload: Omit<ModuleAccessItem, "employeeId">[] =
      matchedModules.map(module => ({
        name: module.name,
        key: module.key || module.id,
        module_id: module.id,
        enabled: true
      }));
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
        employeeId: String(emp.employeeId)
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
    
    console.log("Processed data before sending to API:", processedData);
    
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
 * Validate Excel or CSV file without importing
 * This function can be used to verify the data before actual import
 */
export const validateEmployeeExcel = async (file: File, clientId?: string): Promise<string[]> => {
  try {
    // Parse the file (Excel or CSV)
    const rawData = await parseEmployeeFile(file);
    
    // Validate the data with client-scoped checks
    const errors = await validateExcelData(rawData, clientId);
    return errors;
  } catch (error) {
    console.error('Error in validateEmployeeExcel:', error);
    throw error;
  }
};
