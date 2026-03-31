
import { supabase } from "@/integrations/supabase/client";
import { Vehicle, VehicleType, VehicleChallans } from "@/types/transportSafety";

// Get all vehicles from the database filtered by client_id
export const getAllVehicles = async (clientId?: string): Promise<Vehicle[]> => {
  try {
    let query = supabase.from('vehicles').select('*');
    
    // Filter by client_id if provided
    if (clientId) {
      query = query.eq('client_id', clientId);
    }
    
    const { data, error } = await query;
      
    if (error) {
      console.error('Error fetching vehicles:', error);
      throw error;
    }
    
    // Fetch vehicle types to get icons and names
    const { data: vehicleTypes } = await supabase
      .from('vehicle_type' as any)
      .select('id, name, icon');
    
    const vehicleTypeMap = new Map(
      (vehicleTypes || []).map((vt: any) => [vt.id, vt])
    );
    
    // Transform the raw data to match our Vehicle type
    return data.map((vehicle: any) => {
      const vehicleType = vehicleTypeMap.get(vehicle.type) as any;
      return {
        id: vehicle.id,
        registrationNumber: vehicle.registration_number,
        type: vehicle.type as VehicleType, // Legacy field - type is now UUID in DB
        typeId: vehicle.type, // UUID reference to vehicle_type table
        typeName: vehicleType?.name || undefined, // Human-readable name from vehicle_type table
        vehicleTypeIcon: vehicleType?.icon || null, // Icon from vehicle_type table
        internalVehicleName: (vehicle as any).internal_vehicle_name,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        driver: vehicle.driver,
        route: vehicle.route,
        capacity: vehicle.capacity,
        status: vehicle.status as 'active' | 'maintenance' | 'inactive',
        active: vehicle.active !== undefined ? vehicle.active : true, // Default to true if not set
        clientId: vehicle.client_id,
        employeeId: vehicle.employee_id, // Map employee_id to employeeId
        documents: [], // No documents yet as per request
        createdAt: vehicle.created_at,
        updatedAt: vehicle.updated_at,
        verificationStatus: vehicle.verification_status,
        verificationDate: vehicle.verification_date,
        // Safely convert JSON data to our typed array
        verificationData: Array.isArray(vehicle.verification_data) 
          ? vehicle.verification_data.map((item: any) => ({
              field: String(item.field || ''),
              value: item.value,
              verified: Boolean(item.verified)
            })) 
          : []
      };
    });
  } catch (error) {
    console.error('Error in getAllVehicles:', error);
    throw error;
  }
};

// Get a vehicle by ID and optionally verify client ownership
export const getVehicleById = async (id: string, clientId?: string): Promise<Vehicle | null> => {
  try {
    let query = supabase
      .from('vehicles')
      .select(`
        *,
        vehicle_challans (*)
      `)
      .eq('id', id);
    
    // Add client_id filter if provided
    if (clientId) {
      query = query.eq('client_id', clientId);
    }
    
    const { data, error } = await query.single();
      
    if (error) {
      console.error('Error fetching vehicle:', error);
      return null;
    }
    
    if (!data) return null;
    
    // Fetch vehicle type to get icon and name
    const { data: vehicleType } = await supabase
      .from('vehicle_type' as any)
      .select('id, name, icon')
      .eq('id', data.type)
      .single();
    
    // Transform the raw data to match our Vehicle type
    return {
      id: data.id,
      registrationNumber: data.registration_number,
      type: data.type as VehicleType, // Legacy field - type is now UUID in DB
      typeId: data.type, // UUID reference to vehicle_type table
      typeName: (vehicleType as any)?.name || undefined, // Human-readable name
      vehicleTypeIcon: (vehicleType as any)?.icon || null, // Icon from vehicle_type table
      internalVehicleName: (data as any).internal_vehicle_name,
      make: data.make,
      model: data.model,
      year: data.year,
      driver: data.driver,
      route: data.route,
      capacity: data.capacity,
      status: data.status as 'active' | 'maintenance' | 'inactive',
      active: (data as any).active !== undefined ? (data as any).active : true, // Default to true if not set
      clientId: data.client_id,
      employeeId: data.employee_id, // Map employee_id to employeeId
      documents: [], // No documents yet as per request
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      verificationStatus: data.verification_status,
      verificationDate: data.verification_date,
      // Safely convert JSON data to our typed array
      verificationData: Array.isArray(data.verification_data) 
        ? data.verification_data.map((item: any) => ({
            field: String(item.field || ''),
            value: item.value,
            verified: Boolean(item.verified)
          })) 
        : [],
      // Include RC fields from vehicles table
      currentRcData: data.current_rc_data,
      provider: data.provider,
      statusCode: data.status_code,
      rcStatus: data.rc_status,
      // Include vehicle_challans data
      vehicleChallans: Array.isArray(data.vehicle_challans) && data.vehicle_challans.length > 0
        ? data.vehicle_challans[0] // Get the first (and should be only) challan record
        : null
    };
  } catch (error) {
    console.error('Error in getVehicleById:', error);
    return null;
  }
};

