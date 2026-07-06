
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.22.0";
import { getSupabaseUrl, getSupabaseServiceRoleKey } from '../_shared/env.ts';
import { validateIPWhitelist } from '../_shared/safe-school/ipValidator.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = getSupabaseUrl();
const supabaseServiceKey = getSupabaseServiceRoleKey();

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Fetch ALL vehicle types once and return both the map and the full list
async function fetchAllVehicleTypes(supabase: any): Promise<{ map: Map<string, any>; list: any[] }> {
  const { data } = await supabase
    .from('vehicle_type')
    .select('id, name, icon')
    .order('name', { ascending: true });
  const list = data || [];
  const map = new Map(list.map((vt: any) => [vt.id, vt]));
  return { map, list };
}

async function enrichWithVehicleTypes(supabase: any, vehicles: any[]) {
  const { map: vehicleTypeMap } = await fetchAllVehicleTypes(supabase);

  return vehicles.map((v: any) => {
    const vt = vehicleTypeMap.get(v.type);
    const challans = Array.isArray(v.vehicle_challans) ? v.vehicle_challans : [];
    return {
      ...v,
      vehicle_type_name: vt?.name ?? null,
      vehicle_type_icon: vt?.icon ?? null,
      vehicle_challans: challans.length > 0 ? challans[0] : null,
    };
  });
}

// Separate query function for search — handles ilike filter across vehicle fields
async function queryVehiclesWithSearch(
  supabase: any,
  clientId: string | null,
  search: string,
  status: string,
  typeId: string,
  page: number,
  pageSize: number,
) {
  const offset = (page - 1) * pageSize;

  // Fetch vehicle types and vehicles in parallel
  const [{ map: vehicleTypeMap, list: vehicleTypeList }, queryResult] = await Promise.all([
    fetchAllVehicleTypes(supabase),
    (async () => {
      let query = supabase
        .from('vehicles')
        .select('*, vehicle_challans(*)', { count: 'exact' })
        .or(`registration_number.ilike.%${search}%,make.ilike.%${search}%,model.ilike.%${search}%,internal_vehicle_name.ilike.%${search}%`);

      if (clientId) query = query.eq('client_id', clientId);
      if (status && status !== 'all') query = query.eq('status', status);
      if (typeId && typeId !== 'all') query = query.eq('type', typeId);

      query = query.order('created_at', { ascending: false }).range(offset, offset + pageSize - 1);
      return query;
    })(),
  ]);

  const { data, error, count } = queryResult;
  if (error) throw error;

  const enriched = (data || []).map((v: any) => {
    const vt = vehicleTypeMap.get(v.type);
    const challans = Array.isArray(v.vehicle_challans) ? v.vehicle_challans : [];
    return { ...v, vehicle_type_name: vt?.name ?? null, vehicle_type_icon: vt?.icon ?? null, vehicle_challans: challans.length > 0 ? challans[0] : null };
  });

  const totalCount = count ?? 0;

  return {
    vehicles: enriched,
    vehicle_types: vehicleTypeList,
    total_count: totalCount,
    page,
    page_size: pageSize,
    total_pages: Math.max(1, Math.ceil(totalCount / pageSize)),
  };
}

