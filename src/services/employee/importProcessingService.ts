
import { toast } from 'sonner';
import { Employee } from '@/contexts/employee/types';
import { addEmployeeToApi, updateEmployeeInApi } from './employeeApiService';
import { validateEmployeeType, validateDepartment, validateEmploymentStatus } from './utils/employeeValidationUtils';
import { RawEmployeeData, ImportResult } from './types/importTypes';
import { supabase } from '@/integrations/supabase/client';

/**
 * Process the raw employee data from Excel and add valid employees to the system
 * Handles both new employee insertion and existing employee updates
 */
export const processEmployeeData = async (rawData: RawEmployeeData[]): Promise<ImportResult> => {
  const result: ImportResult = {
    addedEmployees: [],
    successCount: 0,
    errorCount: 0,
    errors: [],
    updatedCount: 0 // Counter for tracking updated employees
  };

  console.log("Processing employee data:", rawData);

  // Process each row
  for (const [index, row] of rawData.entries()) {
    try {
      // Ensure all required fields are present and not empty
      const requiredFields = ['employeeId', 'firstName', 'lastName', 'email', 'employeeType', 'department', 'joiningDate', 'status'];
      const missingFields = requiredFields.filter(field => {
        const value = row[field];
        return value === undefined || value === null || 
              (typeof value === 'string' && value.trim() === '') ||
              value === 0;
      });
      
      if (missingFields.length > 0) {
        result.errors.push(`Row ${index + 2}: Missing required fields: ${missingFields.join(', ')}`);
        result.errorCount++;
        continue;
      }
      
      // Validate and normalize employee type
      const employeeType = validateEmployeeType(String(row.employeeType));
      if (!employeeType) {
        result.errors.push(`Row ${index + 2}: Invalid employee type "${row.employeeType}"`);
        result.errorCount++;
        continue;
      }
      
      // Validate and normalize department
      const department = validateDepartment(String(row.department));
      if (!department) {
        result.errors.push(`Row ${index + 2}: Invalid department "${row.department}"`);
        result.errorCount++;
        continue;
      }
      
      // Validate and normalize status
      const status = validateEmploymentStatus(String(row.status));
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
      
      // Check if employee already exists by employeeId only
      const { data: existingEmployeeById, error: idError } = await supabase
        .from('employees')
        .select('id')
        .eq('employee_id', employeeData.employeeId)
        .maybeSingle();
        
      if (idError) {
        console.error(`Error checking for existing employee by ID: ${idError.message}`);
        result.errors.push(`Row ${index + 2}: Database error: ${idError.message}`);
        result.errorCount++;
        continue;
      }
      
      console.log(`Row ${index + 2}: Employee ${employeeData.employeeId} exists:`, !!existingEmployeeById);
      
      if (existingEmployeeById) {
        // Update existing employee
        try {
          const updatedEmployee = await updateEmployeeInApi(existingEmployeeById.id, employeeData);
          result.addedEmployees.push(updatedEmployee);
          result.updatedCount++;
          console.log(`Row ${index + 2}: Updated employee:`, updatedEmployee.id);
        } catch (updateError) {
          console.error(`Error updating employee ${employeeData.employeeId}:`, updateError);
          result.errors.push(`Row ${index + 2}: Failed to update - ${(updateError as Error).message || 'Unknown error'}`);
          result.errorCount++;
        }
      } else {
        // Add new employee
        try {
          const addedEmployee = await addEmployeeToApi(employeeData);
          result.addedEmployees.push(addedEmployee);
          result.successCount++;
          console.log(`Row ${index + 2}: Added new employee:`, addedEmployee.id);
        } catch (addError) {
          console.error(`Error adding employee ${employeeData.employeeId}:`, addError);
          result.errors.push(`Row ${index + 2}: Failed to add - ${(addError as Error).message || 'Unknown error'}`);
          result.errorCount++;
        }
      }
    } catch (error) {
      console.error(`Error processing row ${index + 2}:`, error);
      result.errors.push(`Row ${index + 2}: ${(error as Error).message || 'Unknown error'}`);
      result.errorCount++;
    }
  }

  console.log("Import result:", result);
  return result;
};

/**
 * Display appropriate toast notifications for import results
 */
export const showImportResultNotifications = (result: ImportResult): void => {
  // Show success toast for new employees
  if (result.successCount > 0) {
    toast.success(`Successfully imported ${result.successCount} new employees`);
  }
  
  // Show success toast for updated employees
  if (result.updatedCount > 0) {
    toast.success(`Successfully updated ${result.updatedCount} existing employees`);
  }
  
  // Show error toasts
  if (result.errors.length > 0) {
    console.error('Import errors:', result.errors);
    if (result.errors.length <= 3) {
      result.errors.forEach(error => toast.error(error));
    } else {
      toast.error(`Failed to process ${result.errors.length} employee records. Check console for details.`);
    }
  }
};
