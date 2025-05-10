
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

    // Create proper request body and log it before sending
    const requestBody = { employees };
    
    // Log the request body as a string to verify its content
    console.log("Request payload:", requestBody);
    console.log("Request payload stringified:", JSON.stringify(requestBody));
    
    // Use proper Supabase edge function invocation with correct body format
    const { data: response, error } = await supabase.functions.invoke('employee-management', {
      method: 'POST',
      body: requestBody, // Supabase client will automatically stringify this
      headers: {
        'Content-Type': 'application/json',
        'path': 'bulk-update'
      }
    });
    
    // Alternative approach if the above still fails
    if (error) {
      console.error('Bulk processing error:', error);
      
      // Try with a direct fetch as a fallback
      try {
        // Get the Supabase project URL correctly - don't use process.env
        const supabaseUrl = 'https://ybvxkiubnnixntghojyy.supabase.co';
        const functionUrl = `${supabaseUrl}/functions/v1/employee-management`;
        console.log("Trying direct fetch to", functionUrl);
        
        // Get the current session token properly
        const { data: sessionData } = await supabase.auth.getSession();
        const session = sessionData?.session;
        const accessToken = session?.access_token || '';
        
        const response = await fetch(functionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'path': 'bulk-update',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
          throw new Error(`Direct fetch failed with status ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Direct fetch response:', data);
        
        // Process the response
        if (data && data.success) {
          result.successCount = data.created || 0;
          result.updatedCount = data.updated || 0;
          
          if (data.employees && Array.isArray(data.employees)) {
            result.addedEmployees = data.employees.map(transformEmployeeData);
          }
          
          if (data.errors && Array.isArray(data.errors)) {
            result.errors = [...result.errors, ...data.errors];
            result.errorCount += data.errors.length;
          }
          
          return result;
        }
      } catch (fetchError) {
        console.error('Direct fetch error:', fetchError);
        throw new Error(`Bulk operation failed: ${error.message}`);
      }
    }
    
    console.log('Bulk processing result:', response);
    
    if (response && response.success) {
      // Update the result with counts from the bulk operation
      result.successCount = response.created || 0;
      result.updatedCount = response.updated || 0;
      
      if (response.employees && Array.isArray(response.employees)) {
        // Transform database employees to match frontend Employee type
        result.addedEmployees = response.employees.map(transformEmployeeData);
      }
      
      // Add any errors from the bulk operation
      if (response.errors && Array.isArray(response.errors)) {
        result.errors = [...result.errors, ...response.errors];
        result.errorCount += response.errors.length;
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
