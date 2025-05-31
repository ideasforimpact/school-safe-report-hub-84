
import { supabase } from '@/integrations/supabase/client';
import { ConfigItem } from '@/contexts/types';

export interface FacilityItem extends ConfigItem {
  campusId: string;
}

export const getFacilitiesByCampus = async (campusId: string): Promise<FacilityItem[]> => {
  try {
    //console.log(`Fetching facilities for campus ID: ${campusId}`);
    
    const { data, error } = await supabase
      .from('facilities')
      .select('*')
      .eq('campus_id', campusId);
    
    if (error) {
      console.error("Error fetching facilities:", error);
      throw error;
    }
    
    //console.log(`Successfully fetched ${data.length} facilities for campus ID ${campusId}:`, data);
    
    // Map facilities to FacilityItem format
    return data.map(facility => ({
      id: facility.id,
      name: facility.name,
      campusId: facility.campus_id
    }));
  } catch (error) {
    console.error("Failed to fetch facilities:", error);
    throw error;
  }
};
