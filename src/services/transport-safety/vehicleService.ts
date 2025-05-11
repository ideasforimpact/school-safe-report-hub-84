
import { supabase } from "@/integrations/supabase/client";
import { Vehicle } from "@/types/transportSafety";

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
      type: vehicle.type,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      driver: vehicle.driver,
      route: vehicle.route,
      capacity: vehicle.capacity,
      status: vehicle.status,
      documents: [], // No documents yet as per request
      createdAt: vehicle.created_at,
      updatedAt: vehicle.updated_at
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
      type: data.type,
      make: data.make,
      model: data.model,
      year: data.year,
      driver: data.driver,
      route: data.route,
      capacity: data.capacity,
      status: data.status,
      documents: [], // No documents yet as per request
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  } catch (error) {
    console.error('Error in getVehicleById:', error);
    return null;
  }
};

// Add a new vehicle
export const addVehicle = async (vehicleData: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt' | 'documents'>): Promise<Vehicle | null> => {
  try {
    // Transform the data to match the database schema
    const dbVehicle = {
      registration_number: vehicleData.registrationNumber,
      type: vehicleData.type,
      make: vehicleData.make,
      model: vehicleData.model,
      year: vehicleData.year,
      driver: vehicleData.driver,
      route: vehicleData.route,
      capacity: vehicleData.capacity,
      status: vehicleData.status
    };
    
    const { data, error } = await supabase
      .from('vehicles')
      .insert([dbVehicle])
      .select()
      .single();
      
    if (error) {
      console.error('Error adding vehicle:', error);
      throw error;
    }
    
    // Transform the response to match our Vehicle type
    return {
      id: data.id,
      registrationNumber: data.registration_number,
      type: data.type,
      make: data.make,
      model: data.model,
      year: data.year,
      driver: data.driver,
      route: data.route,
      capacity: data.capacity,
      status: data.status,
      documents: [], // No documents yet as per request
      createdAt: data.created_at,
      updatedAt: data.updated_at
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
    if (updates.year) dbUpdates.year = updates.year;
    if (updates.driver) dbUpdates.driver = updates.driver;
    if (updates.route) dbUpdates.route = updates.route;
    if (updates.capacity !== undefined) dbUpdates.capacity = updates.capacity;
    if (updates.status) dbUpdates.status = updates.status;
    
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
      type: data.type,
      make: data.make,
      model: data.model,
      year: data.year,
      driver: data.driver,
      route: data.route,
      capacity: data.capacity,
      status: data.status,
      documents: [], // No documents yet as per request
      createdAt: data.created_at,
      updatedAt: data.updated_at
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