// Add a new vehicle
export const addVehicle = async (vehicleData: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt' | 'documents'>): Promise<Vehicle | null> => {
  try {
    console.log(vehicleData);
    
    // Ensure numeric fields are properly handled
    const year = vehicleData.year ? Number(vehicleData.year) : null;
    const capacity = vehicleData.capacity ? Number(vehicleData.capacity) : null;
    
    // Year is optional - can be null
    
    // Transform the data to match the database schema
    const dbVehicle: Record<string, any> = {
      registration_number: vehicleData.registrationNumber,
      type: vehicleData.typeId || vehicleData.type, // Use typeId (UUID) if available, fallback to type for backward compatibility
      make: vehicleData.make,
      model: vehicleData.model,
      year: null,
      driver: vehicleData.driver,
      route: vehicleData.route,
      capacity: capacity,
      status: vehicleData.status,
      client_id: vehicleData.clientId,
      employee_id: vehicleData.employeeId || null, // Map employeeId to employee_id
      verification_status: vehicleData.verificationStatus,
      verification_date: vehicleData.verificationDate,
      // Convert verification_data to JSON compatible format for Supabase
      verification_data: vehicleData.verificationData 
        ? vehicleData.verificationData.map(item => ({
            field: item.field,
            value: item.value,
            verified: item.verified
          })) 
        : []
    };

    // Add internal_vehicle_name if provided
    if (vehicleData.internalVehicleName) {
      dbVehicle.internal_vehicle_name = vehicleData.internalVehicleName;
    }
    
    const { data, error } = await supabase
      .from('vehicles')
      .insert([dbVehicle] as any)
      .select();
      
    if (error) {
      console.error('Error adding vehicle:', error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      throw new Error('No data returned after inserting vehicle');
    }
    
    const newVehicle = data[0];
    
    // Fetch vehicle type to get icon
    const { data: vehicleType } = await supabase
      .from('vehicle_type')
      .select('id, name, icon')
      .eq('id', newVehicle.type)
      .single();
    
    // Transform the response to match our Vehicle type
    return {
      id: newVehicle.id,
      registrationNumber: newVehicle.registration_number,
      type: newVehicle.type as VehicleType, // Legacy field - type is now UUID in DB
      typeId: newVehicle.type, // UUID reference to vehicle_type table
      vehicleTypeIcon: vehicleType?.icon || null, // Icon from vehicle_type table
      internalVehicleName: newVehicle.internal_vehicle_name,
      make: newVehicle.make,
      model: newVehicle.model,
      year: newVehicle.year,
      driver: newVehicle.driver,
      route: newVehicle.route,
      capacity: newVehicle.capacity,
      status: newVehicle.status as 'active' | 'maintenance' | 'inactive',
      clientId: newVehicle.client_id,
      employeeId: newVehicle.employee_id, // Map employee_id to employeeId
      documents: [], // No documents yet as per request
      createdAt: newVehicle.created_at,
      updatedAt: newVehicle.updated_at,
      verificationStatus: newVehicle.verification_status,
      verificationDate: newVehicle.verification_date,
      // Safely convert JSON data to our typed array
      verificationData: Array.isArray(newVehicle.verification_data) 
        ? newVehicle.verification_data.map((item: any) => ({
            field: String(item.field || ''),
            value: item.value,
            verified: Boolean(item.verified)
          })) 
        : []
    };
  } catch (error) {
    console.error('Error in addVehicle:', error);
    throw error;
  }
};

// Update a vehicle
export const updateVehicle = async (id: string, updates: Partial<Vehicle>): Promise<Vehicle | null> => {
  try {
    // Transform the updates to match the database schema
    const dbUpdates: Record<string, any> = {};
    
    if (updates.registrationNumber) dbUpdates.registration_number = updates.registrationNumber;
    // Use typeId (UUID) if available, otherwise fallback to type for backward compatibility
    if (updates.typeId !== undefined) {
      dbUpdates.type = updates.typeId;
    } else if (updates.type) {
      dbUpdates.type = updates.type;
    }
    if (updates.internalVehicleName !== undefined) {
      dbUpdates.internal_vehicle_name = updates.internalVehicleName || null;
    }
    if (updates.make) dbUpdates.make = updates.make;
    if (updates.model) dbUpdates.model = updates.model;
    if (updates.year !== undefined) dbUpdates.year = updates.year ? Number(updates.year) : null;
    if (updates.driver) dbUpdates.driver = updates.driver;
    if (updates.route) dbUpdates.route = updates.route;
    if (updates.capacity !== undefined) dbUpdates.capacity = updates.capacity ? Number(updates.capacity) : null;
    if (updates.status) dbUpdates.status = updates.status;
    if (updates.active !== undefined) dbUpdates.active = updates.active;
    if (updates.clientId) dbUpdates.client_id = updates.clientId;
    if (updates.employeeId !== undefined) dbUpdates.employee_id = updates.employeeId; // Handle employeeId updates
    if (updates.verificationStatus) dbUpdates.verification_status = updates.verificationStatus;
    if (updates.verificationDate) dbUpdates.verification_date = updates.verificationDate;
    
    // Properly format the verification data for the database
    if (updates.verificationData) {
      dbUpdates.verification_data = updates.verificationData.map(item => ({
        field: item.field,
        value: item.value,
        verified: item.verified
      }));
    }
    
    const { data, error } = await supabase
      .from('vehicles')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();
      
    if (error) {
      console.error('Error updating vehicle:', error);
      throw error;
    }
    
    // Fetch vehicle type to get icon
    const { data: vehicleType } = await supabase
      .from('vehicle_type' as any)
      .select('id, name, icon')
      .eq('id', data.type)
      .single();
    
    // Transform the response to match our Vehicle type
    return {
      id: data.id,
      registrationNumber: data.registration_number,
      type: data.type as VehicleType, // Legacy field - type is now UUID in DB
      typeId: data.type, // UUID reference to vehicle_type table
      vehicleTypeIcon: vehicleType?.icon || null, // Icon from vehicle_type table
      internalVehicleName: data.internal_vehicle_name,
      make: data.make,
      model: data.model,
      year: data.year,
      driver: data.driver,
      route: data.route,
      capacity: data.capacity,
      status: data.status as 'active' | 'maintenance' | 'inactive',
      active: (data as any).active !== undefined ? (data as any).active : true, // Default to true if not set
      clientId: data.client_id,
      employeeId: data.employee_id, // Map employee_id to employeeId
      documents: [], // No documents yet as per request
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      verificationStatus: data.verification_status,
      verificationDate: data.verification_date,
      // Safely convert JSON data to our typed array
      verificationData: Array.isArray(data.verification_data) 
        ? data.verification_data.map((item: any) => ({
            field: String(item.field || ''),
            value: item.value,
            verified: Boolean(item.verified)
          })) 
        : []
    };
  } catch (error) {
    console.error('Error in updateVehicle:', error);
    throw error;
  }
};

// Delete a vehicle
export const deleteVehicle = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', id);
      
    if (error) {
      console.error('Error deleting vehicle:', error);
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error in deleteVehicle:', error);
    return false;
  }
};

