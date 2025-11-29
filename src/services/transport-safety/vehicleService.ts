
import { supabase } from "@/integrations/supabase/client";
import { Vehicle, VehicleType } from "@/types/transportSafety";

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
    
    // Fetch vehicle types to get icons
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
      .select('*')
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
    
    // Fetch vehicle type to get icon
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
        : []
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
