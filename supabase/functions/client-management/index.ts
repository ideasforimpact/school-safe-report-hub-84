
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getSupabaseUrl, getSupabaseServiceRoleKey, getSupabaseAnonKey } from '../_shared/env.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase client with environment variables
const supabaseUrl = getSupabaseUrl();
const supabaseServiceKey = getSupabaseServiceRoleKey();
const supabaseAnonKey = getSupabaseAnonKey();
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface ClientData {
  id?: string;
  name: string;
  email?: string;
  contactPerson?: string;
  phone?: string;
  active: boolean;
  logo?: string;
  client_logo?: string;
  institutionType?: string;
  client_type_id?: string;
  allowedDomains?: string[];
  superAdminAllowedDomains?: string[];
  auth_providers?: string;
  moduleAccess?: Record<string, boolean>;
  superAdminEmail?: string;
  clientTypeId?: string;
  authProviders?: Record<string, boolean>;
  website?: string;
  whitelistedIPs?: Array<{ ip: string; name?: string }>;
  is_head_office?: boolean;
  mapped_client_ids?: string[];
}

interface ModuleInfo {
  name: string;
  module_id: string;
  is_admin: boolean;
}

const REQUIRE_MAPPINGS_FOR_HEAD_OFFICE = false;

// Check if super admin email domain is allowed
function isSuperAdminEmailDomainAllowed(email: string, allowedDomains: string | null): boolean {
  if (!email || !allowedDomains) return true; // If no restrictions, allow all
  
  const emailDomain = email.split('@')[1]?.toLowerCase();
  if (!emailDomain) return false;
  
  const domainsArray = allowedDomains.split(',');
  return domainsArray.some(domain => domain.toLowerCase() === emailDomain);
}

// Helper function to upload logo to storage and return storage path (not full URL)
async function uploadLogoToStorage(logoBase64: string, clientId: string): Promise<string | null> {
  try {
    if (!logoBase64 || !logoBase64.includes(',')) {
      console.log('No valid base64 logo data provided');
      return null;
    }

    // Extract the base64 data and file type
    const [header, base64Data] = logoBase64.split(',');
    const mimeType = header.match(/data:([^;]+)/)?.[1] || 'image/png';
    const fileExtension = mimeType.split('/')[1] || 'png';
    
    // Convert base64 to Uint8Array
    const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    
    // Create folder structure with client ID and generate unique filename
    // Store as path: client-logos/{clientId}/logo.{ext}
    const fileName = `${clientId}/logo.${fileExtension}`;
    
    console.log(`Uploading logo to storage: ${fileName}, size: ${binaryData.length} bytes`);
    
    // Upload to storage with upsert to replace existing logo
    const { data, error } = await supabase.storage
      .from('client-logos')
      .upload(fileName, binaryData, {
        contentType: mimeType,
        upsert: true // Replace if exists
      });
    
    if (error) {
      console.error('Error uploading logo to storage:', error);
      return null;
    }
    
    // Return storage path instead of full URL
    // Path format: client-logos/{clientId}/logo.{ext}
    const storagePath = `client-logos/${fileName}`;
    console.log('Logo uploaded successfully, storage path:', storagePath);
    return storagePath;
  } catch (err) {
    console.error('Error in uploadLogoToStorage:', err);
    return null;
  }
}

// Helper function to validate super admin email before creation
async function validateSuperAdminEmail(superAdminEmail: string, clientId?: string): Promise<{ isValid: boolean, existingEmployee?: any, error?: string }> {
  try {
    // Check if employee with this email already exists
    const { data: existingEmployees, error: checkError } = await supabase
      .from('employees')
      .select('*, clients!inner(id, name, active)')
      .eq('email', superAdminEmail);

    if (checkError) {
      console.error('Error checking existing employees:', checkError);
      return { isValid: false, error: 'Failed to validate super admin email' };
    }

    if (existingEmployees && existingEmployees.length > 0) {
      // Check if any existing employee belongs to an active client
      const activeClientEmployee = existingEmployees.find(emp => 
        emp.clients && emp.clients.active && emp.clients.id !== clientId
      );

      if (activeClientEmployee) {
        console.error(`Employee with email ${superAdminEmail} already exists for active client: ${activeClientEmployee.clients.name}`);
        return { 
          isValid: false, 
          existingEmployee: activeClientEmployee,
          error: `Employee with email ${superAdminEmail} already exists for active client: ${activeClientEmployee.clients.name}` 
        };
      }

      // Check if employee exists for the same client (this might be an update scenario)
      const sameClientEmployee = existingEmployees.find(emp => 
        emp.clients && emp.clients.id === clientId
      );

      if (sameClientEmployee) {
        console.log(`Employee with email ${superAdminEmail} already exists for this client, will update existing record`);
        return { isValid: true, existingEmployee: sameClientEmployee };
      }
    }

    return { isValid: true };
  } catch (err) {
    console.error('Error in validateSuperAdminEmail:', err);
    return { isValid: false, error: 'Validation failed due to unexpected error' };
  }
}

// Helper function to create employee from super admin email
async function createEmployeeFromSuperAdminEmail(clientId: string, superAdminEmail: string) {
  try {
    // First validate the email
    const validation = await validateSuperAdminEmail(superAdminEmail, clientId);
    
    if (!validation.isValid) {
      throw new Error(validation.error || 'Super admin email validation failed');
    }

    // If employee already exists for this client, return it
    if (validation.existingEmployee && validation.existingEmployee.clients?.id === clientId) {
      console.log('Employee already exists for this client:', validation.existingEmployee);
      return validation.existingEmployee;
    }

    // Extract employee_id from the email (part before @ symbol)
    const employeeId = superAdminEmail.split('@')[0];
    const { data: adminDept,adminDepterror } = await supabase
      .from('employee_departments')
      .select('id')
      .eq('department_name', 'admin')
      .single();

    const { data: emptype,emptypeterror } = await supabase
      .from('employee_type')
      .select('id')
      .eq('type_name', 'permanent')
      .single();
    
    console.log('fetch the department id',adminDept);
    console.log('fetch the type id',emptype);
    
    if (adminDepterror || !adminDept) {
      throw new Error('Admin department not found');
    }
    if (emptypeterror || !emptype) {
      throw new Error('permanent type not found');
    }
    // Create the employee record
    const employeeData = {
      employee_id: employeeId,
      first_name: employeeId, // Using the part before @ as first name
      last_name: '', // Empty last name
      email: superAdminEmail,
      department: adminDept.id,
      employee_type: emptype.id,
      status: true,
      is_super_admin: true,
      client_id: clientId,
      joining_date: new Date().toISOString()
    };

    // Insert new employee
    const { data, error } = await supabase
      .from('employees')
      .insert([employeeData])
      .select('*')
      .single();

    if (error) {
      console.error("Error creating employee from super admin email:", error);
      throw new Error(`Failed to create super admin employee: ${error.message}`);
    }

    console.log('Created new super admin employee:', data);
    return data;
  } catch (err) {
    console.error('Error in createEmployeeFromSuperAdminEmail:', err);
    throw err;
  }
}

