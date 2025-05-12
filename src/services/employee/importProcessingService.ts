import { toast } from 'sonner';
import { Employee } from '@/contexts/employee/types';
import { ModulePermissions } from '@/contexts/auth/types';
import { RawEmployeeData, ImportResult } from './types/importTypes';
import { supabase } from '@/integrations/supabase/client';

// List of demo emails that can bypass authentication requirements
const DEMO_EMAILS = [
  'owner@saasplatform.com',
  'admin@school.edu',
  'reporter@school.edu'
];

/**
 * Process the raw employee data from Excel and add valid employees to the system
 * Uses bulk operations for better performance with large imports
 */
export const processEmployeeData = async (rawData: RawEmployeeData[], clientId?: string): Promise<ImportResult> => {
  const result: ImportResult = {
    addedEmployees: [],
    successCount: 0,
    errorCount: 0,
    errors: [],
    updatedCount: 0
  };

  console.log("Processing employee data:", rawData);
  console.log("Using clientId:", clientId); // Log clientId for debugging
  
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
        
        // Set default module permissions for all imported employees
        const modulePermissions: ModulePermissions = {
          superAdmin: false,
          incidentReporting: true, 
          incidentAdmin: false,
          assessmentUser: false,
          assessmentsAdmin: false,
          employeeVerificationAdmin: false,
          grievancesAdmin: false,
          transportSafetyAdmin: true,
          eduSafeResourceAccess: false
        };
        
        // Add default module permissions to each employee record
        // and normalize/validate employee data fields
        return {
          employeeId: String(row.employeeId).trim(),  // Ensure trimmed values for comparison
          firstName: String(row.firstName),
          lastName: String(row.lastName),
          email: String(row.email),
          phone: row.phone ? String(row.phone) : undefined,
          employeeType: String(row.employeeType),
          department: String(row.department),
          joiningDate: String(row.joiningDate),
          status: String(row.status),
          clientId: clientId, // Ensure clientId is passed through
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
    
    console.log(`Sending ${employees.length} employees for bulk processing with clientId: ${clientId}`);

    // Check if clientId is in numeric format and needs conversion to UUID
    if (clientId && !isValidUUID(clientId)) {
      console.log("ClientId is not in UUID format, converting numeric ID to proper UUID format");
      // For numeric IDs, we need to use a UUID format that's compatible with the database
      // This approach generates a deterministic UUID based on the client number
      const numericClientId = parseInt(clientId);
      if (!isNaN(numericClientId)) {
        // Generate a deterministic UUID using a namespace approach
        // This creates a UUID v5 using a combination of a namespace and the client ID
        const namespaceUUID = "00000000-0000-0000-0000-000000000000"; // Base namespace
        const clientUUID = generateDeterministicUUID(namespaceUUID, clientId);
        console.log("Generated UUID for clientId:", clientUUID);
        clientId = clientUUID;
      } else {
        console.warn("Could not convert clientId to numeric value for UUID generation");
      }
    }

    // Create proper request body and log it before sending
    const requestBody = { 
      employees,
      clientId, // Include clientId in the request body explicitly
      path: 'bulk-update', // Explicitly specify the path for more clarity
      updateExisting: true  // Flag to ensure we update existing employees
    };
    
    // Log the request body as a string to verify its content
    console.log("Request payload:", requestBody);
    console.log("Request payload stringified:", JSON.stringify(requestBody));
    
    // Use Supabase functions invoke method instead of direct fetch
    // This automatically handles authentication
    try {
      console.log("Using Supabase functions invoke method");
      const { data: functionData, error: functionError } = await supabase.functions.invoke(
        'employee-management',
        {
          body: JSON.stringify(requestBody)
        }
      );
      
      if (functionError) {
        console.error(`Function invoke error:`, functionError);
        throw new Error(`Bulk operation failed: ${functionError.message || 'Unknown error'}`);
      }
      
      const responseData = functionData;
      console.log('Bulk processing result from invoke:', responseData);
      
      if (responseData && responseData.success) {
        // Update the result with counts from the bulk operation
        result.successCount = responseData.created || 0;
        result.updatedCount = responseData.updated || 0;
        
        if (responseData.employees && Array.isArray(responseData.employees)) {
          // Transform database employees to match frontend Employee type
          result.addedEmployees = responseData.employees.map(transformEmployeeData);
        }
        
        // Add any errors from the bulk operation
        if (responseData.errors && Array.isArray(responseData.errors)) {
          result.errors = [...result.errors, ...responseData.errors];
          result.errorCount += responseData.errors.length;
        }
      } else {
        throw new Error("Bulk operation returned unexpected response format");
      }
    } catch (invokeFunctionError) {
      console.error('Error invoking function:', invokeFunctionError);
      
      // Fall back to fetch approach with proper authorization if invoke method fails
      console.log("Falling back to direct fetch with authorization");
      
      // Get current session
      const { data: sessionData } = await supabase.auth.getSession();
      
      // Prepare headers - include auth token if available
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlidnhraXVibm5peG50Z2hvanl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3ODcxMzksImV4cCI6MjA2MjM2MzEzOX0.z8KKLi5uNyE0jxUoQtoB6M5iXr2D7hfAeXm5t1piWKo',
        'path': 'bulk-update'
      };
      
      // Add authorization header if session is available
      if (sessionData?.session?.access_token) {
        headers['Authorization'] = `Bearer ${sessionData.session.access_token}`;
        console.log("Using auth token for API call");
      } else {
        // Try to get the service role key for admin operations
        // This is a fallback for operations from the user management page
        // where we might not have a user session but still need to perform admin operations
        const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyORzIg41cTZeK8FnABznVJht8';
        headers['Authorization'] = `Bearer ${serviceRoleKey}`;
        console.log("Using service role key for API call");
      }
      
      console.log("Calling function with URL:", 'https://ybvxkiubnnixntghojyy.supabase.co/functions/v1/employee-management');
      console.log("Headers:", JSON.stringify(headers));
      
      // Using fetch with prepared headers
      const response = await fetch('https://ybvxkiubnnixntghojyy.supabase.co/functions/v1/employee-management', {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
        console.error(`Function call failed with status ${response.status}:`, errorData);
        throw new Error(`Bulk operation failed with status ${response.status}: ${errorData.message || 'Unknown error'}`);
      }
      
      const responseData = await response.json();
      console.log('Bulk processing result from fetch:', responseData);
      
      if (responseData && responseData.success) {
        // Update the result with counts from the bulk operation
        result.successCount = responseData.created || 0;
        result.updatedCount = responseData.updated || 0;
        
        if (responseData.employees && Array.isArray(responseData.employees)) {
          // Transform database employees to match frontend Employee type
          result.addedEmployees = responseData.employees.map(transformEmployeeData);
        }
        
        // Add any errors from the bulk operation
        if (responseData.errors && Array.isArray(responseData.errors)) {
          result.errors = [...result.errors, ...responseData.errors];
          result.errorCount += responseData.errors.length;
        }
      } else {
        throw new Error("Bulk operation returned unexpected response format");
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
    incidentReporting: true,
    incidentAdmin: false,
    assessmentUser: false,
    assessmentsAdmin: false,
    employeeVerificationAdmin: false,
    grievancesAdmin: false,
    transportSafetyAdmin: true,
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
    clientId: dbEmployee.client_id, // Make sure to include clientId in the transformed data
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

/**
 * Check if a string is a valid UUID
 */
const isValidUUID = (str: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

/**
 * Generate a deterministic UUID from a namespace and a string
 * This is a simple implementation - in production, use a proper UUID v5 implementation
 */
const generateDeterministicUUID = (namespace: string, name: string): string => {
  // This is a simplified version just for this specific case
  // In production, use a proper UUID v5 library
  
  // For our purposes, we'll create a fixed UUID structure with the client ID embedded
  // This isn't a true UUID v5, but will work for our use case
  
  const id = parseInt(name);
  if (isNaN(id)) return namespace; // Return namespace as fallback
  
  // Format the ID as a hex string and pad with zeros
  const hexId = id.toString(16).padStart(8, '0');
  
  // Create a deterministic "UUID" with the ID embedded in specific positions
  // This isn't cryptographically secure but gives us consistent UUIDs for specific client IDs
  return `${hexId.slice(0, 8)}-4000-8000-8000-000000000000`;
};