export const checkExistingRegistrations = async (
  registrationNumbers: string[],
  clientId: string
): Promise<string[]> => {
  const { data, error } = await supabase
    .from('vehicles')
    .select('registration_number')
    .in('registration_number', registrationNumbers)
    .eq('client_id', clientId);

  if (error) {
    console.error(error);
    throw new Error('Failed to check existing vehicles');
  }

  return (data || []).map(v => v.registration_number);
};

export const fetchVehicleTypeMap = async (): Promise<Record<string, string>> => {
  const { data, error } = await supabase
    .from('vehicle_type')
    .select('id, name');

  if (error) {
    console.error(error);
    throw new Error('Failed to fetch vehicle types');
  }

  const map: Record<string, string> = {};

  data.forEach(v => {
    const normalizedKey = v.name.trim().toUpperCase();
    map[normalizedKey] = v.id;
  });

  return map;
};

export const fetchVehicleTypes = async (): Promise<string[]> => {
  const { data, error } = await supabase
    .from('vehicle_type')
    .select('name')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching vehicle types:', error);
    throw new Error('Unable to fetch vehicle types');
  }
  return (
    data?.map(v => v.name.trim()) ?? []
  );
};
const getLatestVehicleVerificationLog = (verificationData: any) => {
  if (!Array.isArray(verificationData)) return null;

  const log = verificationData.find(v => v.field === 'verification_log');
  if (!log?.value) return null;

  const latestKey = Object.keys(log.value).sort().pop();
  return latestKey ? log.value[latestKey] : null;
};

