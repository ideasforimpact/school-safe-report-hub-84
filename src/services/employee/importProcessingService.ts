
import { toast } from 'sonner';
import { Employee } from '@/contexts/employee/types';
import { addEmployeeToApi } from './employeeMutationService';
import { validateEmployeeType, validateDepartment, validateEmploymentStatus } from './utils/employeeValidationUtils';
import { RawEmployeeData, ImportResult } from './types/importTypes';

/**
 * Process the raw employee data from Excel and add valid employees to the system
 */
export const processEmployeeData = async (rawData: RawEmployeeData[]): Promise<ImportResult> => {
  const result: ImportResult = {
    addedEmployees: [],
    successCount: 0,
    errorCount: 0,
    errors: []
  };

  // Process each row
  for (const [index, row] of rawData.entries()) {
    try {
      // Validate and normalize employee type
      const employeeType = validateEmployeeType(row.employeeType);
      if (!employeeType) {
        result.errors.push(`Row ${index + 2}: Invalid employee type "${row.employeeType}"`);
        result.errorCount++;
        continue;
      }
      
      // Validate and normalize department
      const department = validateDepartment(row.department);
      if (!department) {
        result.errors.push(`Row ${index + 2}: Invalid department "${row.department}"`);
        result.errorCount++;
        continue;
      }
      
      // Validate and normalize status
      const status = validateEmploymentStatus(row.status);
      if (!status) {
        result.errors.push(`Row ${index + 2}: Invalid status "${row.status}"`);
        result.errorCount++;
        continue;
      }
      
      // Prepare employee data
      const employeeData = {
        employeeId: String(row.employeeId),
        firstName: String(row.firstName),
        lastName: String(row.lastName),
        email: String(row.email),
        phone: row.phone ? String(row.phone) : undefined,
        employeeType,
        department,
        joiningDate: String(row.joiningDate),
        status,
        applicationFields: {}
      };
      
      // Add employee to database
      const addedEmployee = await addEmployeeToApi(employeeData);
      result.addedEmployees.push(addedEmployee);
      result.successCount++;
    } catch (error) {
      console.error(`Error processing row ${index + 2}:`, error);
      result.errors.push(`Row ${index + 2}: ${(error as Error).message || 'Unknown error'}`);
      result.errorCount++;
    }
  }

  return result;
};

/**
 * Display appropriate toast notifications for import results
 */
export const showImportResultNotifications = (result: ImportResult): void => {
  // Show success toast
  if (result.successCount > 0) {
    toast.success(`Successfully imported ${result.successCount} employees`);
  }
  
  // Show error toasts
  if (result.errors.length > 0) {
    console.error('Import errors:', result.errors);
    if (result.errors.length <= 3) {
      result.errors.forEach(error => toast.error(error));
    } else {
      toast.error(`Failed to import ${result.errors.length} employees. Check console for details.`);
    }
  }
};
