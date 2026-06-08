
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { getSupabaseUrl, getSupabaseAnonKey } from '../_shared/env.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
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

    const { form_id, client_id, page = 1, page_size = 10, status, date_from, date_to } = await req.json();

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

    const offset = (page - 1) * page_size;

    let countQuery = supabaseClient
      .from('form_submissions')
      .select('*', { count: 'exact', head: true }) as any;

    let dataQuery = supabaseClient
      .from('form_submissions')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + page_size - 1) as any;

    if (form_id) {
      countQuery = countQuery.eq('form_id', form_id);
      dataQuery = dataQuery.eq('form_id', form_id);
    } else if (client_id) {
      countQuery = countQuery.eq('client_id', client_id);
      dataQuery = dataQuery.eq('client_id', client_id);
    }

    if (status && status !== 'all') {
      countQuery = countQuery.eq('status', status);
      dataQuery = dataQuery.eq('status', status);
    }

    if (date_from) {
      countQuery = countQuery.gte('created_at', date_from);
      dataQuery = dataQuery.gte('created_at', date_from);
    }

    if (date_to) {
      countQuery = countQuery.lte('created_at', date_to);
      dataQuery = dataQuery.lte('created_at', date_to);
    }

    // Stats queries (unfiltered by status/date — always scoped to form/client only)
    const baseFilter = form_id
      ? (q: any) => q.eq('form_id', form_id)
      : (q: any) => q.eq('client_id', client_id);

    const pendingCountQuery = baseFilter(
      supabaseClient.from('form_submissions').select('*', { count: 'exact', head: true })
    ).eq('status', 'pending');

    const acknowledgedCountQuery = baseFilter(
      supabaseClient.from('form_submissions').select('*', { count: 'exact', head: true })
    ).eq('status', 'acknowledged');

    const [countResult, dataResult, pendingResult, acknowledgedResult] = await Promise.all([
      countQuery, dataQuery, pendingCountQuery, acknowledgedCountQuery
    ]);

    if (countResult.error) {
      throw new Error(`Failed to count submissions: ${countResult.error.message}`);
    }
    if (dataResult.error) {
      throw new Error(`Failed to fetch submissions: ${dataResult.error.message}`);
    }

    const total = countResult.count ?? 0;
    const pendingCount = pendingResult.count ?? 0;
    const acknowledgedCount = acknowledgedResult.count ?? 0;

    return new Response(
      JSON.stringify({
        success: true,
        data: dataResult.data || [],
        total,
        page,
        page_size,
        total_pages: Math.ceil(total / page_size),
        stats: {
          pending: pendingCount,
          acknowledged: acknowledgedCount,
          total: pendingCount + acknowledgedCount,
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