const normalizeChallanStatus = (status?: string): string =>
  String(status || '').trim().toUpperCase();

const isDisposedChallanStatus = (status?: string): boolean =>
  ['DISPOSED', 'PAID', 'CASH'].includes(normalizeChallanStatus(status));

const dedupeChallans = (challans: any[]): any[] => {
  if (!Array.isArray(challans)) return [];

  const hasValue = (value: unknown) => {
    if (value === null || value === undefined) return false;
    if (Array.isArray(value)) return value.length > 0;
    return String(value).trim() !== '';
  };

  const mergeChallan = (base: any, incoming: any) => {
    const merged = { ...base };

    Object.entries(incoming || {}).forEach(([key, value]) => {
      const existing = (merged as any)[key];
      if (!hasValue(existing) && hasValue(value)) {
        (merged as any)[key] = value;
      }
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
  challans.forEach((challan: any) => {
    const key = getDedupKey(challan);
    const existing = deduped.get(key);
    deduped.set(key, existing ? mergeChallan(existing, challan) : challan);
  });

  return Array.from(deduped.values());
};

// Helper function to extract challans from verificationData (legacy - used for old data structure)
const getChallansFromVerificationData = (verificationData: any) => {
  const log = getLatestVehicleVerificationLog(verificationData);
  
  if (!Array.isArray(log)) return [];
  
  const challanField = log.find(
    (f: any) => f.field === 'challan_details'
  );

  return dedupeChallans(challanField?.value?.challan_details?.challans ?? []);
};
// Legacy function - kept for backward compatibility
export const getPendingChallans = (verificationData: any) => {
  const allChallans = getChallansFromVerificationData(verificationData);
  return allChallans.filter(
    (c: any) =>
      c?.challan_status &&
      !isDisposedChallanStatus(c.challan_status)
  );
};

/**
 * Extract challans from vehicle_challans.latest_challan_data
 */
export const extractChallansFromVehicleChallans = (vehicleChallans: VehicleChallans | null): any[] => {
  if (!vehicleChallans?.latest_challan_data) {
    return [];
  }

  const challanData = vehicleChallans.latest_challan_data;
  
  // Handle different challan response structures
  if (challanData?.data?.challan_details?.challans) {
    const challans = challanData.data.challan_details.challans;
    if (Array.isArray(challans)) {
      return dedupeChallans(challans);
    }
  }
  if (challanData?.data?.challan_data) {
    const challans = challanData.data.challan_data;
    if (Array.isArray(challans)) {
      return dedupeChallans(challans);
    }
  }
  if (challanData?.challan_details?.challans) {
    const challans = challanData.challan_details.challans;
    if (Array.isArray(challans)) {
      return dedupeChallans(challans);
    }
  }
  if (Array.isArray(challanData)) {
    return dedupeChallans(challanData);
  }
  if (Array.isArray(challanData?.data)) {
    return dedupeChallans(challanData.data);
  }
  
  return [];
};

/**
 * Get pending challans from vehicle_challans table
 */
export const getPendingChallansFromVehicleChallans = (
  vehicleChallans: VehicleChallans | null
): any[] => {
  const logs = vehicleChallans?.challan_history_log;
  if (!logs || typeof logs !== 'object') return [];

  const successLogs = Object.entries(logs).filter(
    ([_, entry]: any) => entry?.data?.status_code === 200
  );

  if (successLogs.length === 0) return [];

  successLogs.sort(
    ([a], [b]) => new Date(b).getTime() - new Date(a).getTime()
  );

  const [, latestLog]: any = successLogs[0];

  const challanData = latestLog?.data?.data;
  if (!challanData) return [];

  const rawChallans =
    challanData?.challan_details?.challans ||
    challanData?.challan_data ||
    [];

  if (!Array.isArray(rawChallans)) return [];
  const challans = dedupeChallans(rawChallans);

  return challans.filter(
    (c: any) =>
      c?.challan_status &&
      !isDisposedChallanStatus(c.challan_status)
  );
};

/**
 * Get all vehicles with their vehicle_challans data
 */
export const getAllVehiclesWithChallans = async (clientId?: string): Promise<Vehicle[]> => {
  try {
    let query = supabase
      .from('vehicles')
      .select(`
        *,
        vehicle_challans (*)
      `);
    
    if (clientId) {
      query = query.eq('client_id', clientId);
    }
    
    const { data, error } = await query;
      
    if (error) {
      console.error('Error fetching vehicles with challans:', error);
      throw error;
    }
    
    // Fetch vehicle types to get icons and names
    const { data: vehicleTypes } = await supabase
      .from('vehicle_type' as any)
      .select('id, name, icon');
    
    const vehicleTypeMap = new Map(
      (vehicleTypes || []).map((vt: any) => [vt.id, vt])
    );
    
    // Transform the raw data to match our Vehicle type
    return data.map((vehicle: any) => {
      const vehicleType = vehicleTypeMap.get(vehicle.type) as any;
      const vehicleChallans = vehicle.vehicle_challans && vehicle.vehicle_challans.length > 0 
        ? vehicle.vehicle_challans[0] 
        : null;
      
      return {
        id: vehicle.id,
        registrationNumber: vehicle.registration_number,
        type: vehicle.type as VehicleType,
        typeId: vehicle.type,
        typeName: vehicleType?.name || undefined,
        vehicleTypeIcon: vehicleType?.icon || null,
        internalVehicleName: (vehicle as any).internal_vehicle_name,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        driver: vehicle.driver,
        route: vehicle.route,
        capacity: vehicle.capacity,
        status: vehicle.status as 'active' | 'maintenance' | 'inactive',
        active: vehicle.active !== undefined ? vehicle.active : true,
        clientId: vehicle.client_id,
        employeeId: vehicle.employee_id,
        documents: [],
        createdAt: vehicle.created_at,
        updatedAt: vehicle.updated_at,
        verificationStatus: vehicle.verification_status,
        verificationDate: vehicle.verification_date,
        verificationData: Array.isArray(vehicle.verification_data) 
          ? vehicle.verification_data.map((item: any) => ({
              field: String(item.field || ''),
              value: item.value,
              verified: Boolean(item.verified)
            })) 
          : [],
        vehicleChallans: vehicleChallans ? {
          id: vehicleChallans.id,
          vehicle_id: vehicleChallans.vehicle_id,
          latest_challan_data: vehicleChallans.latest_challan_data,
          challan_status: vehicleChallans.challan_status,
          challan_status_code: vehicleChallans.challan_status_code,
          challan_history_log: vehicleChallans.challan_history_log,
          provider: vehicleChallans.provider,
          success_api_count: vehicleChallans.success_api_count,
          error_api_count: vehicleChallans.error_api_count,
          created_at: vehicleChallans.created_at,
          updated_at: vehicleChallans.updated_at
        } : undefined
      };
    });
  } catch (error) {
    console.error('Error in getAllVehiclesWithChallans:', error);
    throw error;
  }
};

/**
 * Get vehicles with pending challans from vehicle_challans table
 */
export const getVehiclesWithPendingChallans = async (
  clientId: string
): Promise<Vehicle[]> => {
  try {
    const vehicles = await getAllVehiclesWithChallans(clientId);

    return vehicles.filter(vehicle => {
      const pending = getPendingChallansFromVehicleChallans(vehicle.vehicleChallans || null);
      return pending.length > 0;
    });
  } catch (error) {
    console.error('Error fetching vehicles with pending challans:', error);
    throw error;
  }
};

/**
 * Get vehicle_challans record by vehicle_id
 * Returns the latest_challan_data and other challan information
 */
export const getVehicleChallans = async (vehicleId: string): Promise<VehicleChallans | null> => {
  try {
    console.log('[getVehicleChallans] Fetching challans for vehicle_id:', vehicleId);
    
    const { data, error } = await supabase
      .from('vehicle_challans')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle(); // Use maybeSingle() instead of single() to avoid error when no record exists
    
    if (error) {
      console.error('[getVehicleChallans] Error fetching vehicle_challans:', error);
      return null;
    }
    
    if (!data) {
      console.log('[getVehicleChallans] No vehicle_challans record found for vehicle_id:', vehicleId);
      return null;
    }
    
    console.log('[getVehicleChallans] Found vehicle_challans record:', {
      id: data.id,
      hasLatestChallanData: !!data.latest_challan_data,
      challanStatus: data.challan_status,
      provider: data.provider,
      latestChallanDataKeys: data.latest_challan_data ? Object.keys(data.latest_challan_data) : []
    });
    
    // Transform to VehicleChallans type
    return {
      id: data.id,
      vehicle_id: data.vehicle_id,
      latest_challan_data: data.latest_challan_data,
      challan_status: data.challan_status,
      challan_status_code: data.challan_status_code,
      challan_history_log: data.challan_history_log,
      provider: data.provider,
      success_api_count: data.success_api_count,
      error_api_count: data.error_api_count,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  } catch (error) {
    console.error('[getVehicleChallans] Exception in getVehicleChallans:', error);
    return null;
  }
};
