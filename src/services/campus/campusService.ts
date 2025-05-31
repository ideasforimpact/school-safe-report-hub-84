
import { supabase } from '@/integrations/supabase/client';
import { ConfigItem } from '@/contexts/types';

export const getAllCampuses = async (): Promise<ConfigItem[]> => {
  try {
    //console.log("Fetching campuses from database...");
    
    const { data, error } = await supabase
      .from('campuses')
      .select('*');
    
    if (error) {
      console.error("Error fetching campuses:", error);
      throw error;
    }
    
    //console.log(`Successfully fetched ${data.length} campuses:`, data);
    
    // Map campuses to ConfigItem format
    return data.map(campus => ({
      id: campus.id,
      name: campus.name
    }));
  } catch (error) {
    console.error("Failed to fetch campuses:", error);
    throw error;
  }
};
