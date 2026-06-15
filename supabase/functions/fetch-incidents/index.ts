
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getSupabaseUrl, getSupabaseServiceRoleKey } from '../_shared/env.ts';
import { validateIPWhitelist } from '../_shared/safe-school/ipValidator.ts';

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
    const supabaseClient = createClient(
      getSupabaseUrl(),
      getSupabaseServiceRoleKey()
    );

    const body = await req.json();
    const { 
      operation, 
      clientId, 
      employeeId, 
      isSuperAdmin, 
      page = 1, 
      pageSize = 10, 
      search = '',
      category = '',
      subcategory = '',
      status = '',
      priority = '',
      location = '',
      dateFrom = '',
      dateTo = ''
    } = body;

    if (!clientId) {
      throw new Error('Client ID is required');
    }

    // Validate IP whitelist
    const url = new URL(req.url);
    const ipValidation = await validateIPWhitelist(
      supabaseClient,
      req,
      clientId,
      url.pathname
    );
    
    if (!ipValidation.allowed) {
      return new Response(
        JSON.stringify({ 
          error: 'IP_NOT_WHITELISTED',
          message: 'Access denied. Your IP address is not whitelisted for this client.'
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (operation === 'get_stats') {
      const { hasIncidentAdmin } = body;
      let query = supabaseClient
        .from('incidents')
        .select('id, created_by, assigned_to, incident_status!status_id(name)')
        .eq('client_id', clientId);

      if (!isSuperAdmin && !hasIncidentAdmin) {
        query = query.or(`created_by.eq.${employeeId},assigned_to.eq.${employeeId}`);
      }

      const { data, error } = await query;
      if (error) throw error;

      const stats = { total: 0, open: 0, inProgress: 0, closed: 0 };
      for (const inc of data ?? []) {
        stats.total++;
        const status = (inc as any).incident_status?.name;
        if (status === 'Open') stats.open++;
        else if (status === 'In Progress') stats.inProgress++;
        else if (status === 'Closed') stats.closed++;
      }

      return new Response(JSON.stringify({ success: true, data: stats }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (operation === 'get_config') {
      console.log(`Fetching incident form configuration for client: ${clientId}`);

      // Fetch everything in parallel
      const [
        reportTypesRes,
        categoriesRes,
        subcategoriesRes,
        locationsRes,
        facilitiesRes,
        prioritiesRes,
        statusRes,
        employeesRes,
        studentsRes
      ] = await Promise.all([
        supabaseClient.from('incident_report_types').select('id, name, description').eq('is_active', true).eq('client_id', clientId),
        supabaseClient.from('incident_categories').select('id, name, description').eq('is_active', true).eq('client_id', clientId),
        supabaseClient.from('incident_subcategories').select('id, name, category_id').eq('is_active', true).eq('client_id', clientId),
        supabaseClient.from('campuses').select('id, name').eq('client_id', clientId),
        supabaseClient.from('facilities').select('id, name, campus_id').eq('client_id', clientId),
        supabaseClient.from('incident_priorities').select('id, name, color, weight').eq('is_active', true).eq('client_id', clientId).order('weight', { ascending: true }),
        supabaseClient.from('incident_status').select('id, name'),
        supabaseClient.from('employees').select('id, first_name, last_name, email').eq('client_id', clientId).eq('status', true).not('email', 'is', null).neq('email', ''),
        supabaseClient.from('students').select('*, grade_info:grades!students_grade_id_fkey(id,name), section_info:sections!students_section_id_fkey(id,name), campus_info:campuses!students_campus_id_fkey(id,name)').eq('client_id', clientId).order('created_at', { ascending: false })
      ]);

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            reportTypes: reportTypesRes.data || [],
            categories: categoriesRes.data || [],
            subcategories: subcategoriesRes.data || [],
            locations: locationsRes.data || [],
            facilities: facilitiesRes.data || [],
            priorities: prioritiesRes.data || [],
            statuses: statusRes.data || [],
            employees: employeesRes.data || [],
            students: studentsRes.data || []
          }
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (operation === 'get_incident_detail') {
      const { incidentId } = body;
      if (!incidentId) throw new Error('Incident ID is required');

      console.log('Fetching incident detail for ID:', incidentId);

      const [incidentRes, contributingFactorsRes] = await Promise.all([
        supabaseClient
          .from('incidents')
          .select(`
            *,
            type:incident_report_types(id, name),
            category:incident_categories(id, name),
            subcategory:incident_subcategories(id, name),
            location:campuses(id, name),
            status:incident_status(id, name),
            priority:incident_priorities(id, name),
            facility:facilities(id, name),
            created_by:employees!created_by(id, first_name, last_name, email),
            assigned_to:employees!assigned_to(id, first_name, last_name, email)
          `)
          .eq('id', incidentId)
          .single(),
        supabaseClient
          .from('contributing_factors')
          .select('id, name, weight')
          .eq('client_id', clientId)
          .order('name')
      ]);

      if (incidentRes.error) throw incidentRes.error;

      return new Response(
        JSON.stringify({
          success: true,
          incident: incidentRes.data,
          contributingFactors: contributingFactorsRes.data || []
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    console.log('Fetching incidents for client:', clientId);
    console.log('Employee ID:', employeeId);
    console.log('Is Super Admin:', isSuperAdmin);

    // Resolve filter names to IDs before building the query
    const [categoryIdRes, subcategoryIdRes, statusIdRes, priorityIdRes, locationIdRes] = await Promise.all([
      category ? supabaseClient.from('incident_categories').select('id').eq('name', category).eq('client_id', clientId).limit(1).maybeSingle() : Promise.resolve({ data: null }),
      subcategory ? supabaseClient.from('incident_subcategories').select('id').eq('name', subcategory).eq('client_id', clientId).limit(1).maybeSingle() : Promise.resolve({ data: null }),
      status ? supabaseClient.from('incident_status').select('id').eq('name', status).limit(1).maybeSingle() : Promise.resolve({ data: null }),
      priority ? supabaseClient.from('incident_priorities').select('id').eq('name', priority).limit(1).maybeSingle() : Promise.resolve({ data: null }),
      location ? supabaseClient.from('campuses').select('id').eq('name', location).eq('client_id', clientId).limit(1).maybeSingle() : Promise.resolve({ data: null }),
    ]);

    // Fetch incidents and config data in parallel
    const [incidentsRes, reportTypesRes, categoriesRes, subcategoriesRes, locationsRes, facilitiesRes, prioritiesRes, statusRes, employeesRes, studentsRes] = await Promise.all([
      // Fetch incidents with pagination and search
      (() => {
        let query = supabaseClient
          .from('incidents')
          .select(`
            id,
            ticket_id,
            description,
            date,
            people_involved,
            documents,
            comments,
            created_at,
            updated_at,
            created_by,
            assigned_to,
            recommended_action,
            incident_report_types:type_id(id, name),
            incident_categories:category_id(id, name),
            incident_subcategories:subcategory_id(id, name),
            campuses:location_id(id, name),
            facilities:facility_id(id, name),
            incident_priorities:priority_id(id, name),
            incident_status:status_id(id, name),
            created_by_employee:employees!created_by(id, first_name, last_name),
            assigned_employee:employees!assigned_to(id, first_name, last_name)
          `, { count: 'exact' })
          .eq('client_id', clientId);

        if (employeeId) {
          if (isSuperAdmin === true) {
            // Super admin can see all
          } else {
            query = query.or(`created_by.eq.${employeeId},assigned_to.eq.${employeeId}`);
          }
        } else {
          query = query.eq('created_by', 'non-existent-id');
        }

        // Apply search filter if provided
        if (search) {
          query = query.or(`ticket_id.ilike.%${search}%,description.ilike.%${search}%`);
        }

        // Apply filters using resolved IDs
        if (category) {
          const id = categoryIdRes.data?.id;
          query = id ? query.eq('category_id', id) : query.eq('category_id', 'no-match');
        }
        if (subcategory) {
          const id = subcategoryIdRes.data?.id;
          query = id ? query.eq('subcategory_id', id) : query.eq('subcategory_id', 'no-match');
        }
        if (status) {
          const id = statusIdRes.data?.id;
          query = id ? query.eq('status_id', id) : query.eq('status_id', 'no-match');
        }
        if (priority) {
          const id = priorityIdRes.data?.id;
          query = id ? query.eq('priority_id', id) : query.eq('priority_id', 'no-match');
        }
        if (location) {
          const id = locationIdRes.data?.id;
          query = id ? query.eq('location_id', id) : query.eq('location_id', 'no-match');
        }
        if (dateFrom) {
          query = query.gte('date', dateFrom);
        }
        if (dateTo) {
          query = query.lte('date', dateTo);
        }

        // Apply pagination
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        return query
          .order('created_at', { ascending: false })
          .range(from, to);
      })(),
      // Fetch config data
      supabaseClient.from('incident_report_types').select('id, name, description').eq('is_active', true).eq('client_id', clientId),
      supabaseClient.from('incident_categories').select('id, name, description').eq('is_active', true).eq('client_id', clientId),
      supabaseClient.from('incident_subcategories').select('id, name, category_id').eq('is_active', true).eq('client_id', clientId),
      supabaseClient.from('campuses').select('id, name').eq('client_id', clientId),
      supabaseClient.from('facilities').select('id, name, campus_id').eq('client_id', clientId),
      supabaseClient.from('incident_priorities').select('id, name, color, weight').eq('is_active', true).eq('client_id', clientId).order('weight', { ascending: true }),
      supabaseClient.from('incident_status').select('id, name'),
      supabaseClient.from('employees').select('id, first_name, last_name, email').eq('client_id', clientId).eq('status', true).not('email', 'is', null).neq('email', ''),
      supabaseClient.from('students').select('*, grade_info:grades!students_grade_id_fkey(id,name), section_info:sections!students_section_id_fkey(id,name), campus_info:campuses!students_campus_id_fkey(id,name)').eq('client_id', clientId).order('created_at', { ascending: false })
    ]);

    if (incidentsRes.error) {
      console.error('Error fetching incidents:', incidentsRes.error);
      throw new Error(`Failed to fetch incidents: ${incidentsRes.error.message}`);
    }

    console.log(`Successfully fetched ${incidentsRes.data?.length || 0} incidents and config for client ${clientId}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        incidents: incidentsRes.data || [],
        totalCount: incidentsRes.count || 0,
        config: {
          reportTypes: reportTypesRes.data || [],
          categories: categoriesRes.data || [],
          subcategories: subcategoriesRes.data || [],
          locations: locationsRes.data || [],
          facilities: facilitiesRes.data || [],
          priorities: prioritiesRes.data || [],
          statuses: statusRes.data || [],
          employees: employeesRes.data || [],
          students: studentsRes.data || []
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in fetch-incidents function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