// Helper function to update super admin employee
async function updateSuperAdminEmployee(clientId: string, superAdminEmail: string) {
  try {
    // Check if a super admin employee already exists for this client
    const { data: existingEmployee, error: empError } = await supabase
      .from('employees')
      .select('*')
      .eq('client_id', clientId)
      .eq('is_super_admin', true)
      .single();

    if (empError) {
      if (empError.code === 'PGRST116') {
        // No super admin exists, create one
        return await createEmployeeFromSuperAdminEmail(clientId, superAdminEmail);
      }
      console.error('Error checking for existing employee:', empError);
      return null;
    }
    
    // Check if super admin email has changed ->
    // If email changed, we need to set user_id to null before updating


    
    if (existingEmployee.email !== superAdminEmail) {
            // First, set user_id to null when email changes
      const { error: nullifyError } = await supabase
        .from('employees')
        .update({ user_id: null })
        .eq('id', existingEmployee.id);

      if (nullifyError) {
        console.error('Error setting user_id to null:', nullifyError);
        // Continue with update even if nullify fails, but log the error
      } else {
        console.log('Successfully set user_id to null for employee:', existingEmployee.id);
      }

      // Then update the email and other fields
      const employeeId = superAdminEmail.split('@')[0];
      const { data, error } = await supabase
        .from('employees')
        .update({
          email: superAdminEmail,
          employee_id: employeeId,
          first_name: employeeId
        })
        .eq('id', existingEmployee.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating employee email:', error);
        return null;
      }
      return data;
    }
    
    return existingEmployee;
  } catch (err) {
    console.error('Error in updateSuperAdminEmployee:', err);
    return null;
  }
}

// Helper function to rollback client creation
async function rollbackClientCreation(clientId: string): Promise<void> {
  try {
    console.log(`Starting rollback process for client ${clientId}`);
    
    // Delete any employees created for this client
    const { error: employeeError } = await supabase
      .from('employees')
      .delete()
      .eq('client_id', clientId);
      
    if (employeeError) {
      console.error('Error during employee rollback:', employeeError);
    } else {
      console.log('Successfully rolled back employees');
    }

    // Delete any client modules
    const { error: moduleError } = await supabase
      .from('client_modules')
      .delete()
      .eq('client_id', clientId);
      
    if (moduleError) {
      console.error('Error during client modules rollback:', moduleError);
    } else {
      console.log('Successfully rolled back client modules');
    }

    // Finally delete the client record itself
    const { error: clientError } = await supabase
      .from('clients')
      .delete()
      .eq('id', clientId);
      
    if (clientError) {
      console.error('Error during client rollback:', clientError);
      throw new Error(`Failed to rollback client: ${clientError.message}`);
    } else {
      console.log('Successfully rolled back client record');
    }

    // Try to delete client logo from storage if it exists
    try {
      const { error: deleteLogoError } = await supabase.storage
        .from('client-logos')
        .remove([`${clientId}/logo.png`, `${clientId}/logo.jpg`, `${clientId}/logo.jpeg`]);
      
      if (deleteLogoError) {
        console.log('Note: Could not delete logo files during rollback:', deleteLogoError.message);
      }
    } catch (err) {
      console.log('Note: Error during logo cleanup in rollback:', err);
    }

    console.log(`Rollback completed for client ${clientId}`);
  } catch (err) {
    console.error('Error during rollback process:', err);
    throw err;
  }
}

