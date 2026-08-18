
import { supabase } from "@/integrations/supabase/client";
import { Vehicle, VehicleType, VehicleChallans, VehicleTypeOption, VehicleVerificationData } from "@/types/transportSafety";
import { UploadedDocument } from "@/types/fileTypes";

export type { VehicleTypeOption };

// Raw vehicle row as returned by the `vehicles` edge function (snake_case DB columns).
interface VehicleRow {
  id: string;
  registration_number: string;
  type: string;
  vehicle_type_name?: string | null;
  vehicle_type_icon?: string | null;
  internal_vehicle_name?: string | null;
  make: string;
  model: string;
  year: number | null;
  driver: string;
  route: string;
  capacity?: number | null;
  status: string;
  active?: boolean;
  client_id?: string;
  employee_id?: string | null;
  created_at: string;
  updated_at: string;
  verification_status?: string;
  verification_date?: string;
  verification_data?: RawVerificationItem[];
  current_rc_data?: unknown;
  provider?: string | null;
  status_code?: string | null;
  rc_status?: string | null;
  vehicle_chasi_number?: string | null;
  vehicle_engine_number?: string | null;
  vehicle_owner_name?: string | null;
  vehicle_challans?: VehicleChallans | null;
}

interface RawVerificationItem {
  field?: string;
  value?: unknown;
  verified?: unknown;
}

// Challan shape varies by provider (surepass/quickeyc), so only the fields we
// actually read are named; everything else is preserved via the index signature.
export interface RawChallan {
  challan_number?: string;
  challan_no?: string;
  challan_date_time?: string;
  challan_date?: string;
  amount?: string | number;
  challan_amount?: string | number;
  challan_status?: string;
  [key: string]: unknown;
}

// ─── Edge function invoker ────────────────────────────────────────────────────

async function invokeVehicles<T = unknown>(operation: string, payload: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await supabase.functions.invoke(`vehicles/${operation}`, {
    body: payload,
  });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data as T;
}

type RecentValue<T> = { at: number; value: T };

const DETAIL_READ_DEDUPE_MS = 1200;
const vehicleByIdInflight = new Map<string, Promise<Vehicle | null>>();
const vehicleByIdRecent = new Map<string, RecentValue<Vehicle | null>>();
const vehicleDocumentsInflight = new Map<string, Promise<UploadedDocument[]>>();
const vehicleDocumentsRecent = new Map<string, RecentValue<UploadedDocument[]>>();
const allVehiclesInflight = new Map<string, Promise<Vehicle[]>>();
const allVehiclesRecent = new Map<string, RecentValue<Vehicle[]>>();
const vehiclesWithChallansInflight = new Map<string, Promise<Vehicle[]>>();
const vehiclesWithChallansRecent = new Map<string, RecentValue<Vehicle[]>>();

// ─── Transform helpers ────────────────────────────────────────────────────────

const isReadOnlySwitchedWriteError = (error: unknown): boolean =>
  error instanceof Error &&
  (error.message.includes('Read-only switched client context') ||
    error.message.includes('Switched client permission denied:'));

function mapVehicle(v: VehicleRow): Vehicle {
  return {
    id: v.id,
    registrationNumber: v.registration_number,
    type: v.type as VehicleType,
    typeId: v.type,
    typeName: v.vehicle_type_name ?? undefined,
    vehicleTypeIcon: v.vehicle_type_icon ?? null,
    internalVehicleName: v.internal_vehicle_name,
    make: v.make,
    model: v.model,
    year: v.year,
    driver: v.driver,
    route: v.route,
    capacity: v.capacity,
    status: v.status as 'active' | 'maintenance' | 'inactive',
    active: v.active !== undefined ? v.active : true,
    clientId: v.client_id,
    employeeId: v.employee_id,
    documents: [],
    createdAt: v.created_at,
    updatedAt: v.updated_at,
    verificationStatus: v.verification_status,
    verificationDate: v.verification_date,
    verificationData: Array.isArray(v.verification_data)
      ? v.verification_data.map((item) => ({
          field: String(item.field || ''),
          value: item.value,
          verified: Boolean(item.verified),
        }))
      : [],
    currentRcData: v.current_rc_data,
    provider: v.provider,
    statusCode: v.status_code,
    rcStatus: v.rc_status,
    vehicleChasiNumber: v.vehicle_chasi_number ?? null,
    vehicleEngineNumber: v.vehicle_engine_number ?? null,
    vehicleOwnerName: v.vehicle_owner_name ?? null,
    vehicleChallans: v.vehicle_challans
      ? {
          id: v.vehicle_challans.id,
          vehicle_id: v.vehicle_challans.vehicle_id,
          latest_challan_data: v.vehicle_challans.latest_challan_data,
          challan_status: v.vehicle_challans.challan_status,
          challan_status_code: v.vehicle_challans.challan_status_code,
          challan_history_log: v.vehicle_challans.challan_history_log,
          provider: v.vehicle_challans.provider,
          success_api_count: v.vehicle_challans.success_api_count,
          error_api_count: v.vehicle_challans.error_api_count,
          created_at: v.vehicle_challans.created_at,
          updated_at: v.vehicle_challans.updated_at,
        }
      : undefined,
  };
}

