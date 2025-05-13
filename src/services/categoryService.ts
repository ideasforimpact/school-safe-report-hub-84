
import { supabase } from '@/integrations/supabase/client';
import { IncidentCategory, IncidentSubcategory } from '@/types/supabase';
import { groupSubcategoriesByCategory } from '@/utils/dataConverters';

export async function fetchCategoriesForClient(clientId: string): Promise<IncidentCategory[]> {
  const { data, error } = await supabase
    .from('incident_categories')
    .select('*')
    .eq('client_id', clientId)
    .eq('is_active', true)
    .order('name');

  if (error) throw error;
  return data || [];
}

export async function fetchAllSubcategories(): Promise<Record<string, IncidentSubcategory[]>> {
  const { data, error } = await supabase
    .from('incident_subcategories')
    .select('*')
    .eq('is_active', true);

  if (error) throw error;
  
  // Group subcategories by category ID
  const groupedData: Record<string, IncidentSubcategory[]> = {};
  
  if (data) {
    data.forEach(subcat => {
      if (!groupedData[subcat.category_id]) {
        groupedData[subcat.category_id] = [];
      }
      groupedData[subcat.category_id].push(subcat);
    });
  }
  
  return groupedData;
}

export async function fetchSubcategoriesForCategory(categoryId: string): Promise<IncidentSubcategory[]> {
  const { data, error } = await supabase
    .from('incident_subcategories')
    .select('*')
    .eq('category_id', categoryId)
    .eq('is_active', true)
    .order('name');

  if (error) throw error;
  return data || [];
}

export async function syncCategoriesWithContext(clientId: string) {
  try {
    // Fetch all categories for this client
    const categories = await fetchCategoriesForClient(clientId);
    
    // Fetch all subcategories
    const { data: subcategories, error } = await supabase
      .from('incident_subcategories')
      .select('*')
      .eq('is_active', true);
      
    if (error) throw error;
      
    // Group subcategories by category ID
    const subcategoryMappings = groupSubcategoriesByCategory(subcategories || []);
    
    return {
      categories,
      subcategoryMappings
    };
  } catch (err) {
    console.error("Error syncing categories with context:", err);
    throw err;
  }
}