// Helper function to delete all client-related data in proper order
async function deleteClientData(clientId: string) {
  try {
    console.log(`Starting comprehensive deletion process for client ${clientId}`);
    
    // Step 1: Delete form submissions first (they reference custom forms)
    console.log('Deleting form submissions...');
    const { data: forms } = await supabase
      .from('custom_forms')
      .select('id')
      .eq('client_id', clientId);
      
    if (forms && forms.length > 0) {
      const formIds = forms.map(f => f.id);
      
      const { error: submissionsError } = await supabase
        .from('form_submissions')
        .delete()
        .in('form_id', formIds);
        
      if (submissionsError) {
        console.error('Error deleting form submissions:', submissionsError);
      } else {
        console.log('Successfully deleted form submissions');
      }
    }

    // Step 2: Delete custom forms
    console.log('Deleting custom forms...');
    const { error: formsError } = await supabase
      .from('custom_forms')
      .delete()
      .eq('client_id', clientId);
      
    if (formsError) {
      console.error('Error deleting custom forms:', formsError);
    } else {
      console.log('Successfully deleted custom forms');
    }

    // Step 3: Delete incidents first (they reference employees via created_by)
    console.log('Deleting incidents...');
    const { error: incidentsError } = await supabase
      .from('incidents')
      .delete()
      .eq('client_id', clientId);
      
    if (incidentsError) {
      console.error('Error deleting incidents:', incidentsError);
    } else {
      console.log('Successfully deleted incidents');
    }

    // Step 4: Delete assessments
    console.log('Deleting assessments...');
    const { error: assessmentsError } = await supabase
      .from('assessments')
      .delete()
      .eq('client_id', clientId);
      
    if (assessmentsError) {
      console.error('Error deleting assessments:', assessmentsError);
    } else {
      console.log('Successfully deleted assessments');
    }

    // Step 5: Delete employee modules (references employees)
    console.log('Deleting employee modules...');
    const { data: employees } = await supabase
      .from('employees')
      .select('id')
      .eq('client_id', clientId);
      
    if (employees && employees.length > 0) {
      const employeeIds = employees.map(emp => emp.id);
      
      const { error: empModulesError } = await supabase
        .from('employee_modules')
        .delete()
        .in('employee_id', employeeIds);
        
      if (empModulesError) {
        console.error('Error deleting employee modules:', empModulesError);
      } else {
        console.log('Successfully deleted employee modules');
      }
    }

    // Step 6: Delete employee documents (references employees)
    console.log('Deleting employee documents...');
    if (employees && employees.length > 0) {
      const employeeIds = employees.map(emp => emp.id);
      
      const { error: empDocsError } = await supabase
        .from('employee_documents')
        .delete()
        .in('employee_id', employeeIds);
        
      if (empDocsError) {
        console.error('Error deleting employee documents:', empDocsError);
      } else {
        console.log('Successfully deleted employee documents');
      }
    }

    // Step 7: Delete employees
    console.log('Deleting employees...');
    const { error: employeesError } = await supabase
      .from('employees')
      .delete()
      .eq('client_id', clientId);
      
    if (employeesError) {
      console.error('Error deleting employees:', employeesError);
    } else {
      console.log('Successfully deleted employees');
    }

    // Step 8: Delete sections (references grades)
    console.log('Deleting sections...');
    const { error: sectionsError } = await supabase
      .from('sections')
      .delete()
      .eq('client_id', clientId);
      
    if (sectionsError) {
      console.error('Error deleting sections:', sectionsError);
    } else {
      console.log('Successfully deleted sections');
    }

    // Step 9: Delete grades
    console.log('Deleting grades...');
    const { error: gradesError } = await supabase
      .from('grades')
      .delete()
      .eq('client_id', clientId);
      
    if (gradesError) {
      console.error('Error deleting grades:', gradesError);
    } else {
      console.log('Successfully deleted grades');
    }

    // Step 10: Delete facilities
    console.log('Deleting facilities...');
    const { error: facilitiesError } = await supabase
      .from('facilities')
      .delete()
      .eq('client_id', clientId);
      
    if (facilitiesError) {
      console.error('Error deleting facilities:', facilitiesError);
    } else {
      console.log('Successfully deleted facilities');
    }

    // Step 11: Delete campuses
    console.log('Deleting campuses...');
    const { error: campusesError } = await supabase
      .from('campuses')
      .delete()
      .eq('client_id', clientId);
      
    if (campusesError) {
      console.error('Error deleting campuses:', campusesError);
    } else {
      console.log('Successfully deleted campuses');
    }

    // Step 12: Delete students
    console.log('Deleting students...');
    const { error: studentsError } = await supabase
      .from('students')
      .delete()
      .eq('client_id', clientId);
      
    if (studentsError) {
      console.error('Error deleting students:', studentsError);
    } else {
      console.log('Successfully deleted students');
    }

    // Step 13: Delete vehicle documents (references vehicles)
    console.log('Deleting vehicle documents...');
    const { data: vehicles } = await supabase
      .from('vehicles')
      .select('id')
      .eq('client_id', clientId);
      
    if (vehicles && vehicles.length > 0) {
      const vehicleIds = vehicles.map(v => v.id);
      
      const { error: vehicleDocsError } = await supabase
        .from('vehicle_documents')
        .delete()
        .in('vehicle_id', vehicleIds);
        
      if (vehicleDocsError) {
        console.error('Error deleting vehicle documents:', vehicleDocsError);
      } else {
        console.log('Successfully deleted vehicle documents');
      }
    }

    // Step 14: Delete vehicles
    console.log('Deleting vehicles...');
    const { error: vehiclesError } = await supabase
      .from('vehicles')
      .delete()
      .eq('client_id', clientId);
      
    if (vehiclesError) {
      console.error('Error deleting vehicles:', vehiclesError);
    } else {
      console.log('Successfully deleted vehicles');
    }

    // Step 15: Delete edusafe resources
    console.log('Deleting edusafe resources...');
    const { error: eduSafeError } = await supabase
      .from('edusafe_resources')
      .delete()
      .eq('client_id', clientId);
      
    if (eduSafeError) {
      console.error('Error deleting edusafe resources:', eduSafeError);
    } else {
      console.log('Successfully deleted edusafe resources');
    }

    // Step 16: Delete client modules
    console.log('Deleting client modules...');
    const { error: clientModulesError } = await supabase
      .from('client_modules')
      .delete()
      .eq('client_id', clientId);
      
    if (clientModulesError) {
      console.error('Error deleting client modules:', clientModulesError);
    } else {
      console.log('Successfully deleted client modules');
    }

    // Step 17: Delete configuration data related to client
    console.log('Deleting configuration data...');
    
    // Delete contributing factors
    const { error: contributingFactorsError } = await supabase
      .from('contributing_factors')
      .delete()
      .eq('client_id', clientId);
      
    if (contributingFactorsError) {
      console.error('Error deleting contributing factors:', contributingFactorsError);
    }

    // Delete incident subcategories first (they reference categories)
    const { error: incidentSubcategoriesError } = await supabase
      .from('incident_subcategories')
      .delete()
      .eq('client_id', clientId);
      
    if (incidentSubcategoriesError) {
      console.error('Error deleting incident subcategories:', incidentSubcategoriesError);
    }

    // Delete incident categories
    const { error: incidentCategoriesError } = await supabase
      .from('incident_categories')
      .delete()
      .eq('client_id', clientId);
      
    if (incidentCategoriesError) {
      console.error('Error deleting incident categories:', incidentCategoriesError);
    }

    // Delete incident priorities
    const { error: incidentPrioritiesError } = await supabase
      .from('incident_priorities')
      .delete()
      .eq('client_id', clientId);
      
    if (incidentPrioritiesError) {
      console.error('Error deleting incident priorities:', incidentPrioritiesError);
    }

    // Delete incident report types
    const { error: incidentReportTypesError } = await supabase
      .from('incident_report_types')
      .delete()
      .eq('client_id', clientId);
      
    if (incidentReportTypesError) {
      console.error('Error deleting incident report types:', incidentReportTypesError);
    }

    // Step 18: Delete assessment templates
    console.log('Deleting assessment templates...');
    const { error: assessmentTemplatesError } = await supabase
      .from('assessment_templates')
      .delete()
      .eq('client_id', clientId);
      
    if (assessmentTemplatesError) {
      console.error('Error deleting assessment templates:', assessmentTemplatesError);
    } else {
      console.log('Successfully deleted assessment templates');
    }

    console.log('Completed deletion of all client-related data');
    return true;
  } catch (err) {
    console.error('Error in deleteClientData:', err);
    return false;
  }
}

