import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase client with environment variables
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface ClientData {
  id?: string;
  name: string;
  email?: string;
  contact_person?: string;
  phone?: string;
  active: boolean;
  logo?: string;
  client_logo?: string;
  institution_type?: string;
  client_type_id?: string;
  allowed_domains?: string;
  super_admin_allowed_domain?: string;
  auth_providers?: string;
  moduleAccess?: Record<string, boolean>;
  superAdminEmail?: string;
  clientTypeId?: string;
}

interface ModuleInfo {
  name: string;
  module_id: string;
  is_admin: boolean;
}

// Check if super admin email domain is allowed
function isSuperAdminEmailDomainAllowed(email: string, allowedDomains: string | null): boolean {
  if (!email || !allowedDomains) return true; // If no restrictions, allow all
  
  const emailDomain = email.split('@')[1]?.toLowerCase();
  if (!emailDomain) return false;
  
  const domainsArray = allowedDomains.split(',');
  return domainsArray.some(domain => domain.toLowerCase() === emailDomain);
}

// Helper function to upload logo to storage and return public URL
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
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('client-logos')
      .getPublicUrl(fileName);
    
    console.log('Logo uploaded successfully, public URL:', urlData.publicUrl);
    return urlData.publicUrl;
  } catch (err) {
    console.error('Error in uploadLogoToStorage:', err);
    return null;
  }
}

// Helper function to create employee from super admin email
async function createEmployeeFromSuperAdminEmail(clientId: string, superAdminEmail: string) {
  try {
    // Extract employee_id from the email (part before @ symbol)
    const employeeId = superAdminEmail.split('@')[0];
    
    // Create the employee record
    const employeeData = {
      employee_id: employeeId,
      first_name: employeeId, // Using the part before @ as first name
      last_name: '', // Empty last name
      email: superAdminEmail,
      department: 'Admin',
      employee_type: 'permanent',
      status: true,
      is_super_admin: true,
      client_id: clientId,
      joining_date: new Date().toISOString()
    };

    // Check if employee already exists with this email and client_id
    const { data: existingEmployee, error: checkError } = await supabase
      .from('employees')
      .select('*')
      .eq('email', superAdminEmail)
      .eq('client_id', clientId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking for existing employee:', checkError);
      return null;
    }

    // If employee exists, return the existing record
    if (existingEmployee) {
      console.log('Employee already exists for this client:', existingEmployee);
      return existingEmployee;
    }

    // Insert new employee
    const { data, error } = await supabase
      .from('employees')
      .insert([employeeData])
      .select('*')
      .single();

    if (error) {
      console.error("Error creating employee from super admin email:", error);
      return null;
    }

    console.log('Created new super admin employee:', data);
    return data;
  } catch (err) {
    console.error('Error in createEmployeeFromSuperAdminEmail:', err);
    return null;
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
    
    // Update existing employee if email changed
    if (existingEmployee.email !== superAdminEmail) {
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const requestBody = await req.json()
    console.log('Full request body:', JSON.stringify(requestBody, null, 2))
    
    const { operation, client } = requestBody
    console.log('Client management operation:', operation)
    console.log('Client data received:', {
      ...client,
      logo: client.logo ? 'Logo data present' : 'No logo data'
    })

    switch (operation) {
      case 'create':
        return await handleCreateClient(client)
      case 'update':
        return await handleUpdateClient(client)
      case 'delete':
        return await handleDeleteClient(client)
      default:
        throw new Error(`Unknown operation: ${operation}`)
    }
  } catch (error) {
    console.error('Error in client-management function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function handleCreateClient(clientData: any) {
  console.log('Creating client with data:', {
    ...clientData,
    logo: clientData.logo ? 'Logo data present' : 'No logo data'
  });
  
  try {
    const { id: clientId, modules, superAdminEmail, clientTypeId, logo, ...clientInfo } = clientData;
    
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
    
    // Prepare client data for insertion
    const clientRecord = {
      id: clientId,
      name: clientInfo.name || '',
      email: clientInfo.email || null,
      contact_person: clientInfo.contactPerson || null,
      phone: clientInfo.phone || null,
      active: clientInfo.active !== undefined ? clientInfo.active : true,
      institution_type: clientInfo.institutionType || null,
      allowed_domains: clientInfo.allowedDomains || null,
      super_admin_allowed_domain: clientInfo.superAdminAllowedDomains || null,
      auth_providers: clientInfo.authProviders || null,
      client_type_id: clientTypeId || null,
      client_logo: clientLogoUrl || null,
      creation_date: new Date().toISOString()
    };
    
    console.log('Inserting client record into database...');
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
    
    // Process module access - client now exists in database
    if (modules && modules.length > 0) {
      console.log('Processing module access for newly created client...');
      const moduleSuccess = await processModuleAccess(clientId, modules, false);
      if (!moduleSuccess) {
        throw new Error('Failed to process module access');
      }
    }
    
    // Create super admin employee if email provided
    if (superAdminEmail) {
      const employee = await createEmployeeFromSuperAdminEmail(clientId, superAdminEmail);
      if (!employee) {
        console.error('Failed to create super admin employee');
      }
    }
    
    return new Response(
      JSON.stringify({ success: true, client_id: clientId, client_logo_url: clientLogoUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in handleCreateClient:', error);
    throw error;
  }
}

async function handleUpdateClient(clientData: any) {
  console.log('Updating client with data:', {
    ...clientData,
    logo: clientData.logo ? 'Logo data present' : 'No logo data'
  });
  
  try {
    const { id: clientId, modules, superAdminEmail, clientTypeId, logo } = clientData;
    
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
    
    // Update client record with client type and logo URL
    const updateData: any = {};
    
    if (clientTypeId) {
      updateData.client_type_id = clientTypeId;
    }
    
    if (clientLogoUrl) {
      updateData.client_logo = clientLogoUrl;
    }
    
    // Only update if there's data to update
    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await supabase
        .from('clients')
        .update(updateData)
        .eq('id', clientId);
        
      if (updateError) {
        console.error('Error updating client with logo and type:', updateError);
      } else {
        console.log('Successfully updated client with logo and type');
      }
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
