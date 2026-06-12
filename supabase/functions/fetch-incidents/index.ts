
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getSupabaseUrl, getSupabaseServiceRoleKey } from '../_shared/env.ts';
import { validateIPWhitelist } from '../_shared/safe-school/ipValidator.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
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
      clientTypeId,
      page = 1,
      pageSize = 10,
      search = '',
      category = '',
      subcategory = '',
      status = '',
      priority = '',
      location = '',
      dateFrom = '',
      dateTo = '',
      hasIncidentAdmin,
      incidentId,
    } = body;

    if (!clientId) {
      throw new Error('Client ID is required');
    }

    // Validate IP whitelist
    const url = new URL(req.url);
    const ipValidation = await validateIPWhitelist(supabaseClient, req, clientId, url.pathname);
    if (!ipValidation.allowed) {
      return new Response(
        JSON.stringify({ error: 'IP_NOT_WHITELISTED', message: 'Access denied. Your IP address is not whitelisted for this client.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── get_config ──────────────────────────────────────────────────────────
    if (operation === 'get_config') {
      const typeFilter = clientTypeId
        ? `client_type_id.eq.${clientTypeId},client_type_id.is.null`
        : null;

      let reportTypesQuery = supabaseClient
        .from('incident_report_types')
        .select('id, name, description')
        .eq('client_id', clientId)
        .eq('is_active', true);
      if (typeFilter) reportTypesQuery = reportTypesQuery.or(typeFilter);

      let categoriesQuery = supabaseClient
        .from('incident_categories')
        .select('id, name, description')
        .eq('client_id', clientId)
        .eq('is_active', true);
      if (typeFilter) categoriesQuery = categoriesQuery.or(typeFilter);

      let subcategoriesQuery = supabaseClient
        .from('incident_subcategories')
        .select('id, name, category_id')
        .eq('client_id', clientId)
        .eq('is_active', true);
      if (typeFilter) subcategoriesQuery = subcategoriesQuery.or(typeFilter);

      let prioritiesQuery = supabaseClient
        .from('incident_priorities')
        .select('id, name, color, weight')
        .eq('client_id', clientId)
        .eq('is_active', true)
        .order('weight', { ascending: true });
      if (typeFilter) prioritiesQuery = prioritiesQuery.or(typeFilter);

      const [
        reportTypesRes,
        categoriesRes,
        subcategoriesRes,
        locationsRes,
        facilitiesRes,
        prioritiesRes,
        statusRes,
        employeesRes,
        studentsRes,
      ] = await Promise.all([
        reportTypesQuery,
        categoriesQuery,
        subcategoriesQuery,
        (() => {
          let q = supabaseClient.from('campuses').select('id, name').eq('client_id', clientId);
          if (typeFilter) q = q.or(typeFilter);
          return q;
        })(),
        (() => {
          let q = supabaseClient.from('facilities').select('id, name, campus_id').eq('client_id', clientId);
          if (typeFilter) q = q.or(typeFilter);
          return q;
        })(),
        prioritiesQuery,
        supabaseClient.from('incident_status').select('id, name'),
        supabaseClient.from('employees').select('id, first_name, last_name, email').eq('client_id', clientId).eq('status', true).not('email', 'is', null).neq('email', ''),
        supabaseClient.from('students').select('*, grade_info:grades!students_grade_id_fkey(id,name), section_info:sections!students_section_id_fkey(id,name), campus_info:campuses!students_campus_id_fkey(id,name)').eq('client_id', clientId).order('created_at', { ascending: false }),
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
            students: studentsRes.data || [],
          },
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── get_stats ────────────────────────────────────────────────────────────
    if (operation === 'get_stats') {
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
        const s = (inc as any).incident_status?.name;
        if (s === 'Open') stats.open++;
        else if (s === 'In Progress') stats.inProgress++;
        else if (s === 'Closed') stats.closed++;
      }

      return new Response(JSON.stringify({ success: true, data: stats }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── get_incident_detail ──────────────────────────────────────────────────
    if (operation === 'get_incident_detail') {
      if (!incidentId) throw new Error('Incident ID is required');

      let detailQuery = supabaseClient
        .from('incidents')
        .select(`
          *,
          incident_report_types:type_id(id, name),
          incident_categories:category_id(id, name),
          incident_subcategories:subcategory_id(id, name),
          campuses:location_id(id, name),
          facilities:facility_id(id, name),
          incident_priorities:priority_id(id, name),
          incident_status:status_id(id, name),
          created_by_employee:employees!created_by(id, first_name, last_name),
          assigned_employee:employees!assigned_to(id, first_name, last_name)
        `)
        .eq('id', incidentId)
        .eq('client_id', clientId);

      const { data: incident, error } = await detailQuery.single();

      if (error) throw error;

      return new Response(JSON.stringify({ success: true, incident }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── paginated incident list (default) ────────────────────────────────────
    const isAdmin = isSuperAdmin === true || hasIncidentAdmin === true;

    // Resolve filter IDs in parallel
    const [categoryRes, subcategoryRes, locationRes, priorityRes, statusRes] = await Promise.all([
      category ? supabaseClient.from('incident_categories').select('id').eq('name', category).eq('client_id', clientId).limit(1).maybeSingle() : Promise.resolve({ data: null }),
      subcategory ? supabaseClient.from('incident_subcategories').select('id').eq('name', subcategory).eq('client_id', clientId).limit(1).maybeSingle() : Promise.resolve({ data: null }),
      location ? supabaseClient.from('campuses').select('id').eq('name', location).eq('client_id', clientId).limit(1).maybeSingle() : Promise.resolve({ data: null }),
      priority ? supabaseClient.from('incident_priorities').select('id').eq('name', priority).eq('client_id', clientId).limit(1).maybeSingle() : Promise.resolve({ data: null }),
      status ? supabaseClient.from('incident_status').select('id').eq('name', status).limit(1).maybeSingle() : Promise.resolve({ data: null }),
    ]);

    let baseQuery = supabaseClient
      .from('incidents')
      .select(`
        id, ticket_id, description, date, people_involved, documents, comments,
        created_at, updated_at, created_by, assigned_to, recommended_action,
        root_cause_analysis, learning_points, action_taken, reopen,
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

    if (!isAdmin && employeeId) {
      baseQuery = baseQuery.or(`created_by.eq.${employeeId},assigned_to.eq.${employeeId}`);
    }
    if (search) {
      baseQuery = baseQuery.or(`ticket_id.ilike.%${search}%,description.ilike.%${search}%`);
    }
    if (categoryRes.data?.id) baseQuery = baseQuery.eq('category_id', categoryRes.data.id);
    if (subcategoryRes.data?.id) baseQuery = baseQuery.eq('subcategory_id', subcategoryRes.data.id);
    if (locationRes.data?.id) baseQuery = baseQuery.eq('location_id', locationRes.data.id);
    if (priorityRes.data?.id) baseQuery = baseQuery.eq('priority_id', priorityRes.data.id);
    if (statusRes.data?.id) baseQuery = baseQuery.eq('status_id', statusRes.data.id);
    if (dateFrom) baseQuery = baseQuery.gte('date', dateFrom);
    if (dateTo) baseQuery = baseQuery.lte('date', dateTo);

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const { data: incidents, error: incError, count } = await baseQuery
      .order('created_at', { ascending: false })
      .range(from, to);

    if (incError) throw incError;

    // Fetch config alongside incidents for the form dropdowns
    let rtQuery = supabaseClient.from('incident_report_types').select('id, name, description').eq('is_active', true);
    if (clientTypeId) rtQuery = rtQuery.eq('client_type_id', clientTypeId);
    else rtQuery = rtQuery.eq('client_id', clientId);

    let prQuery = supabaseClient.from('incident_priorities').select('id, name, color, weight').eq('is_active', true).order('weight', { ascending: true });
    if (clientTypeId) prQuery = prQuery.eq('client_type_id', clientTypeId);
    else prQuery = prQuery.eq('client_id', clientId);

    const [rtRes, catRes, subRes, locRes, facRes, prRes, stRes, empRes, stuRes] = await Promise.all([
      rtQuery,
      supabaseClient.from('incident_categories').select('id, name, description').eq('is_active', true).eq('client_id', clientId),
      supabaseClient.from('incident_subcategories').select('id, name, category_id').eq('is_active', true).eq('client_id', clientId),
      supabaseClient.from('campuses').select('id, name').eq('client_id', clientId),
      supabaseClient.from('facilities').select('id, name, campus_id').eq('client_id', clientId),
      prQuery,
      supabaseClient.from('incident_status').select('id, name'),
      supabaseClient.from('employees').select('id, first_name, last_name, email').eq('client_id', clientId).eq('status', true).not('email', 'is', null).neq('email', ''),
      supabaseClient.from('students').select('*, grade_info:grades!students_grade_id_fkey(id,name), section_info:sections!students_section_id_fkey(id,name), campus_info:campuses!students_campus_id_fkey(id,name)').eq('client_id', clientId).order('created_at', { ascending: false }),
    ]);

    const totalCount = count ?? 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    return new Response(
      JSON.stringify({
        success: true,
        incidents: incidents || [],
        totalCount,
        currentPage: page,
        totalPages,
        hasMore: page < totalPages,
        config: {
          reportTypes: rtRes.data || [],
          categories: catRes.data || [],
          subcategories: subRes.data || [],
          locations: locRes.data || [],
          facilities: facRes.data || [],
          priorities: prRes.data || [],
          statuses: stRes.data || [],
          employees: empRes.data || [],
          students: stuRes.data || [],
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in fetch-incidents function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
