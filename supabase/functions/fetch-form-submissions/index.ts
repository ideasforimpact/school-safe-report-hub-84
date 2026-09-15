
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { getSupabaseUrl, getSupabaseAnonKey } from '../_shared/env.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      getSupabaseUrl(),
      getSupabaseAnonKey(),
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const {
      form_id,
      client_id,
      page = 1,
      page_size = 10,
      status,
      date_from,
      date_to,
      search,
      is_super_admin,
      has_grievance_admin,
    } = await req.json();

    if (!form_id && !client_id) {
      return new Response(
        JSON.stringify({
          error: 'form_id or client_id is required',
          code: 'MISSING_FILTER'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Grievances are not tied to individual employees, so non-admins see no records.
    // Only module Admins or org super admins can view the grievance list.
    if (is_super_admin !== true && has_grievance_admin !== true) {
      return new Response(
        JSON.stringify({
          success: true,
          data: [],
          total: 0,
          total_pages: 1,
          stats: { total: 0, pending: 0, acknowledged: 0 },
          message: 'Submissions fetched successfully'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Base filters shared by the paginated list query and the (status-independent) stats
    // queries below — form/client scope plus the optional date range and search term.
    const applyBaseFilters = (q: any) => {
      if (form_id) {
        q = q.eq('form_id', form_id);
      } else if (client_id) {
        q = q.eq('client_id', client_id);
      }
      if (date_from) q = q.gte('created_at', date_from);
      if (date_to) q = q.lte('created_at', date_to);
      if (search && String(search).trim()) {
        const term = String(search).trim()
          .replace(/\\/g, '\\\\')
          .replace(/%/g, '\\%')
          .replace(/_/g, '\\_')
          .replace(/"/g, '\\"');
        const pattern = `"%${term}%"`;
        q = q.or(
          `submitter_name.ilike.${pattern},submitter_phone.ilike.${pattern},status.ilike.${pattern}`
        );
      }
      return q;
    };

    const pageNum = Math.max(1, Number(page) || 1);
    const pageSizeNum = Math.max(1, Number(page_size) || 10);
    const from = (pageNum - 1) * pageSizeNum;
    const to = from + pageSizeNum - 1;

    let query = applyBaseFilters(
      supabaseClient.from('form_submissions').select('*', { count: 'exact' })
    ).order('created_at', { ascending: false }) as any;

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query.range(from, to);

    if (error) {
      console.error('Error fetching submissions:', error);
      throw new Error(`Failed to fetch submissions: ${error.message}`);
    }

    // Stats — counted across the same form/client + date scope, independent of the
    // status filter above, so header totals ("Total/Open/Acknowledged") reflect the
    // whole grievance set rather than collapsing to whatever status is selected.
    const { count: totalCount, error: totalError } = await applyBaseFilters(
      supabaseClient.from('form_submissions').select('id', { count: 'exact', head: true })
    );
    const { count: pendingCount, error: pendingError } = await applyBaseFilters(
      supabaseClient.from('form_submissions').select('id', { count: 'exact', head: true })
    ).eq('status', 'pending');
    const { count: acknowledgedCount, error: acknowledgedError } = await applyBaseFilters(
      supabaseClient.from('form_submissions').select('id', { count: 'exact', head: true })
    ).eq('status', 'acknowledged');

    if (totalError) console.error('Error counting total submissions:', totalError);
    if (pendingError) console.error('Error counting pending submissions:', pendingError);
    if (acknowledgedError) console.error('Error counting acknowledged submissions:', acknowledgedError);

    return new Response(
      JSON.stringify({
        success: true,
        data: data || [],
        total: count ?? 0,
        total_pages: Math.max(1, Math.ceil((count ?? 0) / pageSizeNum)),
        stats: {
          total: totalCount ?? 0,
          pending: pendingCount ?? 0,
          acknowledged: acknowledgedCount ?? 0,
        },
        message: 'Submissions fetched successfully'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in fetch-form-submissions function:', error);
    return new Response(
      JSON.stringify({
        error: (error as Error).message || 'Internal server error',
        code: 'INTERNAL_ERROR'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
