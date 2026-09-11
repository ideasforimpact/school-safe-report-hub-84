
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

// ─── Status-priority sort (mirrors src/utils/transport-safety/documentStatusUtils.ts
// getVehicleStatusSortPriority / hasExpiredDocuments / hasExpiringDocuments /
// getLatestVerificationTimestamp — kept in sync so pagination reflects the same
// "most urgent first" ordering the client would compute. This has to happen
// server-side, BEFORE the page is sliced: sorting only the rows a page already
// contains can reorder them within that page, but it can never move a row onto
// or off of page 1 when its status changes — only sorting the whole filtered
// set first and then slicing can do that.) ────────────────────────────────────
function getLatestVerificationLogRow(row: any): any[] | null {
  const data = row.verification_data;
  if (!Array.isArray(data) || data.length === 0) return null;
  const logEntry = data.find((item: any) => item?.field === 'verification_log');
  if (!logEntry || !logEntry.value || typeof logEntry.value !== 'object') return null;
  const timestamps = Object.keys(logEntry.value);
  if (timestamps.length === 0) return null;
  timestamps.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  return logEntry.value[timestamps[0]] || null;
}

// Uses `verification_date`, not the `verification_log` timestamps inside
// `verification_data` — vehicle-verify's "documents already up to date" skip
// path (still-valid vehicles within 15 days of any expiry) deliberately
// reuses cached RC data and never appends a new verification_log entry, but
// it DOES always advance verification_date (see vehicle-verify/index.ts, both
// the full-check and skip branches). Keying off verification_log would make a
// rechecked-but-still-valid vehicle look like it was never rechecked at all.
function getLatestVerificationTimestampRow(row: any): number {
  if (!row.verification_date) return 0;
  const time = new Date(row.verification_date).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function findVerificationFieldRow(log: any[] | null, fieldName: string): any {
  if (!log) return undefined;
  return log.find((item: any) => item?.field === fieldName);
}

function getDocumentStatusFromDateRow(expiryDateStr: unknown): 'valid' | 'expired' | 'expiring_soon' | 'missing' {
  if (!expiryDateStr) return 'missing';
  const expiryDate = new Date(String(expiryDateStr));
  if (isNaN(expiryDate.getTime())) return 'missing';
  const currentDate = new Date();
  if (expiryDate < currentDate) return 'expired';
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(currentDate.getDate() + 30);
  if (expiryDate < thirtyDaysFromNow) return 'expiring_soon';
  return 'valid';
}

function isElectricVehicleRow(row: any): boolean {
  const field = findVerificationFieldRow(getLatestVerificationLogRow(row), 'fuel_type');
  const fuelType = field?.value;
  if (typeof fuelType !== 'string') return false;
  const normalized = fuelType.toUpperCase();
  if (normalized.includes('HYBRID')) return false;
  return normalized.includes('ELECTRIC') || normalized.includes('BOV') || /\bEV\b/.test(normalized);
}

function getDocumentStatusRow(row: any, docType: 'fitness' | 'insurance' | 'pollution'): 'valid' | 'expired' | 'expiring_soon' | 'missing' | 'not_applicable' {
  const data = row.verification_data;
  if (!Array.isArray(data) || data.length === 0) return 'missing';
  if (docType === 'pollution' && isElectricVehicleRow(row)) return 'not_applicable';
  const fieldName = docType === 'fitness' ? 'fit_up_to' : docType === 'insurance' ? 'insurance_upto' : 'pucc_upto';
  const field = findVerificationFieldRow(getLatestVerificationLogRow(row), fieldName);
  if (!field || !field.value) return 'missing';
  return getDocumentStatusFromDateRow(field.value);
}

function hasExpiredDocumentsRow(row: any): boolean {
  const data = row.verification_data;
  if (!Array.isArray(data) || data.length === 0) return false;
  return (['fitness', 'insurance', 'pollution'] as const).some((docType) => {
    const status = getDocumentStatusRow(row, docType);
    return status === 'expired' || status === 'missing';
  });
}

function hasExpiringDocumentsRow(row: any): boolean {
  const data = row.verification_data;
  if (!Array.isArray(data) || data.length === 0) return false;
  return (['fitness', 'insurance', 'pollution'] as const).some(
    (docType) => getDocumentStatusRow(row, docType) === 'expiring_soon',
  );
}

// 0 - brand-new, never safety-checked; 1 - checked and expired/missing;
// 2 - expiring soon; 3 - valid. New vehicles rank above already-checked
// expired ones so adding a vehicle always surfaces it at the very top.
function getVehicleStatusSortPriorityRow(row: any): number {
  const data = row.verification_data;
  if (!Array.isArray(data) || data.length === 0) return 0;
  if (hasExpiredDocumentsRow(row)) return 1;
  if (hasExpiringDocumentsRow(row)) return 2;
  return 3;
}

function sortVehiclesByStatusPriority(rows: any[]): any[] {
  return [...rows].sort((a, b) => {
    const priorityDiff = getVehicleStatusSortPriorityRow(a) - getVehicleStatusSortPriorityRow(b);
    if (priorityDiff !== 0) return priorityDiff;
    const aIsNew = !Array.isArray(a.verification_data) || a.verification_data.length === 0;
    if (aIsNew) {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    return getLatestVerificationTimestampRow(b) - getLatestVerificationTimestampRow(a);
  });
}

// ─── Pending-challan detection (mirrors src/services/transport-safety/vehicleService.ts
// getPendingChallansFromVehicleChallans — kept in sync so the badge/count/filter logic
// agrees between the edge function and the client) ──────────────────────────────
const normalizeChallanStatus = (status?: string): string =>
  String(status || '').trim().toUpperCase();

const isDisposedChallanStatus = (status?: string): boolean =>
  ['DISPOSED', 'PAID', 'CASH'].includes(normalizeChallanStatus(status));

function dedupeChallans(challans: any[]): any[] {
  if (!Array.isArray(challans)) return [];

  const hasValue = (value: unknown) => {
    if (value === null || value === undefined) return false;
    if (Array.isArray(value)) return value.length > 0;
    return String(value).trim() !== '';
  };

  const mergeChallan = (base: any, incoming: any) => {
    const merged = { ...base };
    Object.entries(incoming || {}).forEach(([key, value]) => {
      if (!hasValue(merged[key]) && hasValue(value)) merged[key] = value;
    });
    return merged;
  };

  const getDedupKey = (challan: any) => {
    const challanNumber = String(challan?.challan_number || challan?.challan_no || '').trim().toUpperCase();
    if (challanNumber) return `number:${challanNumber}`;
    const challanDate = String(challan?.challan_date_time || challan?.challan_date || '').trim();
    const amount = String(challan?.amount ?? challan?.challan_amount ?? '').trim();
    const status = normalizeChallanStatus(challan?.challan_status);
    return `fallback:${challanDate}|${amount}|${status}`;
  };

  const deduped = new Map<string, any>();
  challans.forEach((challan) => {
    const key = getDedupKey(challan);
    const existing = deduped.get(key);
    deduped.set(key, existing ? mergeChallan(existing, challan) : challan);
  });

  return Array.from(deduped.values());
}

function getPendingChallansFromVehicleChallans(vehicleChallans: any): any[] {
  const logs = vehicleChallans?.challan_history_log;
  if (!logs || typeof logs !== 'object') return [];

  const successLogs = Object.entries(logs).filter(
    ([, entry]: [string, any]) => entry?.data?.status_code === 200,
  );
  if (successLogs.length === 0) return [];

  successLogs.sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime());

  const [, latestLog] = successLogs[0] as [string, any];
  const challanData = latestLog?.data?.data;
  if (!challanData) return [];

  const rawChallans = challanData?.challan_details?.challans || challanData?.challan_data || [];
  if (!Array.isArray(rawChallans)) return [];
  const challans = dedupeChallans(rawChallans);

  return challans.filter((c) => c?.challan_status && !isDisposedChallanStatus(c.challan_status));
}

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

  // Fetch vehicle types and ALL matching vehicles (unpaginated) in parallel —
  // pagination is applied below, AFTER sorting by status priority, so a row
  // can actually move onto/off of a page when its status changes.
  const [{ map: vehicleTypeMap, list: vehicleTypeList }, queryResult] = await Promise.all([
    fetchAllVehicleTypes(supabase),
    (async () => {
      let query = supabase
        .from('vehicles')
        .select('*, vehicle_challans(*)')
        .or(`registration_number.ilike.%${search}%,make.ilike.%${search}%,model.ilike.%${search}%,internal_vehicle_name.ilike.%${search}%`);

      if (clientId) query = query.eq('client_id', clientId);
      if (status && status !== 'all') query = query.eq('status', status);
      if (typeId && typeId !== 'all') query = query.eq('type', typeId);

      return query;
    })(),
  ]);

  const { data, error } = queryResult;
  if (error) throw error;

  const sorted = sortVehiclesByStatusPriority(data || []);
  const totalCount = sorted.length;
  const pageRows = sorted.slice(offset, offset + pageSize);

  const enriched = pageRows.map((v: any) => {
    const vt = vehicleTypeMap.get(v.type);
    const challans = Array.isArray(v.vehicle_challans) ? v.vehicle_challans : [];
    return { ...v, vehicle_type_name: vt?.name ?? null, vehicle_type_icon: vt?.icon ?? null, vehicle_challans: challans.length > 0 ? challans[0] : null };
  });

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

        // Fetch vehicle types and ALL matching vehicles (unpaginated) in
        // parallel — ONE round trip. Pagination is applied below, AFTER
        // sorting by status priority (see sortVehiclesByStatusPriority above),
        // so a vehicle that's added or safety-checked actually moves onto/off
        // of page 1 instead of just reordering within whatever page a
        // recency-only DB query happened to return.
        const [{ map: vehicleTypeMap, list: vehicleTypeList }, queryResult] = await Promise.all([
          fetchAllVehicleTypes(supabase),
          (async () => {
            let q = supabase
              .from('vehicles')
              .select('*, vehicle_challans(*)');

            if (clientId) q = q.eq('client_id', clientId);
            if (status && status !== 'all') q = q.eq('status', status);
            if (typeId && typeId !== 'all') q = q.eq('type', typeId);

            return q;
          })(),
        ]);

        const { data, error } = queryResult;
        if (error) throw error;

        const sorted = sortVehiclesByStatusPriority(data || []);
        const totalCount = sorted.length;
        const pageRows = sorted.slice(offset, offset + pageSize);

        const enriched = pageRows.map((v: any) => {
          const vt = vehicleTypeMap.get(v.type);
          const challans = Array.isArray(v.vehicle_challans) ? v.vehicle_challans : [];
          return { ...v, vehicle_type_name: vt?.name ?? null, vehicle_type_icon: vt?.icon ?? null, vehicle_challans: challans.length > 0 ? challans[0] : null };
        });

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

      // ── list_all (no pagination — for challans page, export, document-status filters, etc.) ─
      if (operation === 'list_all') {
        const { clientId, search = '', status = '', typeId = '' } = body;

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
        if (search && search.trim()) {
          const term = search.trim();
          query = query.or(`registration_number.ilike.%${term}%,make.ilike.%${term}%,model.ilike.%${term}%,internal_vehicle_name.ilike.%${term}%`);
        }
        if (status && status !== 'all') query = query.eq('status', status);
        if (typeId && typeId !== 'all') query = query.eq('type', typeId);

        const { data, error } = await query;
        if (error) throw error;

        // Keep ordering consistent with the paginated `list`/search queries above.
        const sorted = sortVehiclesByStatusPriority(data || []);
        const enriched = await enrichWithVehicleTypes(supabase, sorted);
        return new Response(JSON.stringify({ vehicles: enriched }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // ── list_with_challans (no pagination — only vehicles with an actual
      // PENDING (non-disposed) challan, for the Transport Challans page).
      // The inner join drops vehicles with no challan record at all; the
      // getPendingChallansFromVehicleChallans filter below then drops any
      // vehicle whose latest challans are all disposed/paid, so the response
      // already matches what the page displays — no fetch-all-then-filter. ──
      if (operation === 'list_with_challans') {
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

        let query = supabase
          .from('vehicles')
          .select('*, vehicle_challans!inner(*)');
        if (clientId) query = query.eq('client_id', clientId);
        query = query.order('created_at', { ascending: false });

        const { data, error } = await query;
        if (error) throw error;

        const enriched = await enrichWithVehicleTypes(supabase, data || []);
        const withPending = enriched.filter(
          (v: any) => getPendingChallansFromVehicleChallans(v.vehicle_challans).length > 0,
        );

        return new Response(JSON.stringify({ vehicles: withPending }), {
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

      // ── get_vehicle_renewal_history ──────────────────────────────────────────
      if (operation === 'get_vehicle_renewal_history') {
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
          return new Response(JSON.stringify({ renewals: [] }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { data, error } = await supabase
          .from('vehicle_certificate_renewals')
          .select('*')
          .eq('vehicle_id', vehicleId)
          .order('verification_timestamp', { ascending: false });

        if (error) throw error;
        return new Response(JSON.stringify({ renewals: data || [] }), {
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

      // ── bulk_create (vehicle import) ────────────────────────────────────────
      if (operation === 'bulk_create') {
        const { vehicles, clientId } = body;

        if (!Array.isArray(vehicles) || vehicles.length === 0) {
          return new Response(JSON.stringify({ vehicles: [] }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (clientId) {
          const ipValidation = await validateIPWhitelist(supabase, req, clientId, url.pathname);
          if (!ipValidation.allowed) {
            return new Response(
              JSON.stringify({ error: 'IP_NOT_WHITELISTED', message: 'Access denied. Your IP address is not whitelisted for this client.' }),
              { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
            );
          }
        }

        const processedRows = vehicles.map((v: any) => ({
          ...v,
          year: v.year ? parseInt(v.year) : null,
          capacity: v.capacity ? parseInt(v.capacity) : null,
          employee_id: v.employee_id || null,
        }));

        const employeeIds = Array.from(
          new Set(processedRows.map((v: any) => v.employee_id).filter(Boolean)),
        );
        if (employeeIds.length > 0) {
          const { data: employeesFound, error: empError } = await supabase
            .from('employees')
            .select('id')
            .in('id', employeeIds);
          if (empError) throw empError;
          const foundIds = new Set((employeesFound || []).map((e: any) => e.id));
          const missing = employeeIds.some((id) => !foundIds.has(id));
          if (missing) {
            return new Response(JSON.stringify({ error: 'Invalid employee_id provided' }), {
              status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }

        const { error } = await supabase.from('vehicles').insert(processedRows);
        if (error) throw error;

        return new Response(JSON.stringify({ success: true, count: processedRows.length }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // ── update ─────────────────────────────────────────────────────────────
      if (operation === 'update') {
        const { id, updates, changedBy } = body;

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

        // Track the vehicle's prior status so we can open/close a maintenance
        // history period when `status` transitions across the 'maintenance' boundary.
        let previousStatus: string | null = null;
        if (processedUpdates.status) {
          const { data: existingVehicle, error: statusLookupError } = await supabase
            .from('vehicles')
            .select('status')
            .eq('id', id)
            .maybeSingle();
          if (statusLookupError) {
            // Don't guess: an unreadable prior status must not be treated as "no prior
            // status", which would misfire a spurious maintenance-history insert below.
            console.error('Error looking up vehicle status before update:', statusLookupError);
          } else {
            previousStatus = existingVehicle?.status ?? null;
          }
        }

        const { data, error } = await supabase.from('vehicles').update(processedUpdates).eq('id', id).select().single();
        if (error) throw error;

        if (processedUpdates.status && processedUpdates.status !== previousStatus) {
          if (processedUpdates.status === 'maintenance') {
            const { error: insertError } = await supabase.from('vehicle_maintenance_history').insert({
              vehicle_id: id,
              client_id: data.client_id ?? null,
              changed_by: changedBy ?? null,
            });
            // 23505 = unique_violation on idx_vehicle_maintenance_history_open_period —
            // a concurrent request already opened a period for this vehicle; that's the
            // constraint doing its job, not a failure worth surfacing to the caller.
            if (insertError && insertError.code !== '23505') {
              console.error('Error opening vehicle maintenance history period:', insertError);
            }
          } else if (previousStatus === 'maintenance') {
            const { data: openPeriod, error: openPeriodError } = await supabase
              .from('vehicle_maintenance_history')
              .select('id, started_at')
              .eq('vehicle_id', id)
              .is('ended_at', null)
              .order('started_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            if (openPeriodError) {
              console.error('Error looking up open vehicle maintenance history period:', openPeriodError);
            } else if (openPeriod) {
              const endedAt = new Date();
              const startedAt = new Date(openPeriod.started_at);
              const startDate = new Date(startedAt.getFullYear(), startedAt.getMonth(), startedAt.getDate());
              const endDate = new Date(endedAt.getFullYear(), endedAt.getMonth(), endedAt.getDate());
              const durationDays = Math.max(
                0,
                Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
              );

              const { error: closeError } = await supabase
                .from('vehicle_maintenance_history')
                .update({ ended_at: endedAt.toISOString(), duration_days: durationDays })
                .eq('id', openPeriod.id);
              if (closeError) {
                console.error('Error closing vehicle maintenance history period:', closeError);
              }
            }
          }
        }

        const [enriched] = await enrichWithVehicleTypes(supabase, [data]);
        return new Response(JSON.stringify({ vehicle: enriched }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // ── get_maintenance_history ───────────────────────────────────────────
      if (operation === 'get_maintenance_history') {
        const { vehicleId } = body;

        const { data, error } = await supabase
          .from('vehicle_maintenance_history')
          .select('*')
          .eq('vehicle_id', vehicleId)
          .order('started_at', { ascending: false });

        if (error) throw error;

        return new Response(JSON.stringify({ history: data || [] }), {
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