// Function to process IP whitelisting
async function processIPWhitelist(clientId: string, whitelistedIPs: Array<{ ip: string; name?: string }>): Promise<boolean> {
  try {
    console.log(`Processing IP whitelist for client ${clientId}:`, JSON.stringify(whitelistedIPs, null, 2));
    
    if (!whitelistedIPs || whitelistedIPs.length === 0) {
      console.log('No IPs to process, deactivating all existing IPs');
      // Deactivate all existing IPs instead of deleting (for audit purposes)
      const { error: deactivateError } = await supabase
        .from('client_ip_whitelist')
        .update({ is_active: false })
        .eq('client_id', clientId);
      
      if (deactivateError) {
        console.error(`Error deactivating IPs for client ${clientId}:`, deactivateError);
        return false;
      }
      return true;
    }

    // Verify client exists
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select('id')
      .eq('id', clientId)
      .single();

    if (clientError || !clientData) {
      console.error(`Client ${clientId} does not exist in database:`, clientError);
      return false;
    }

    // Get existing IPs
    const { data: existingIPs, error: fetchError } = await supabase
      .from('client_ip_whitelist')
      .select('ip_address')
      .eq('client_id', clientId);

    if (fetchError) {
      console.error(`Error fetching existing IPs for client ${clientId}:`, fetchError);
      return false;
    }

    const existingIPSet = new Set(existingIPs?.map(ip => ip.ip_address) || []);

    // Process each IP
    for (const ipData of whitelistedIPs) {
      const { ip, name } = ipData;
      
      if (!ip || ip.trim() === '') {
        console.error('Invalid IP address:', ip);
        continue;
      }

      const trimmedIP = ip.trim();

      // Check if IP already exists
      if (existingIPSet.has(trimmedIP)) {
        // Update existing IP (reactivate if needed, update name)
        console.log(`Updating existing IP: ${trimmedIP}`);
        const { error: updateError } = await supabase
          .from('client_ip_whitelist')
          .update({
            name: name || null,
            is_active: true,
            updated_at: new Date().toISOString()
          })
          .eq('client_id', clientId)
          .eq('ip_address', trimmedIP);

        if (updateError) {
          console.error(`Error updating IP ${trimmedIP} for client ${clientId}:`, updateError);
          return false;
        }
      } else {
        // Insert new IP
        console.log(`Inserting new IP: ${trimmedIP} with name: ${name || 'N/A'}`);
        const { error: insertError } = await supabase
          .from('client_ip_whitelist')
          .insert({
            client_id: clientId,
            ip_address: trimmedIP,
            name: name || null,
            is_active: true
          });

        if (insertError) {
          console.error(`Error inserting IP ${trimmedIP} for client ${clientId}:`, insertError);
          return false;
        }
      }
    }

    // Deactivate IPs that are no longer in the list
    const newIPSet = new Set(whitelistedIPs.map(ip => ip.ip.trim()));
    const ipsToDeactivate = existingIPs?.filter(ip => !newIPSet.has(ip.ip_address)) || [];

    if (ipsToDeactivate.length > 0) {
      console.log(`Deactivating ${ipsToDeactivate.length} IPs that are no longer in the list`);
      const ipsToDeactivateList = ipsToDeactivate.map(ip => ip.ip_address);
      
      const { error: deactivateError } = await supabase
        .from('client_ip_whitelist')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('client_id', clientId)
        .in('ip_address', ipsToDeactivateList);

      if (deactivateError) {
        console.error(`Error deactivating IPs for client ${clientId}:`, deactivateError);
        return false;
      }
    }

    console.log(`Successfully processed IP whitelist for client ${clientId}`);
    return true;
  } catch (err) {
    console.error('Error in processIPWhitelist:', err);
    return false;
  }
}

// Function to process module access based on the provided module information
async function processModuleAccess(clientId: string, moduleInfoArray: ModuleInfo[], isCreation: boolean = false): Promise<boolean> {
  try {
    console.log(`Processing modules for client ${clientId}:`, JSON.stringify(moduleInfoArray, null, 2));
    
    if (!moduleInfoArray || moduleInfoArray.length === 0) {
      console.log('No modules to process');
      return true;
    }

    // Only verify client exists if this is not during creation
    if (!isCreation) {
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('id')
        .eq('id', clientId)
        .single();

      if (clientError || !clientData) {
        console.error(`Client ${clientId} does not exist in database:`, clientError);
        return false;
      }

      console.log(`Client ${clientId} exists, proceeding with module processing`);
    } else {
      console.log(`Processing modules during client creation for ${clientId}`);
    }

    // First, remove all existing modules for this client
    const { error: deleteError } = await supabase
      .from('client_modules')
      .delete()
      .eq('client_id', clientId);
      
    if (deleteError) {
      console.error(`Error deleting existing modules for client ${clientId}:`, deleteError);
      // Continue anyway to try adding new modules
    } else {
      console.log(`Successfully deleted existing modules for client ${clientId}`);
    }

    // For each module in the array, insert a new record
    for (const moduleInfo of moduleInfoArray) {
      const { module_id, is_admin } = moduleInfo;
      
      if (!module_id) {
        console.error('Missing module_id in module info');
        continue;
      }
      
      console.log(`Processing module: ${moduleInfo.name}, module_id: ${module_id}, is_admin: ${is_admin}`);
      
      const accessLevel = { 
        isAdmin: is_admin,
        isEnabled: true
      };
      
      // Insert new module
      console.log(`Inserting new module: ${module_id} with access_level:`, accessLevel);
      
      const { error: insertError } = await supabase
        .from('client_modules')
        .insert({
          client_id: clientId,
          module_id: module_id,
          access_level: accessLevel,
          enabled: true
        });
        
      if (insertError) {
        console.error(`Error inserting module ${module_id} for client ${clientId}:`, insertError);
        return false;
      } else {
        console.log(`Successfully inserted module ${module_id} for client ${clientId}`);
      }
    }
    
    return true;
  } catch (err) {
    console.error('Error in processModuleAccess:', err);
    return false;
  }
}

/** Must match migration backfill / src/constants/aiFeatureKeys.ts */
const AI_FEATURE_INCIDENT_RECOMMENDED_ACTIONS = 'incident_recommended_actions'

async function upsertClientAiIncidentRecommendedActions(clientId: string, enabled: boolean): Promise<void> {
  const now = new Date().toISOString()
  const { error } = await supabase
    .from('client_ai_features')
    .upsert(
      {
        client_id: clientId,
        feature_key: AI_FEATURE_INCIDENT_RECOMMENDED_ACTIONS,
        enabled,
        updated_at: now,
      },
      { onConflict: 'client_id,feature_key' },
    )
  if (error) {
    throw new Error(`Failed to upsert client AI feature: ${error.message}`)
  }
}