// ─── Paginated list (server-side pagination + search) ─────────────────────────

export interface FetchVehiclesParams {
  clientId?: string;
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  typeId?: string;
}

export interface FetchVehiclesResult {
  vehicles: Vehicle[];
  vehicleTypes: VehicleTypeOption[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const fetchVehiclesPaginated = async (params: FetchVehiclesParams): Promise<FetchVehiclesResult> => {
  const { clientId, page = 1, pageSize = 10, search = '', status = '', typeId = '' } = params;

  const data = await invokeVehicles<{
    vehicles: VehicleRow[];
    vehicle_types: VehicleTypeOption[];
    total_count: number;
    page: number;
    page_size: number;
    total_pages: number;
  }>('list', { clientId, page, pageSize, search, status, typeId });

  return {
    vehicles: (data.vehicles || []).map(mapVehicle),
    vehicleTypes: data.vehicle_types || [],
    totalCount: data.total_count,
    page: data.page,
    pageSize: data.page_size,
    totalPages: data.total_pages,
  };
};

// ─── Get all vehicles (no pagination — for challans page, export, document-status filters) ─

export interface FetchAllVehiclesFilters {
  search?: string;
  status?: string;
  typeId?: string;
}

export const getAllVehicles = async (
  clientId?: string,
  filters?: FetchAllVehiclesFilters,
): Promise<Vehicle[]> => {
  const cacheKey = `${clientId || ''}:${filters?.search ?? ''}:${filters?.status ?? ''}:${filters?.typeId ?? ''}`;
  const recent = allVehiclesRecent.get(cacheKey);
  if (recent && Date.now() - recent.at < DETAIL_READ_DEDUPE_MS) return recent.value;

  const inflight = allVehiclesInflight.get(cacheKey);
  if (inflight) return inflight;

  const request = (async () => {
    const data = await invokeVehicles<{ vehicles: VehicleRow[] }>('list_all', {
      clientId,
      search: filters?.search ?? '',
      status: filters?.status ?? '',
      typeId: filters?.typeId ?? '',
    });
    const vehicles = (data.vehicles || []).map(mapVehicle);
    allVehiclesRecent.set(cacheKey, { at: Date.now(), value: vehicles });
    return vehicles;
  })().finally(() => {
    allVehiclesInflight.delete(cacheKey);
  });

  allVehiclesInflight.set(cacheKey, request);
  return request;
};

// ─── Get vehicle by ID ────────────────────────────────────────────────────────

export const getVehicleById = async (id: string, clientId?: string): Promise<Vehicle | null> => {
  const cacheKey = `${clientId || ''}:${id}`;
  const recent = vehicleByIdRecent.get(cacheKey);
  if (recent && Date.now() - recent.at < DETAIL_READ_DEDUPE_MS) return recent.value;

  const inflight = vehicleByIdInflight.get(cacheKey);
  if (inflight) return inflight;

  const request = (async () => {
    try {
      const data = await invokeVehicles<{ vehicle: VehicleRow | null }>('get_by_id', { id, clientId });
      const vehicle = data.vehicle ? mapVehicle(data.vehicle) : null;
      vehicleByIdRecent.set(cacheKey, { at: Date.now(), value: vehicle });
      return vehicle;
    } catch {
      return null;
    }
  })().finally(() => {
    vehicleByIdInflight.delete(cacheKey);
  });

  vehicleByIdInflight.set(cacheKey, request);
  return request;
};

// ─── Get uploaded vehicle documents ──────────────────────────────────────────

interface RawUploadedFile {
  name?: string;
  path?: string;
  url?: string;
  uploadedAt?: string;
}

interface RawUploadedDoc {
  name: string;
  type: string;
  uploadedAt: string;
  files: RawUploadedFile[];
}

function isRawUploadedDoc(doc: unknown): doc is RawUploadedDoc {
  if (!doc || typeof doc !== 'object') return false;
  const d = doc as Record<string, unknown>;
  return (
    typeof d.name === 'string' &&
    typeof d.type === 'string' &&
    typeof d.uploadedAt === 'string' &&
    Array.isArray(d.files)
  );
}

const mapUploadedDocuments = (documents: unknown): UploadedDocument[] => {
  if (!Array.isArray(documents)) return [];

  return documents
    .filter(isRawUploadedDoc)
    .map((doc) => ({
      name: doc.name,
      type: doc.type,
      uploadedAt: doc.uploadedAt,
      files: doc.files.map((file) => ({
        name: file.name || 'Unnamed file',
        path: file.path || '',
        url: file.url || '',
        uploadedAt: file.uploadedAt || doc.uploadedAt,
      })),
    }));
};

export const getVehicleDocuments = async (
  vehicleId: string,
  clientId?: string,
  options?: { force?: boolean },
): Promise<UploadedDocument[]> => {
  const cacheKey = `${clientId || ''}:${vehicleId}`;
  const recent = vehicleDocumentsRecent.get(cacheKey);
  if (!options?.force && recent && Date.now() - recent.at < DETAIL_READ_DEDUPE_MS) return recent.value;

  const inflight = vehicleDocumentsInflight.get(cacheKey);
  if (inflight) return inflight;

  const request = (async () => {
    const data = await invokeVehicles<{ documents?: unknown }>('get_vehicle_documents', { vehicleId, clientId });
    const documents = mapUploadedDocuments(data.documents);
    vehicleDocumentsRecent.set(cacheKey, { at: Date.now(), value: documents });
    return documents;
  })().finally(() => {
    vehicleDocumentsInflight.delete(cacheKey);
  });

  vehicleDocumentsInflight.set(cacheKey, request);
  return request;
};

// ─── Add a vehicle ────────────────────────────────────────────────────────────

export const addVehicle = async (
  vehicleData: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt' | 'documents'>,
): Promise<Vehicle | null> => {
  const dbVehicle: Record<string, unknown> = {
    registration_number: vehicleData.registrationNumber,
    type: vehicleData.typeId || vehicleData.type,
    make: vehicleData.make,
    model: vehicleData.model,
    year: null,
    driver: vehicleData.driver,
    route: vehicleData.route,
    capacity: vehicleData.capacity ? Number(vehicleData.capacity) : null,
    status: vehicleData.status,
    client_id: vehicleData.clientId,
    employee_id: vehicleData.employeeId || null,
    verification_status: vehicleData.verificationStatus,
    verification_date: vehicleData.verificationDate,
    verification_data: vehicleData.verificationData
      ? vehicleData.verificationData.map(item => ({
          field: item.field,
          value: item.value,
          verified: item.verified,
        }))
      : [],
  };

  if (vehicleData.internalVehicleName) {
    dbVehicle.internal_vehicle_name = vehicleData.internalVehicleName;
  }

  const data = await invokeVehicles<{ vehicle: VehicleRow | null }>('create', {
    vehicleData: dbVehicle,
    clientId: vehicleData.clientId,
  });

  return data.vehicle ? mapVehicle(data.vehicle) : null;
};

// ─── Bulk create vehicles (import) ───────────────────────────────────────────

export interface VehicleImportRow {
  registration_number: string;
  internal_vehicle_name: string;
  type: string;
  make: string;
  model: string;
  year: number | null;
  status: string;
  capacity: number | null;
  driver: string;
  route: string;
  active: boolean;
  client_id: string;
  employee_id: string;
}

export const bulkCreateVehicles = async (
  vehicles: VehicleImportRow[],
  clientId: string,
): Promise<void> => {
  await invokeVehicles('bulk_create', { vehicles, clientId });
};

// ─── Update a vehicle ─────────────────────────────────────────────────────────

export const updateVehicle = async (id: string, updates: Partial<Vehicle>): Promise<Vehicle | null> => {
  const dbUpdates: Record<string, unknown> = {};

  if (updates.registrationNumber) dbUpdates.registration_number = updates.registrationNumber;
  if (updates.typeId !== undefined) {
    dbUpdates.type = updates.typeId;
  } else if (updates.type) {
    dbUpdates.type = updates.type;
  }
  if (updates.internalVehicleName !== undefined) dbUpdates.internal_vehicle_name = updates.internalVehicleName || null;
  if (updates.make) dbUpdates.make = updates.make;
  if (updates.model) dbUpdates.model = updates.model;
  if (updates.year !== undefined) dbUpdates.year = updates.year ? Number(updates.year) : null;
  if (updates.driver) dbUpdates.driver = updates.driver;
  if (updates.route) dbUpdates.route = updates.route;
  if (updates.capacity !== undefined) dbUpdates.capacity = updates.capacity ? Number(updates.capacity) : null;
  if (updates.status) dbUpdates.status = updates.status;
  if (updates.active !== undefined) dbUpdates.active = updates.active;
  if (updates.clientId) dbUpdates.client_id = updates.clientId;
  if (updates.employeeId !== undefined) dbUpdates.employee_id = updates.employeeId;
  if (updates.verificationStatus) dbUpdates.verification_status = updates.verificationStatus;
  if (updates.verificationDate) dbUpdates.verification_date = updates.verificationDate;
  if (updates.verificationData) {
    dbUpdates.verification_data = updates.verificationData.map(item => ({
      field: item.field,
      value: item.value,
      verified: item.verified,
    }));
  }

  const data = await invokeVehicles<{ vehicle: VehicleRow | null }>('update', { id, updates: dbUpdates });
  return data.vehicle ? mapVehicle(data.vehicle) : null;
};

// ─── Delete a vehicle ─────────────────────────────────────────────────────────

export const deleteVehicle = async (id: string): Promise<boolean> => {
  try {
    await invokeVehicles('delete', { id });
    return true;
  } catch (error) {
    if (isReadOnlySwitchedWriteError(error)) throw error;
    console.error('Error in deleteVehicle:', error);
    return false;
  }
};

// ─── Import helpers (still use direct supabase — batch ops for import flow) ───

export const checkExistingRegistrations = async (
  registrationNumbers: string[],
  clientId: string,
): Promise<string[]> => {
  const data = await invokeVehicles<{ registrationNumbers: string[] }>('check_existing_registrations', {
    registrationNumbers,
    clientId,
  });
  return data.registrationNumbers || [];
};

// Vehicle types change rarely within a session — dedupe the several independent
// call sites (import, template downloads) that all hit list_vehicle_types.
const VEHICLE_TYPES_DEDUPE_MS = 60_000;
let vehicleTypesInflight: Promise<{ id: string; name: string }[]> | null = null;
let vehicleTypesRecent: RecentValue<{ id: string; name: string }[]> | null = null;

const fetchVehicleTypesRaw = async (): Promise<{ id: string; name: string }[]> => {
  if (vehicleTypesRecent && Date.now() - vehicleTypesRecent.at < VEHICLE_TYPES_DEDUPE_MS) {
    return vehicleTypesRecent.value;
  }
  if (vehicleTypesInflight) return vehicleTypesInflight;

  const request = (async () => {
    const data = await invokeVehicles<{ vehicleTypes: { id: string; name: string }[] }>('list_vehicle_types');
    const types = data.vehicleTypes || [];
    vehicleTypesRecent = { at: Date.now(), value: types };
    return types;
  })().finally(() => {
    vehicleTypesInflight = null;
  });

  vehicleTypesInflight = request;
  return request;
};

export const fetchVehicleTypeMap = async (): Promise<Record<string, string>> => {
  const types = await fetchVehicleTypesRaw();
  const map: Record<string, string> = {};
  types.forEach(v => {
    map[v.name.trim().toUpperCase()] = v.id;
  });
  return map;
};

export const fetchVehicleTypes = async (): Promise<string[]> => {
  const types = await fetchVehicleTypesRaw();
  return types.map(v => v.name.trim());
};

// ─── Get vehicle challans ─────────────────────────────────────────────────────

export const getVehicleChallans = async (vehicleId: string): Promise<VehicleChallans | null> => {
  try {
    const data = await invokeVehicles<{ vehicleChallans: VehicleChallans | null }>('get_vehicle_challans', { vehicleId });
    return data.vehicleChallans ?? null;
  } catch {
    return null;
  }
};

// ─── Challan utility functions ────────────────────────────────────────────────

const normalizeChallanStatus = (status?: string): string =>
  String(status || '').trim().toUpperCase();

const isDisposedChallanStatus = (status?: string): boolean =>
  ['DISPOSED', 'PAID', 'CASH'].includes(normalizeChallanStatus(status));

const dedupeChallans = (challans: RawChallan[]): RawChallan[] => {
  if (!Array.isArray(challans)) return [];

  const hasValue = (value: unknown) => {
    if (value === null || value === undefined) return false;
    if (Array.isArray(value)) return value.length > 0;
    return String(value).trim() !== '';
  };

  const mergeChallan = (base: RawChallan, incoming: RawChallan): RawChallan => {
    const merged: RawChallan = { ...base };
    Object.entries(incoming || {}).forEach(([key, value]) => {
      if (!hasValue(merged[key]) && hasValue(value)) merged[key] = value;
    });
    return merged;
  };

  const getDedupKey = (challan: RawChallan) => {
    const challanNumber = String(challan?.challan_number || challan?.challan_no || '').trim().toUpperCase();
    if (challanNumber) return `number:${challanNumber}`;
    const challanDate = String(challan?.challan_date_time || challan?.challan_date || '').trim();
    const amount = String(challan?.amount ?? challan?.challan_amount ?? '').trim();
    const status = normalizeChallanStatus(challan?.challan_status);
    return `fallback:${challanDate}|${amount}|${status}`;
  };

  const deduped = new Map<string, RawChallan>();
  challans.forEach((challan) => {
    const key = getDedupKey(challan);
    const existing = deduped.get(key);
    deduped.set(key, existing ? mergeChallan(existing, challan) : challan);
  });

  return Array.from(deduped.values());
};

export const extractChallansFromVehicleChallans = (vehicleChallans: VehicleChallans | null): RawChallan[] => {
  if (!vehicleChallans?.latest_challan_data) return [];

  const challanData = vehicleChallans.latest_challan_data;

  if (challanData?.data?.challan_details?.challans) {
    const challans = challanData.data.challan_details.challans;
    if (Array.isArray(challans)) return dedupeChallans(challans);
  }
  if (challanData?.data?.challan_data) {
    const challans = challanData.data.challan_data;
    if (Array.isArray(challans)) return dedupeChallans(challans);
  }
  if (challanData?.challan_details?.challans) {
    const challans = challanData.challan_details.challans;
    if (Array.isArray(challans)) return dedupeChallans(challans);
  }
  if (Array.isArray(challanData)) return dedupeChallans(challanData);
  if (Array.isArray(challanData?.data)) return dedupeChallans(challanData.data);

  return [];
};

interface RawChallanPayload {
  challan_details?: { challans?: RawChallan[] };
  challan_data?: RawChallan[];
}

interface ChallanLogEntry {
  data?: {
    status_code?: number;
    data?: RawChallanPayload;
  };
}

const getLatestSuccessChallanPayload = (
  vehicleChallans: VehicleChallans | null,
): RawChallanPayload | null => {
  const logs = vehicleChallans?.challan_history_log;
  if (!logs || typeof logs !== 'object') return null;

  const successLogs = Object.entries(logs).filter(
    ([, entry]: [string, ChallanLogEntry]) => entry?.data?.status_code === 200,
  );

  if (successLogs.length === 0) return null;

  successLogs.sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime());

  const [, latestLog] = successLogs[0] as [string, ChallanLogEntry];
  return latestLog?.data?.data ?? null;
};

// All challans (pending + paid/disposed) from the latest successful challan check.
export const getAllChallansFromVehicleChallans = (
  vehicleChallans: VehicleChallans | null,
): RawChallan[] => {
  const challanData = getLatestSuccessChallanPayload(vehicleChallans);
  if (!challanData) return [];

  const rawChallans =
    challanData?.challan_details?.challans || challanData?.challan_data || [];

  if (!Array.isArray(rawChallans)) return [];
  return dedupeChallans(rawChallans);
};

export const getPendingChallansFromVehicleChallans = (
  vehicleChallans: VehicleChallans | null,
): RawChallan[] =>
  getAllChallansFromVehicleChallans(vehicleChallans).filter(
    (c) => c?.challan_status && !isDisposedChallanStatus(c.challan_status),
  );

export const getPaidChallansFromVehicleChallans = (
  vehicleChallans: VehicleChallans | null,
): RawChallan[] =>
  getAllChallansFromVehicleChallans(vehicleChallans).filter(
    (c) => c?.challan_status && isDisposedChallanStatus(c.challan_status),
  );

// ─── Challan date-range filter ────────────────────────────────────────────────

export interface ChallanDateRange {
  from?: Date;
  to?: Date;
}

const parseChallanDate = (challan: RawChallan): Date | null => {
  const raw = challan?.challan_date_time || challan?.challan_date;
  if (!raw) return null;
  const date = new Date(String(raw));
  return Number.isNaN(date.getTime()) ? null : date;
};

export const filterChallansByDateRange = (
  challans: RawChallan[],
  range?: ChallanDateRange,
): RawChallan[] => {
  if (!range?.from && !range?.to) return challans;

  const from = range.from
    ? new Date(range.from.getFullYear(), range.from.getMonth(), range.from.getDate(), 0, 0, 0, 0)
    : null;
  const to = range.to
    ? new Date(range.to.getFullYear(), range.to.getMonth(), range.to.getDate(), 23, 59, 59, 999)
    : null;

  return challans.filter((challan) => {
    const date = parseChallanDate(challan);
    if (!date) return false;
    if (from && date < from) return false;
    if (to && date > to) return false;
    return true;
  });
};

// Legacy — kept for backward compatibility
export const getPendingChallans = (verificationData: VehicleVerificationData[] | undefined | null): RawChallan[] => {
  if (!Array.isArray(verificationData)) return [];

  const log = verificationData.find((v) => v.field === 'verification_log');
  if (!log?.value) return [];

  const latestKey = Object.keys(log.value).sort().pop();
  const latestLog = latestKey ? log.value[latestKey] : null;
  if (!Array.isArray(latestLog)) return [];

  const challanField = latestLog.find((f) => f?.field === 'challan_details');
  const allChallans = dedupeChallans(challanField?.value?.challan_details?.challans ?? []);
  return allChallans.filter(
    (c) => c?.challan_status && !isDisposedChallanStatus(c.challan_status),
  );
};

export const getVehiclesWithPendingChallans = async (clientId: string): Promise<Vehicle[]> => {
  const recent = vehiclesWithChallansRecent.get(clientId);
  if (recent && Date.now() - recent.at < DETAIL_READ_DEDUPE_MS) return recent.value;

  const inflight = vehiclesWithChallansInflight.get(clientId);
  if (inflight) return inflight;

  const request = (async () => {
    const data = await invokeVehicles<{ vehicles: VehicleRow[] }>('list_with_challans', { clientId });
    const vehicles = (data.vehicles || []).map(mapVehicle).filter(vehicle => {
      const pending = getPendingChallansFromVehicleChallans(vehicle.vehicleChallans || null);
      return pending.length > 0;
    });
    vehiclesWithChallansRecent.set(clientId, { at: Date.now(), value: vehicles });
    return vehicles;
  })().finally(() => {
    vehiclesWithChallansInflight.delete(clientId);
  });

  vehiclesWithChallansInflight.set(clientId, request);
  return request;
};

// Vehicles with any challans on record — pending or already paid/disposed.
export const getVehiclesWithChallans = async (clientId: string): Promise<Vehicle[]> => {
  const cacheKey = `all:${clientId}`;
  const recent = vehiclesWithChallansRecent.get(cacheKey);
  if (recent && Date.now() - recent.at < DETAIL_READ_DEDUPE_MS) return recent.value;

  const inflight = vehiclesWithChallansInflight.get(cacheKey);
  if (inflight) return inflight;

  const request = (async () => {
    const data = await invokeVehicles<{ vehicles: VehicleRow[] }>('list_with_challans', { clientId });
    const vehicles = (data.vehicles || []).map(mapVehicle).filter(vehicle => {
      const all = getAllChallansFromVehicleChallans(vehicle.vehicleChallans || null);
      return all.length > 0;
    });
    vehiclesWithChallansRecent.set(cacheKey, { at: Date.now(), value: vehicles });
    return vehicles;
  })().finally(() => {
    vehiclesWithChallansInflight.delete(cacheKey);
  });

  vehiclesWithChallansInflight.set(cacheKey, request);
  return request;
};
