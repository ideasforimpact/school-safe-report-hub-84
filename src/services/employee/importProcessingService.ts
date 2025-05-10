
import { toast } from 'sonner';
import { Employee } from '@/contexts/employee/types';
import { ModulePermissions } from '@/contexts/auth/types';
import { RawEmployeeData, ImportResult } from './types/importTypes';
import { supabase } from '@/integrations/supabase/client';

/**
 * Process the raw employee data from Excel and add valid employees to the system
 * Uses bulk operations for better performance with large imports
 */
export const processEmployeeData = async (rawData: RawEmployeeData[]): Promise<ImportResult> => {
  const result: ImportResult = {
    addedEmployees: [],
    successCount: 0,
    errorCount: 0,
    errors: [],
    updatedCount: 0
  };

  console.log("Processing employee data:", rawData);
  
  try {
    // Prepare employee data
    const employees = rawData.map((row, index) => {
      try {
        // Ensure all required fields are present
        const requiredFields = ['employeeId', 'firstName', 'lastName', 'email', 'employeeType', 'department', 'joiningDate', 'status'];
        const missingFields = requiredFields.filter(field => {
          const value = row[field];
          return value === undefined || value === null || 
                (typeof value === 'string' && value.trim() === '') ||
                value === 0;
        });
        
        if (missingFields.length > 0) {
          throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
        }
        
        // Set default module permissions for each employee
        const modulePermissions: ModulePermissions = {
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
        
        // Return the employee data, preserving original values from Excel
        return {
          employeeId: String(row.employeeId),
          firstName: String(row.firstName),
          lastName: String(row.lastName),
          email: String(row.email),
          phone: row.phone ? String(row.phone) : undefined,
          employeeType: String(row.employeeType),
          department: String(row.department),
          joiningDate: String(row.joiningDate),
          status: String(row.status),
          modulePermissions: modulePermissions
        };
      } catch (error) {
        console.error(`Error processing row ${index + 2}:`, error);
        result.errors.push(`Row ${index + 2}: ${(error as Error).message || 'Unknown error'}`);
        result.errorCount++;
        return null;
      }
    }).filter(Boolean); // Remove any null entries from errors
    
    // If there are no valid employees after initial processing, return early
    if (employees.length === 0) {
      return result;
    }
    
    console.log(`Sending ${employees.length} employees for bulk processing`);
    
    // Process all employees in a single bulk operation using the edge function
    // Make sure to include the Authorization header explicitly
    const { data, error } = await supabase.functions.invoke('employee-management', {
      method: 'POST',
      body: { employees },
      headers: { 
        path: 'bulk-update',
        // Ensure the authorization header is included correctly
        // Supabase will automatically add the Authorization header with the current session
      }
    });
    
    if (error) {
      console.error('Bulk processing error:', error);
      throw new Error(`Bulk operation failed: ${error.message}`);
    }
    
    console.log('Bulk processing result:', data);
    
    if (data.success) {
      // Update the result with counts from the bulk operation
      result.successCount = data.created || 0;
      result.updatedCount = data.updated || 0;
      
      if (data.employees && Array.isArray(data.employees)) {
        // Transform database employees to match frontend Employee type
        result.addedEmployees = data.employees.map(transformEmployeeData);
      }
      
      // Add any errors from the bulk operation
      if (data.errors && Array.isArray(data.errors)) {
        result.errors = [...result.errors, ...data.errors];
        result.errorCount += data.errors.length;
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error in bulk employee processing:', error);
    result.errors.push(`Bulk operation error: ${(error as Error).message || 'Unknown error'}`);
    result.errorCount += 1;
    return result;
  }
};

/**
 * Transform database employee data to match frontend Employee type
 */
const transformEmployeeData = (dbEmployee: any): Employee => {
  // Default module permissions that will be applied if not provided in the database record
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

  return {
    id: dbEmployee.id,
    employeeId: dbEmployee.employee_id,
    firstName: dbEmployee.first_name,
    lastName: dbEmployee.last_name,
    email: dbEmployee.email,
    employeeType: dbEmployee.employee_type,
    department: dbEmployee.department,
    joiningDate: dbEmployee.joining_date,
    status: dbEmployee.status,
    modulePermissions: dbEmployee.modulePermissions || defaultModulePermissions,
    createdAt: dbEmployee.created_at,
    updatedAt: dbEmployee.updated_at
  };
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