async function getClientAiIncidentRecommendedActions(clientId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('client_ai_features')
    .select('enabled')
    .eq('client_id', clientId)
    .eq('feature_key', AI_FEATURE_INCIDENT_RECOMMENDED_ACTIONS)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to fetch client AI feature: ${error.message}`)
  }

  return data?.enabled !== false
}

async function listClientAiIncidentRecommendedActions(clientIds: string[]): Promise<Array<{ client_id: string; enabled: boolean }>> {
  if (!Array.isArray(clientIds) || clientIds.length === 0) return []

  const { data, error } = await supabase
    .from('client_ai_features')
    .select('client_id, enabled')
    .eq('feature_key', AI_FEATURE_INCIDENT_RECOMMENDED_ACTIONS)
    .in('client_id', clientIds)

  if (error) {
    throw new Error(`Failed to list client AI features: ${error.message}`)
  }

  return (data || []) as Array<{ client_id: string; enabled: boolean }>
}

async function getAuthedUser(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return null;

  const authedClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: authHeader } },
  });

  const { data, error } = await authedClient.auth.getUser();
  if (error || !data?.user) return null;
  return data.user;
}

async function assertClientManagementWriteAllowed(
  req: Request,
  operation: 'create' | 'update' | 'delete',
): Promise<void> {
  const authHeader = req.headers.get('Authorization');
  const authedUser = await getAuthedUser(req);
  if (!authHeader && !authedUser) {
    // Keep compatibility with non-SSO flows where no bearer token exists.
    return;
  }
  if (!authedUser) {
    throw new Error('Unauthorized client management write request');
  }

  const { data: employee, error: employeeError } = await supabase
    .from('employees')
    .select('client_id, status')
    .eq('user_id', authedUser.id)
    .eq('status', true)
    .limit(1)
    .maybeSingle();

  if (employeeError || !employee?.client_id) {
    // Backoffice users are not represented in employees table.
    const { data: backofficeUser, error: backofficeUserError } = await supabase
      .from('backoffice_users')
      .select('id')
      .eq('email', authedUser.email || '')
      .maybeSingle();

    if (!backofficeUserError && backofficeUser?.id) {
      return;
    }

    throw new Error('Employee context not found for write permission check');
  }

  const { data: userContext, error: contextError } = await supabase
    .from('user_client_context')
    .select('home_client_id, target_client_id, role_id')
    .eq('user_id', authedUser.id)
    .maybeSingle();

  if (contextError) {
    throw new Error(`Failed to read user client context: ${contextError.message}`);
  }

  // If context row is missing, assume unswitched home context.
  const homeClientId = userContext?.home_client_id || employee.client_id;
  const targetClientId = userContext?.target_client_id || homeClientId;
  const isSwitchedContext = targetClientId !== homeClientId;

  let roleCode: 'W/R' | 'R' = 'W/R';
  if (isSwitchedContext) {
    const { data: switchedRole, error: switchedRoleError } = await supabase
      .from('client_roles')
      .select('access_level')
      .eq('id', userContext?.role_id || '')
      .eq('active', true)
      .maybeSingle();

    if (switchedRoleError || !switchedRole) {
      roleCode = 'R';
    } else {
      roleCode = switchedRole.access_level === 'R' ? 'R' : 'W/R';
    }
  } else {
    const { data: homeClient, error: homeClientError } = await supabase
      .from('clients')
      .select('client_role_id')
      .eq('id', homeClientId)
      .single();

    if (homeClientError || !homeClient) {
      throw new Error('Failed to resolve client role for write permission check');
    }
    const { data: homeRole, error: homeRoleError } = await supabase
      .from('client_roles')
      .select('access_level')
      .eq('id', homeClient.client_role_id || '')
      .eq('active', true)
      .maybeSingle();

    if (homeRoleError || !homeRole) {
      roleCode = 'R';
    } else {
      roleCode = homeRole.access_level === 'R' ? 'R' : 'W/R';
    }
  }

  if (roleCode !== 'W/R') {
    if (operation === 'delete') {
      throw new Error('Delete permission is denied for this client role');
    }
    if (operation === 'create' || operation === 'update') {
      throw new Error('Edit permission is denied for this client role');
    }
  }
}

function normalizeMappedClientIds(mappedClientIds: unknown): string[] {
  if (!Array.isArray(mappedClientIds)) return [];
  const normalizedIds = mappedClientIds
    .filter((id): id is string => typeof id === 'string')
    .map((id) => id.trim())
    .filter((id) => id.length > 0);

  return [...new Set(normalizedIds)];
}

function resolveIsHeadOffice(clientData: Record<string, unknown>): boolean {
  if (typeof clientData.is_head_office === 'boolean') {
    return clientData.is_head_office;
  }
  if (typeof clientData.isHeadOffice === 'boolean') {
    return clientData.isHeadOffice;
  }
  return false;
}

function resolveMappedClientIds(clientData: Record<string, unknown>): string[] {
  if (Array.isArray(clientData.mapped_client_ids)) {
    return normalizeMappedClientIds(clientData.mapped_client_ids);
  }
  if (Array.isArray(clientData.mappedClientIds)) {
    return normalizeMappedClientIds(clientData.mappedClientIds);
  }
  return [];
}

function validateHeadOfficeMappingInput(
  isHeadOffice: boolean,
  mappedClientIds: string[],
  headOfficeId?: string,
) {
  if (!isHeadOffice) return;

  if (REQUIRE_MAPPINGS_FOR_HEAD_OFFICE && mappedClientIds.length === 0) {
    throw new Error('At least one mapped client is required when is_head_office is true');
  }

  if (headOfficeId && mappedClientIds.includes(headOfficeId)) {
    throw new Error('Head office cannot be mapped to itself');
  }
}

async function syncClientMappings(
  headOfficeId: string,
  isHeadOffice: boolean,
  mappedClientIds: string[] | undefined,
) {
  if (!isHeadOffice) {
    const { error: clearMappingsError } = await supabase
      .from('client_mappings')
      .delete()
      .eq('head_office_id', headOfficeId);

    if (clearMappingsError) {
      throw new Error(`Failed to clear client mappings: ${clearMappingsError.message}`);
    }
    return;
  }

  const normalizedMappedClientIds = normalizeMappedClientIds(mappedClientIds ?? []);
  validateHeadOfficeMappingInput(true, normalizedMappedClientIds, headOfficeId);

  const { data: existingMappings, error: fetchMappingsError } = await supabase
    .from('client_mappings')
    .select('sub_client_id')
    .eq('head_office_id', headOfficeId)
    .eq('active', true);

  if (fetchMappingsError) {
    throw new Error(`Failed to fetch existing client mappings: ${fetchMappingsError.message}`);
  }

  const existingSubClientIds = new Set((existingMappings || []).map((mapping) => mapping.sub_client_id));
  const targetSubClientIds = new Set(normalizedMappedClientIds);

  const subClientIdsToAdd = normalizedMappedClientIds.filter((id) => !existingSubClientIds.has(id));
  const subClientIdsToRemove = [...existingSubClientIds].filter((id) => !targetSubClientIds.has(id));

  if (subClientIdsToRemove.length > 0) {
    const { error: deleteMappingsError } = await supabase
      .from('client_mappings')
      .delete()
      .eq('head_office_id', headOfficeId)
      .in('sub_client_id', subClientIdsToRemove);

    if (deleteMappingsError) {
      throw new Error(`Failed to remove client mappings: ${deleteMappingsError.message}`);
    }
  }

  if (subClientIdsToAdd.length > 0) {
    const rowsToInsert = subClientIdsToAdd.map((subClientId) => ({
      head_office_id: headOfficeId,
      sub_client_id: subClientId,
    }));

    const { error: insertMappingsError } = await supabase
      .from('client_mappings')
      .insert(rowsToInsert);

    if (insertMappingsError) {
      throw new Error(`Failed to add client mappings: ${insertMappingsError.message}`);
    }
  }

  // No per-mapping access-level persistence in this schema version.
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const requestBody = await req.json()
    console.log('Full request body:', JSON.stringify(requestBody, null, 2))
    
    const { operation, client } = requestBody
    console.log('Client management operation:', operation)
    console.log('Client data received:', client ? {
      ...client,
      logo: client.logo ? 'Logo data present' : 'No logo data'
    } : null)

    if (operation === 'create' || operation === 'update' || operation === 'delete') {
      await assertClientManagementWriteAllowed(req, operation);
    }

    switch (operation) {
      case 'create':
        return await handleCreateClient(client)
      case 'update':
        return await handleUpdateClient(client)
      case 'delete':
        return await handleDeleteClient(client)
      case 'get-ai-feature': {
        if (!client?.id) {
          throw new Error('client.id is required for get-ai-feature')
        }
        const enabled = await getClientAiIncidentRecommendedActions(client.id)
        return new Response(
          JSON.stringify({ success: true, client_id: client.id, enabled }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }
      case 'list-ai-features': {
        const clientIds = Array.isArray(requestBody?.clientIds) ? requestBody.clientIds : []
        const rows = await listClientAiIncidentRecommendedActions(clientIds)
        return new Response(
          JSON.stringify({ success: true, rows }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }
      default:
        throw new Error(`Unknown operation: ${operation}`)
    }
  } catch (error) {
    console.error('Error in client-management function:', error)
    const isPermissionError =
      (error?.message || '').includes('not permitted') ||
      (error?.message || '').includes('permission is denied')
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: isPermissionError ? 403 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

// Copies Child Audit master templates from backoffice_* tables into the per-client
// child_audit_* tables, stamped with the new client's id. Idempotent via upsert
// ignoreDuplicates. Check types are inserted first to satisfy the FK on look_up.
// NOTE: the call site in handleCreateClient is intentionally commented out — new
// clients get their template via the explicit "Sync" flow on /backoffice/child-audit
// (sync-child-audit-template edge function), not automatically on client create.
async function seedChildAuditForClient(clientId: string) {
  const { data: checkTypes, error: ctErr } = await supabase
    .from('backoffice_child_audit_check_type')
    .select('type, key, alt_definition, active, attachements, order')
    .eq('active', true);
  if (ctErr) throw ctErr;

  if (checkTypes && checkTypes.length > 0) {
    const ctRows = checkTypes.map((r: Record<string, unknown>) => ({ ...r, client_id: clientId }));
    const { error } = await supabase
      .from('child_audit_check_type')
      .upsert(ctRows, { onConflict: 'client_id,key', ignoreDuplicates: true });
    if (error) throw error;
  }

  const { data: lookups, error: luErr } = await supabase
    .from('backoffice_child_audit_look_up')
    .select('item_group, type, label, active, definition')
    .eq('active', true);
  if (luErr) throw luErr;

  if (lookups && lookups.length > 0) {
    const luRows = lookups.map((r: Record<string, unknown>) => ({ ...r, client_id: clientId }));
    const { error } = await supabase
      .from('child_audit_look_up')
      .upsert(luRows, { onConflict: 'client_id,type,item_group,label', ignoreDuplicates: true });
    if (error) throw error;
  }
}

async function handleCreateClient(clientData: any) {
  console.log('Creating client with data:', {
    ...clientData,
    logo: clientData.logo ? 'Logo data present' : 'No logo data'
  });
  
  let clientId: string | null = null;
  
  try {
    const { modules, superAdminEmail, clientTypeId, logo, whitelistedIPs, aiFeatureIncidentRecommendedActions, ...clientInfo } = clientData;
    const isHeadOffice = resolveIsHeadOffice(clientData);
    const mappedClientIds = resolveMappedClientIds(clientData);
    const incidentAiEnabled = aiFeatureIncidentRecommendedActions !== false;

    // Generate a new UUID for the client
    clientId = crypto.randomUUID();
    validateHeadOfficeMappingInput(isHeadOffice, mappedClientIds, clientId);
    
    console.log('Logo data check:', {
      logoExists: !!logo,
      logoType: typeof logo,
      logoLength: logo ? logo.length : 0
    });

    console.log(`Starting client creation process for ${clientId}`);
    
    // Handle logo upload first if provided
    let clientLogoUrl = null;
    if (logo) {
      console.log('Uploading client logo to storage...');
      clientLogoUrl = await uploadLogoToStorage(logo, clientId);
      if (clientLogoUrl) {
        console.log('Client logo uploaded successfully:', clientLogoUrl);
      }
    } else {
      console.log('No logo provided for client creation');
    }
    
    // Prepare client data for insertion - include ALL the data properly
    const clientRecord = {
      id: clientId,
      name: clientInfo.name || '',
      email: clientInfo.email || null,
      contact_person: clientInfo.contactPerson || null,
      phone: clientInfo.phone || null,
      active: clientInfo.active !== undefined ? clientInfo.active : true,
      institution_type: clientInfo.institutionType || null,
      allowed_domains: Array.isArray(clientInfo.allowedDomains) ? clientInfo.allowedDomains.join(',') : null,
      super_admin_allowed_domain: Array.isArray(clientInfo.superAdminAllowedDomains) ? clientInfo.superAdminAllowedDomains.join(',') : null,
      auth_providers: clientInfo.authProviders ? JSON.stringify(clientInfo.authProviders) : null,
      client_type_id: clientTypeId || null,
      client_logo: clientLogoUrl, // Store path: client-logos/{clientId}/logo.{ext}
      logo: clientLogoUrl, // Store path: client-logos/{clientId}/logo.{ext}
      is_head_office: isHeadOffice,
      creation_date: new Date().toISOString()
    };
    
    console.log('Inserting client record into database with data:', clientRecord);
    const { data: insertedClient, error: insertError } = await supabase
      .from('clients')
      .insert([clientRecord])
      .select('*')
      .single();
      
    if (insertError) {
      console.error('Error inserting client record:', insertError);
      throw new Error(`Failed to create client record: ${insertError.message}`);
    }
    
    console.log('Client record inserted successfully:', insertedClient.id);

    // Child Audit auto-seed on client create — intentionally disabled.
    // SaaS admins seed new clients on-demand via /backoffice/child-audit
    // (sync-child-audit-template edge function). Uncomment to opt back in.
    // try {
    //   await seedChildAuditForClient(clientId);
    //   console.log('Child Audit templates seeded for client:', clientId);
    // } catch (seedErr) {
    //   console.error('Error seeding Child Audit templates for client:', seedErr);
    //   await rollbackClientCreation(clientId);
    //   throw new Error(`Failed to seed Child Audit templates: ${seedErr.message}`);
    // }

    if (isHeadOffice || mappedClientIds.length > 0) {
      try {
        await syncClientMappings(
          clientId,
          isHeadOffice,
          mappedClientIds,
        );
      } catch (mappingsError) {
        console.error('Error syncing client mappings during create:', mappingsError);
        await rollbackClientCreation(clientId);
        throw new Error(`Failed to save client mappings: ${mappingsError.message}`);
      }
    }

    try {
      await upsertClientAiIncidentRecommendedActions(clientId, incidentAiEnabled);
    } catch (aiErr) {
      console.error('Error upserting client AI feature:', aiErr);
      await rollbackClientCreation(clientId);
      throw new Error(`Failed to save AI feature settings: ${aiErr.message}`);
    }
    
    // Validate and create super admin employee if email provided
    if (superAdminEmail) {
      console.log('Creating super admin employee...');
      try {
        const employee = await createEmployeeFromSuperAdminEmail(clientId, superAdminEmail);
        if (!employee) {
          throw new Error('Failed to create super admin employee');
        }
        console.log('Super admin employee created successfully');
      } catch (employeeError) {
        console.error('Error creating super admin employee:', employeeError);
        // Rollback client creation
        await rollbackClientCreation(clientId);
        throw new Error(`Failed to create super admin employee: ${employeeError.message}`);
      }
    }
    
    // Process module access - client now exists in database
    if (modules && modules.length > 0) {
      console.log('Processing module access for newly created client...');
      try {
        const moduleSuccess = await processModuleAccess(clientId, modules, true);
        if (!moduleSuccess) {
          throw new Error('Failed to process module access');
        }
        console.log('Module access processed successfully');
      } catch (moduleError) {
        console.error('Error processing module access:', moduleError);
        // Rollback client creation
        await rollbackClientCreation(clientId);
        throw new Error(`Failed to process module access: ${moduleError.message}`);
      }
    }
    
    // Process IP whitelist - client now exists in database
    if (whitelistedIPs && whitelistedIPs.length > 0) {
      console.log('Processing IP whitelist for newly created client...');
      try {
        const ipSuccess = await processIPWhitelist(clientId, whitelistedIPs);
        if (!ipSuccess) {
          throw new Error('Failed to process IP whitelist');
        }
        console.log('IP whitelist processed successfully');
      } catch (ipError) {
        console.error('Error processing IP whitelist:', ipError);
        // Rollback client creation
        await rollbackClientCreation(clientId);
        throw new Error(`Failed to process IP whitelist: ${ipError.message}`);
      }
    }
    
    return new Response(
      JSON.stringify({ success: true, client_id: clientId, client_logo_url: clientLogoUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in handleCreateClient:', error);
    
    // If we have a clientId and the error occurred after client creation, try to rollback
    if (clientId) {
      try {
        await rollbackClientCreation(clientId);
        console.log('Rollback completed successfully');
      } catch (rollbackError) {
        console.error('Error during rollback:', rollbackError);
      }
    }
    
    throw error;
  }
}

async function handleUpdateClient(clientData: any) {
  console.log('Updating client with data:', {
    ...clientData,
    logo: clientData.logo ? 'Logo data present' : 'No logo data',
    whitelistedIPs: clientData.whitelistedIPs
  });
  
  try {
    const { id: clientId, modules, superAdminEmail, clientTypeId, logo, whitelistedIPs, aiFeatureIncidentRecommendedActions, ...clientInfo } = clientData;
    const isHeadOfficeProvided = typeof clientData.is_head_office === 'boolean' || typeof clientData.isHeadOffice === 'boolean';
    const mappedClientIdsProvided = Array.isArray(clientData.mapped_client_ids) || Array.isArray(clientData.mappedClientIds);
    const requestedIsHeadOffice = resolveIsHeadOffice(clientData);
    let requestedMappedClientIds = resolveMappedClientIds(clientData);
        
    console.log('Logo data check:', {
      logoExists: !!logo,
      logoType: typeof logo,
      logoLength: logo ? logo.length : 0
    });
    
    // Handle logo upload if provided
    let clientLogoUrl = null;
    if (logo) {
      console.log('Uploading client logo to storage...');
      clientLogoUrl = await uploadLogoToStorage(logo, clientId);
      if (clientLogoUrl) {
        console.log('Client logo uploaded successfully:', clientLogoUrl);
      }
    } else {
      console.log('No logo provided for client update');
    }
    
    // Prepare complete client data for update
    const updateData: any = {};
    
    // Update all client fields if provided
    if (clientInfo.name !== undefined) updateData.name = clientInfo.name;
    if (clientInfo.email !== undefined) updateData.email = clientInfo.email;
    if (clientInfo.contactPerson !== undefined) updateData.contact_person = clientInfo.contactPerson;
    if (clientInfo.phone !== undefined) updateData.phone = clientInfo.phone;
    if (clientInfo.active !== undefined) updateData.active = clientInfo.active;
    if (clientInfo.institutionType !== undefined) updateData.institution_type = clientInfo.institutionType;
    if (clientInfo.allowedDomains !== undefined) {
      updateData.allowed_domains = Array.isArray(clientInfo.allowedDomains) ? clientInfo.allowedDomains.join(',') : null;
    }
    if (clientInfo.superAdminAllowedDomains !== undefined) {
      updateData.super_admin_allowed_domain = Array.isArray(clientInfo.superAdminAllowedDomains) ? clientInfo.superAdminAllowedDomains.join(',') : null;
    }
    if (clientInfo.authProviders !== undefined) {
      updateData.auth_providers = JSON.stringify(clientInfo.authProviders);
    }
    if (isHeadOfficeProvided) {
      updateData.is_head_office = requestedIsHeadOffice;
    }
    // if (clientInfo.website !== undefined) updateData.website = clientInfo.website;
    
    if (clientTypeId) {
      // Block type change if client already has incidents
      const { count: incidentCount, error: incidentCheckError } = await supabase
        .from('incidents')
        .select('id', { count: 'exact', head: true })
        .eq('client_id', clientId);

      if (incidentCheckError) throw new Error(`Failed to check incidents: ${incidentCheckError.message}`);

      if (incidentCount && incidentCount > 0) {
        return new Response(
          JSON.stringify({ error: 'CLIENT_TYPE_LOCKED', message: 'Client type cannot be changed because incidents have already been created for this client.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      updateData.client_type_id = clientTypeId;
    }
    
    if (clientLogoUrl) {
      updateData.client_logo = clientLogoUrl; // Store path: client-logos/{clientId}/logo.{ext}
      updateData.logo = clientLogoUrl; // Store path: client-logos/{clientId}/logo.{ext}
    }
    
    // Update client record with all the new data
    console.log('Updating client record with data:', updateData);
    const { error: updateError } = await supabase
      .from('clients')
      .update(updateData)
      .eq('id', clientId);
      
    if (updateError) {
      console.error('Error updating client record:', updateError);
      throw new Error(`Failed to update client record: ${updateError.message}`);
    } else {
      console.log('Successfully updated client record');
    }

    if (isHeadOfficeProvided || mappedClientIdsProvided) {
      let effectiveIsHeadOffice = requestedIsHeadOffice;

      if (!isHeadOfficeProvided && mappedClientIdsProvided) {
        const { data: existingClient, error: clientLookupError } = await supabase
          .from('clients')
          .select('is_head_office')
          .eq('id', clientId)
          .single();

        if (clientLookupError) {
          throw new Error(`Failed to resolve current head office status: ${clientLookupError.message}`);
        }

        effectiveIsHeadOffice = existingClient.is_head_office;
      }

      validateHeadOfficeMappingInput(effectiveIsHeadOffice, requestedMappedClientIds, clientId);
      await syncClientMappings(
        clientId,
        effectiveIsHeadOffice,
        requestedMappedClientIds,
      );
    }
    
    // Process module access with isCreation flag set to false (default)
    if (modules && modules.length > 0) {
      const moduleSuccess = await processModuleAccess(clientId, modules, false);
      if (!moduleSuccess) {
        throw new Error('Failed to process module access');
      }
    }
    
    // Update super admin employee if email provided
    if (superAdminEmail) {
      const employee = await updateSuperAdminEmployee(clientId, superAdminEmail);
      if (!employee) {
        console.error('Failed to update super admin employee');
      }
    }
    
    // Process IP whitelist - always process if whitelistedIPs is provided (even if empty array)
    // Empty array means deactivate all IPs, undefined/null means don't change IPs
    // Check for both undefined and null to be safe
    if (whitelistedIPs !== undefined && whitelistedIPs !== null) {
      console.log('Processing IP whitelist for client update...', {
        clientId,
        whitelistedIPs,
        whitelistedIPsType: typeof whitelistedIPs,
        whitelistedIPsIsArray: Array.isArray(whitelistedIPs),
        whitelistedIPsLength: Array.isArray(whitelistedIPs) ? whitelistedIPs.length : 'not an array',
        whitelistedIPsStringified: JSON.stringify(whitelistedIPs)
      });
      const ipArray = Array.isArray(whitelistedIPs) ? whitelistedIPs : [];
      const ipSuccess = await processIPWhitelist(clientId, ipArray);
      if (!ipSuccess) {
        throw new Error('Failed to process IP whitelist');
      }
      console.log('IP whitelist processed successfully');
    } else {
      console.log('whitelistedIPs is undefined or null, skipping IP whitelist update', {
        whitelistedIPs,
        isUndefined: whitelistedIPs === undefined,
        isNull: whitelistedIPs === null
      });
    }

    if (aiFeatureIncidentRecommendedActions !== undefined) {
      await upsertClientAiIncidentRecommendedActions(
        clientId,
        aiFeatureIncidentRecommendedActions !== false,
      );
    }
    
    return new Response(
      JSON.stringify({ success: true, client_id: clientId, client_logo_url: clientLogoUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in handleUpdateClient:', error);
    throw error;
  }
}

async function handleDeleteClient(clientData: any) {
  console.log('Deleting client with data:', clientData);
  
  try {
    const { id: clientId } = clientData;
    
    // Delete all client-related data in proper order
    const deletionSuccess = await deleteClientData(clientId);
    if (!deletionSuccess) {
      console.error('Failed to delete all client data');
      throw new Error('Failed to delete all client-related data');
    }
    
    // Finally delete the client record itself
    console.log('Deleting client record...');
    const { error: clientDeleteError } = await supabase
      .from('clients')
      .delete()
      .eq('id', clientId);
      
    if (clientDeleteError) {
      console.error('Error deleting client record:', clientDeleteError);
      throw new Error('Failed to delete client record');
    } else {
      console.log('Successfully deleted client record');
    }
    
    // Delete client logo from storage if it exists
    try {
      const { error: deleteLogoError } = await supabase.storage
        .from('client-logos')
        .remove([`${clientId}/logo.png`, `${clientId}/logo.jpg`, `${clientId}/logo.jpeg`]);
      
      if (deleteLogoError) {
        console.log('Note: Could not delete logo files:', deleteLogoError.message);
      }
    } catch (err) {
      console.log('Note: Error during logo cleanup:', err);
    }
    
    return new Response(
      JSON.stringify({ success: true, client_id: clientId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in handleDeleteClient:', error);
    throw error;
  }
}
