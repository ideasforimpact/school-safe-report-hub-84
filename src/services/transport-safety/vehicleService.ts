
import { supabase } from "@/integrations/supabase/client";
import { Vehicle, VehicleType, VehicleVerificationData } from "@/types/transportSafety";
import { useClient } from "@/contexts/ClientContext";

// Get all vehicles from the database
export const getAllVehicles = async (): Promise<Vehicle[]> => {
  try {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*');
      
    if (error) {
      console.error('Error fetching vehicles:', error);
      throw error;
    }
    
    // Transform the raw data to match our Vehicle type
    return data.map((vehicle: any) => ({
      id: vehicle.id,
      registrationNumber: vehicle.registration_number,
      type: vehicle.type as VehicleType,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      driver: vehicle.driver,
      route: vehicle.route,
      capacity: vehicle.capacity,
      status: vehicle.status as 'active' | 'maintenance' | 'inactive',
      clientId: vehicle.client_id,
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
    }));
  } catch (error) {
    console.error('Error in getAllVehicles:', error);
    throw error;
  }
};

// Get a vehicle by ID
export const getVehicleById = async (id: string): Promise<Vehicle | null> => {
  try {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) {
      console.error('Error fetching vehicle:', error);
      return null;
    }
    
    if (!data) return null;
    
    // Transform the raw data to match our Vehicle type
    return {
      id: data.id,
      registrationNumber: data.registration_number,
      type: data.type as VehicleType,
      make: data.make,
      model: data.model,
      year: data.year,
      driver: data.driver,
      route: data.route,
      capacity: data.capacity,
      status: data.status as 'active' | 'maintenance' | 'inactive',
      clientId: data.client_id,
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
    // Ensure numeric fields are properly handled
    const year = vehicleData.year ? Number(vehicleData.year) : null;
    const capacity = vehicleData.capacity ? Number(vehicleData.capacity) : null;
    
    if (!year) {
      throw new Error('Year is required and must be a valid number');
    }
    
    // Transform the data to match the database schema
    const dbVehicle = {
      registration_number: vehicleData.registrationNumber,
      type: vehicleData.type,
      make: vehicleData.make,
      model: vehicleData.model,
      year: year,
      driver: vehicleData.driver,
      route: vehicleData.route,
      capacity: capacity,
      status: vehicleData.status,
      client_id: vehicleData.clientId,
      verification_status: vehicleData.verificationStatus,
      verification_date: vehicleData.verificationDate,
      // Convert verification_data to JSON compatible format
      verification_data: vehicleData.verificationData ? 
        vehicleData.verificationData.map(item => ({
          field: item.field,
          value: item.value,
          verified: item.verified
        })) : []
    };
    
    const { data, error } = await supabase
      .from('vehicles')
      .insert([dbVehicle])
      .select();
      
    if (error) {
      console.error('Error adding vehicle:', error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      throw new Error('No data returned after inserting vehicle');
    }
    
    const newVehicle = data[0];
    
    // Transform the response to match our Vehicle type
    return {
      id: newVehicle.id,
      registrationNumber: newVehicle.registration_number,
      type: newVehicle.type as VehicleType,
      make: newVehicle.make,
      model: newVehicle.model,
      year: newVehicle.year,
      driver: newVehicle.driver,
      route: newVehicle.route,
      capacity: newVehicle.capacity,
      status: newVehicle.status as 'active' | 'maintenance' | 'inactive',
      clientId: newVehicle.client_id,
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
    if (updates.type) dbUpdates.type = updates.type;
    if (updates.make) dbUpdates.make = updates.make;
    if (updates.model) dbUpdates.model = updates.model;
    if (updates.year !== undefined) dbUpdates.year = Number(updates.year);
    if (updates.driver) dbUpdates.driver = updates.driver;
    if (updates.route) dbUpdates.route = updates.route;
    if (updates.capacity !== undefined) dbUpdates.capacity = updates.capacity ? Number(updates.capacity) : null;
    if (updates.status) dbUpdates.status = updates.status;
    if (updates.clientId) dbUpdates.client_id = updates.clientId;
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
    
    // Transform the response to match our Vehicle type
    return {
      id: data.id,
      registrationNumber: data.registration_number,
      type: data.type as VehicleType,
      make: data.make,
      model: data.model,
      year: data.year,
      driver: data.driver,
      route: data.route,
      capacity: data.capacity,
      status: data.status as 'active' | 'maintenance' | 'inactive',
      clientId: data.client_id,
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
