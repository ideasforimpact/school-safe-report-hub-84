
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

    // Show status message for large imports
    if (rawData.length > 100) {
      toast.info(`Processing ${rawData.length} records. This may take a moment...`);
    }
    
    // Validate the data before processing
    const { errors, warnings } = await validateExcelData(rawData, clientId);
    if (errors.length > 0) {
      console.error('Import validation errors:', errors);
      toast.error(`Validation failed: ${errors.slice(0, 3).join('; ')}${errors.length > 3 ? ` and ${errors.length - 3} more` : ''}`);
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

    const processedData = rawData.map(emp => {
      const importedNamesForEmp = new Set(
        (emp.moduleAccessPayload || [])
          .map(v => v.trim().toLowerCase())
      );

      const matchedModulesForEmp: iModule[] =
        configuredModules?.filter(m =>
          importedNamesForEmp.has(m.name.trim().toLowerCase())
        ) || [];

      const moduleAccessPayload: ModuleAccessItem[] = matchedModulesForEmp.map(module => ({
        name: module.name,
        key: module.key || module.id,
        module_id: module.id,
        enabled: true,
        employeeId: String(emp.employeeId)
      }));
      // Preserve the email from the uploaded file; do not auto-generate one
      const email = emp.email?.trim() || '';
      return {
        ...emp,
        email,
        employeeType: (emp.employeeType != null && String(emp.employeeType).trim() !== '' && isValidEmployeeType(String(emp.employeeType)))
          ? String(emp.employeeType)
          : undefined,
        department: (emp.department != null && String(emp.department).trim() !== '' && isValidDepartment(String(emp.department)))
          ? String(emp.department)
          : undefined,
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
export const validateEmployeeExcel = async (
  file: File,
  clientId?: string
): Promise<{ errors: string[]; warnings: string[] }> => {
  const rawData = await parseEmployeeFile(file);
  return validateExcelData(rawData, clientId);
};