// ─── Main handler ──────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const url = new URL(req.url);

    // Derive operation from URL path segment after /vehicles/
    // e.g. /functions/v1/vehicles/create → "create"
    //      /functions/v1/vehicles        → "" (legacy)
    const pathSegments = url.pathname.split('/').filter(Boolean);
    const vehiclesIdx = pathSegments.lastIndexOf('vehicles');
    const pathOperation = vehiclesIdx !== -1 ? (pathSegments[vehiclesIdx + 1] ?? '') : '';
    const path = url.pathname.split('/').pop();

    if (req.method === 'POST') {
      const body = await req.json();
      // Path-based operation takes priority; fall back to body.operation for legacy callers
      const operation = pathOperation || body.operation;

      // ── list (paginated) ───────────────────────────────────────────────────
      if (operation === 'list') {
        const {
          clientId,
          page = 1,
          pageSize = 10,
          search = '',
          status = '',
          typeId = '',
        } = body;

        if (clientId) {
          const ipValidation = await validateIPWhitelist(supabase, req, clientId, url.pathname);
          if (!ipValidation.allowed) {
            return new Response(
              JSON.stringify({ error: 'IP_NOT_WHITELISTED', message: 'Access denied. Your IP address is not whitelisted for this client.' }),
              { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
            );
          }
        }

        if (search && search.trim()) {
          const result = await queryVehiclesWithSearch(supabase, clientId, search.trim(), status, typeId, page, pageSize);
          return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const offset = (page - 1) * pageSize;

        // Fetch vehicle types and paginated vehicles in parallel — ONE round trip
        const [{ map: vehicleTypeMap, list: vehicleTypeList }, queryResult] = await Promise.all([
          fetchAllVehicleTypes(supabase),
          (async () => {
            let q = supabase
              .from('vehicles')
              .select('*, vehicle_challans(*)', { count: 'exact' });

            if (clientId) q = q.eq('client_id', clientId);
            if (status && status !== 'all') q = q.eq('status', status);
            if (typeId && typeId !== 'all') q = q.eq('type', typeId);

            return q.order('created_at', { ascending: false }).range(offset, offset + pageSize - 1);
          })(),
        ]);

        const { data, error, count } = queryResult;
        if (error) throw error;

        const enriched = (data || []).map((v: any) => {
          const vt = vehicleTypeMap.get(v.type);
          const challans = Array.isArray(v.vehicle_challans) ? v.vehicle_challans : [];
          return { ...v, vehicle_type_name: vt?.name ?? null, vehicle_type_icon: vt?.icon ?? null, vehicle_challans: challans.length > 0 ? challans[0] : null };
        });

        const totalCount = count ?? 0;

        return new Response(
          JSON.stringify({
            vehicles: enriched,
            vehicle_types: vehicleTypeList,
            total_count: totalCount,
            page,
            page_size: pageSize,
            total_pages: Math.max(1, Math.ceil(totalCount / pageSize)),
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }

      // ── list_all (no pagination — for challans page, export, etc.) ─────────
      if (operation === 'list_all') {
        const { clientId } = body;

        if (clientId) {
          const ipValidation = await validateIPWhitelist(supabase, req, clientId, url.pathname);
          if (!ipValidation.allowed) {
            return new Response(
              JSON.stringify({ error: 'IP_NOT_WHITELISTED', message: 'Access denied. Your IP address is not whitelisted for this client.' }),
              { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
            );
          }
        }

        let query = supabase.from('vehicles').select('*, vehicle_challans(*)');
        if (clientId) query = query.eq('client_id', clientId);
        query = query.order('created_at', { ascending: false });

        const { data, error } = await query;
        if (error) throw error;

        const enriched = await enrichWithVehicleTypes(supabase, data || []);
        return new Response(JSON.stringify({ vehicles: enriched }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // ── get_by_id ──────────────────────────────────────────────────────────
      if (operation === 'get_by_id') {
        const { id, clientId } = body;

        let query = supabase
          .from('vehicles')
          .select('*, vehicle_challans(*)')
          .eq('id', id);

        if (clientId) query = query.eq('client_id', clientId);

        const { data, error } = await query.single();
        if (error) throw error;

        const [enriched] = await enrichWithVehicleTypes(supabase, [data]);
        return new Response(JSON.stringify({ vehicle: enriched }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // ── get_vehicle_challans ───────────────────────────────────────────────
      if (operation === 'get_vehicle_challans') {
        const { vehicleId } = body;

        const { data, error } = await supabase
          .from('vehicle_challans')
          .select('*')
          .eq('vehicle_id', vehicleId)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;
        return new Response(JSON.stringify({ vehicleChallans: data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // ── get_vehicle_documents ─────────────────────────────────────────────
      if (operation === 'get_vehicle_documents') {
        const { vehicleId, clientId } = body;

        if (!vehicleId || !clientId) {
          return new Response(JSON.stringify({ error: 'Vehicle ID and client ID are required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { data: vehicle, error: vehicleError } = await supabase
          .from('vehicles')
          .select('id')
          .eq('id', vehicleId)
          .eq('client_id', clientId)
          .maybeSingle();

        if (vehicleError) throw vehicleError;
        if (!vehicle) {
          return new Response(JSON.stringify({ documents: [] }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { data, error } = await supabase
          .from('vehicle_documents')
          .select('documents')
          .eq('vehicle_id', vehicleId)
          .maybeSingle();

        if (error) throw error;
        return new Response(JSON.stringify({ documents: data?.documents || [] }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // ── create ─────────────────────────────────────────────────────────────
      if (operation === 'create') {
        const { vehicleData, clientId } = body;

        if (clientId) {
          const ipValidation = await validateIPWhitelist(supabase, req, clientId, url.pathname);
          if (!ipValidation.allowed) {
            return new Response(
              JSON.stringify({ error: 'IP_NOT_WHITELISTED', message: 'Access denied. Your IP address is not whitelisted for this client.' }),
              { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
            );
          }
        }

        const processedData = {
          ...vehicleData,
          year: vehicleData.year ? parseInt(vehicleData.year) : null,
          capacity: vehicleData.capacity ? parseInt(vehicleData.capacity) : null,
          employee_id: vehicleData.employee_id || null,
        };

        if (processedData.employee_id) {
          const { data: employee, error: empError } = await supabase
            .from('employees')
            .select('id')
            .eq('id', processedData.employee_id)
            .single();
          if (empError || !employee) {
            return new Response(JSON.stringify({ error: 'Invalid employee_id provided' }), {
              status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }

        const { data, error } = await supabase.from('vehicles').insert([processedData]).select().single();
        if (error) throw error;

        const [enriched] = await enrichWithVehicleTypes(supabase, [data]);
        return new Response(JSON.stringify({ vehicle: enriched }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // ── update ─────────────────────────────────────────────────────────────
      if (operation === 'update') {
        const { id, updates } = body;

        const processedUpdates = {
          ...updates,
          year: updates.year ? parseInt(updates.year) : undefined,
          capacity: updates.capacity ? parseInt(updates.capacity) : null,
        };

        if (processedUpdates.year === undefined) delete processedUpdates.year;
        if (processedUpdates.capacity === '' || processedUpdates.capacity === undefined) processedUpdates.capacity = null;

        if (processedUpdates.employee_id) {
          const { data: employee, error: empError } = await supabase
            .from('employees')
            .select('id')
            .eq('id', processedUpdates.employee_id)
            .single();
          if (empError || !employee) {
            return new Response(JSON.stringify({ error: 'Invalid employee_id provided' }), {
              status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }

        const { data, error } = await supabase.from('vehicles').update(processedUpdates).eq('id', id).select().single();
        if (error) throw error;

        const [enriched] = await enrichWithVehicleTypes(supabase, [data]);
        return new Response(JSON.stringify({ vehicle: enriched }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // ── delete ─────────────────────────────────────────────────────────────
      if (operation === 'delete') {
        const { id } = body;
        const { error } = await supabase.from('vehicles').delete().eq('id', id);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // ── check_existing_registrations (for import validation) ───────────────
      if (operation === 'check_existing_registrations') {
        const { registrationNumbers, clientId } = body;
        const { data, error } = await supabase
          .from('vehicles')
          .select('registration_number')
          .in('registration_number', registrationNumbers)
          .eq('client_id', clientId);
        if (error) throw error;
        return new Response(
          JSON.stringify({ registrationNumbers: (data || []).map((v: any) => v.registration_number) }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }

      // ── list_vehicle_types ─────────────────────────────────────────────────
      if (operation === 'list_vehicle_types') {
        const { data, error } = await supabase
          .from('vehicle_type')
          .select('id, name, icon')
          .order('name', { ascending: true });
        if (error) throw error;
        return new Response(JSON.stringify({ vehicleTypes: data || [] }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ error: 'Unknown operation' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Legacy REST routes (kept for backward compatibility) ──────────────────

    const clientId = url.searchParams.get('client_id');

    if (clientId) {
      const ipValidation = await validateIPWhitelist(supabase, req, clientId, url.pathname);
      if (!ipValidation.allowed) {
        return new Response(
          JSON.stringify({ error: 'IP_NOT_WHITELISTED', message: 'Access denied. Your IP address is not whitelisted for this client.' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
    }

    if (req.method === 'GET' && path === 'vehicles') {
      let query = supabase.from('vehicles').select('*, vehicle_challans(*)');
      if (clientId) query = query.eq('client_id', clientId);
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      const enriched = await enrichWithVehicleTypes(supabase, data || []);
      return new Response(JSON.stringify({ vehicles: enriched }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'GET' && path !== 'vehicles') {
      const vehicleId = path;
      const { data, error } = await supabase.from('vehicles').select('*, vehicle_challans(*)').eq('id', vehicleId!).single();
      if (error) throw error;
      const [enriched] = await enrichWithVehicleTypes(supabase, [data]);
      return new Response(JSON.stringify({ vehicle: enriched }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'DELETE') {
      const vehicleId = path;
      const { error } = await supabase.from('vehicles').delete().eq('id', vehicleId!);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Not Found' }), {
      status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('Error in vehicles function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
