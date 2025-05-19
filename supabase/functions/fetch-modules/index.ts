
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Define CORS headers for browser access
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the auth context of the function
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: req.headers.get('Authorization')! } },
      }
    );

    // Parse request parameters - support both userInfo and explicit level request
    const requestBody = await req.json();
    const { userInfo, fetchLevel, employeeId, email, employeeInfo } = requestBody;
    
    // Log user details if provided
    if (userInfo) {
      console.log(`User requesting modules: ${JSON.stringify({
        id: userInfo.id,
        email: userInfo.email,
        role: userInfo.role,
        isSaasOwner: userInfo.isSaasOwner,
        provider: userInfo.provider || 'none'
      })}`);
    } else {
      console.log('No user info provided with module request');
    }
    
    // Log employee info if provided
    if (employeeInfo) {
      console.log(`Employee info provided: ${JSON.stringify({
        id: employeeInfo.id,
        clientId: employeeInfo.clientId,
        email: employeeInfo.email,
        firstName: employeeInfo.firstName,
        lastName: employeeInfo.lastName,
        isSuperAdmin: employeeInfo.isSuperAdmin,
        department: employeeInfo.department,
        employeeType: employeeInfo.employeeType,
        status: employeeInfo.status,
        employeeId: employeeInfo.employeeId
      })}`);
    }
    
    // Determine level based on explicit request or user role
    let level;
    if (fetchLevel) {
      level = fetchLevel;
      console.log(`Explicit module level requested: ${level}`);
    } else {
      level = userInfo?.role === 'saas_owner' || userInfo?.isSaasOwner ? 'backoffice' : 'client';
      console.log(`Determined module level: ${level} based on user role`);
    }
    
    // ENHANCED LOGIC: For client level, use employee_id to get client_id and their specific modules
    let modules = [];
    let employeeData = null;
    
    if (level === 'client') {
      console.log(`Fetching client modules`);
      
      // Determine employee ID from multiple sources - prioritize provided employeeInfo
      let empId = null;
      let clientId = null;
      
      if (employeeInfo && employeeInfo.id) {
        empId = employeeInfo.id;
        clientId = employeeInfo.clientId;
        console.log(`Using provided employee info: ID=${empId}, clientId=${clientId}`);
        
        // Store the comprehensive employee data to return with the response
        employeeData = {
          id: employeeInfo.id,
          clientId: employeeInfo.clientId,
          email: employeeInfo.email,
          firstName: employeeInfo.firstName,
          lastName: employeeInfo.lastName,
          isSuperAdmin: employeeInfo.isSuperAdmin,
          department: employeeInfo.department,
          employeeType: employeeInfo.employeeType,
          status: employeeInfo.status,
          employeeId: employeeInfo.employeeId
        };
      } 
      // If no employeeInfo but employeeId is provided, use that
      else if (employeeId) {
        empId = employeeId;
        console.log(`Using provided employee ID: ${empId}`);
      } 
      // If neither employeeInfo nor employeeId is provided but email is available, lookup employee
      else if (email || userInfo?.email) {
        const emailToUse = email || userInfo?.email;
        console.log(`Looking up employee by email: ${emailToUse}`);
        
        const { data: employeeData, error: employeeError } = await supabase
          .from('employees')
          .select('id, client_id, email, first_name, last_name, is_super_admin, department, employee_type, status, employee_id')
          .eq('email', emailToUse.toLowerCase())
          .single();
        
        if (employeeError) {
          console.error('Error finding employee by email:', employeeError);
        } else if (employeeData) {
          empId = employeeData.id;
          console.log(`Found employee ID: ${empId} for email: ${emailToUse}`);
        }
      }
      
      // Try to get employee info from provided ID or ID found from email
      if (empId && !employeeData) {
        // Get employee record to find their client
        const { data: employeeDetails, error: employeeError } = await supabase
          .from('employees')
          .select('id, client_id, email, first_name, last_name, is_super_admin, department, employee_type, status, employee_id')
          .eq('id', empId)
          .single();
          
        if (employeeError) {
          console.error('Error fetching employee:', employeeError);
        } else if (employeeDetails && employeeDetails.client_id) {
          console.log(`Found employee ${employeeDetails.first_name} ${employeeDetails.last_name} with client ID: ${employeeDetails.client_id}`);
          clientId = employeeDetails.client_id;
          
          // Store the complete employee data to return with the response
          employeeData = {
            id: employeeDetails.id,
            clientId: employeeDetails.client_id,
            email: employeeDetails.email,
            firstName: employeeDetails.first_name,
            lastName: employeeDetails.last_name,
            isSuperAdmin: employeeDetails.is_super_admin,
            department: employeeDetails.department,
            employeeType: employeeDetails.employee_type,
            status: employeeDetails.status,
            employeeId: employeeDetails.employee_id
          };
        }
      }
      
      // Get client's configured modules with their access levels using clientId from any source
      if (clientId || (employeeData && employeeData.clientId)) {
        const clientIdToUse = clientId || employeeData.clientId;
        
        const { data: clientModules, error: clientModulesError } = await supabase
          .from('client_modules')
          .select('module_id, access_level')
          .eq('client_id', clientIdToUse);
          
        if (clientModulesError) {
          console.error('Error fetching client modules:', clientModulesError);
        } else if (clientModules && clientModules.length > 0) {
          console.log(`Found ${clientModules.length} module configurations for client ID: ${clientIdToUse}`);
          
          // Get module IDs from client modules
          const moduleIds = clientModules.map(cm => cm.module_id);
          console.log(`Module IDs to fetch: ${moduleIds.join(', ')}`);
          
          // Create a map of access levels by module ID
          const accessLevelsByModuleId = {};
          clientModules.forEach(cm => {
            if (cm.module_id) {
              accessLevelsByModuleId[cm.module_id] = cm.access_level;
            }
          });
          
          // Fetch the module details
          const { data: modulesData, error: modulesError } = await supabase
            .from('modules')
            .select('*')
            .in('id', moduleIds);
            
          if (modulesError) {
            console.error('Error fetching modules by IDs:', modulesError);
          } else if (modulesData) {
            console.log(`Retrieved ${modulesData.length} modules from database`);
            
            // Always include dashboard module if it exists
            const dashboardModule = modulesData.find(module => module.name.toLowerCase() === 'dashboard');
            
            // Add access_level to each module
            modules = modulesData.map(module => ({
              ...module,
              access_level: accessLevelsByModuleId[module.id] || {},
              // Map standard permission keys
              key: mapModuleToPermissionKey(module.name)
            }));
            
            // Make sure dashboard is included if it exists
            if (dashboardModule) {
              console.log('Dashboard module included automatically');
            } else {
              // If dashboard is not found in database modules, create a default one
              console.log('Adding default dashboard module');
              modules.unshift({
                id: 'dashboard-default',
                name: 'Dashboard',
                icon: 'LayoutDashboard',
                level: 'client',
                key: 'dashboard',
                access_level: {}
              });
            }
            
            console.log(`Returning ${modules.length} modules with their access levels`);
          }
        } else {
          console.log(`No module configurations found for client ID: ${clientIdToUse}`);
        }
      }
    }
    
    // If no modules found through enhanced client logic, use standard query
    if (modules.length === 0) {
      console.log('Using standard module query logic');
      
      // Query the modules table
      let query = supabase.from('modules').select('*');
      
      if (level === 'backoffice') {
        // For backoffice users, fetch modules with level = 'backoffice'
        console.log('Fetching backoffice modules');
        query = query.eq('level', 'backoffice');
      } else if (level === 'client') {
        // For client users, fetch modules with level != 'backoffice'
        console.log('Fetching client modules');
        query = query.neq('level', 'backoffice');
      } else if (level === 'all') {
        // Fetch all modules if explicitly requested
        console.log('Fetching all modules');
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching modules:', error);
        throw error;
      }
      
      modules = (data || []).map(module => ({
        ...module,
        key: mapModuleToPermissionKey(module.name)
      }));
      
      // Always ensure dashboard is present for standard query
      if (!modules.some(m => m.name.toLowerCase() === 'dashboard')) {
        console.log('Adding default dashboard module to standard query results');
        modules.unshift({
          id: 'dashboard-default',
          name: 'Dashboard',
          icon: 'LayoutDashboard',
          level: level,
          key: 'dashboard',
          access_level: {}
        });
      }
    }
    
    console.log(`Successfully fetched ${modules.length} modules`);
    
    // Return the modules data along with employee information
    return new Response(
      JSON.stringify({ 
        modules,
        employee: employeeData,  // Include the employee data in the response
        success: true 
      }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        } 
      }
    );

  } catch (error) {
    console.error('Error fetching modules:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      { 
        status: 400, 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        } 
      }
    );
  }
});

// Helper function to map module names to standard permission keys
function mapModuleToPermissionKey(moduleName: string): string | null {
  if (!moduleName) return null;
  
  const name = moduleName.toLowerCase();
  
  if (name === 'dashboard') return 'dashboard';
  if (name === 'incidents') return 'incidentReporting';
  if (name === 'assessments') return 'assessmentUser';
  if (name === 'employee verification') return 'employeeVerificationAdmin';
  if (name === 'grievances') return 'grievancesAdmin';
  if (name === 'transport safety') return 'transportSafetyAdmin';
  if (name === 'edusafe resources') return 'eduSafeResourceAccess';
  if (name === 'users') return 'users';
  if (name === 'settings') return 'configuration';
  
  // Default: Convert module name to snake_case for consistency
  return name.replace(/\s+/g, '_');
}
