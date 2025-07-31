import { supabase } from '@/integrations/supabase/client';

/**
 * Service for checking incident references before deleting configuration values
 */

export interface IncidentReferenceCheck {
  hasReferences: boolean;
  count: number;
  message: string;
}

/**
 * Check if a category is referenced by any incidents
 */
export async function checkCategoryReferences(categoryId: string, clientId: string): Promise<IncidentReferenceCheck> {
  const { data, error } = await supabase
    .from('incidents')
    .select('id')
    .eq('category_id', categoryId)
    .eq('client_id', clientId);

  if (error) {
    console.error('Error checking category references:', error);
    throw new Error('Failed to check category references');
  }

  const count = data?.length || 0;
  return {
    hasReferences: count > 0,
    count,
    message: count > 0 
      ? `Cannot delete this category because it is currently linked to ${count} incident${count > 1 ? 's' : ''}`
      : ''
  };
}

/**
 * Check if a subcategory is referenced by any incidents
 */
export async function checkSubcategoryReferences(subcategoryId: string, clientId: string): Promise<IncidentReferenceCheck> {
  const { data, error } = await supabase
    .from('incidents')
    .select('id')
    .eq('subcategory_id', subcategoryId)
    .eq('client_id', clientId);

  if (error) {
    console.error('Error checking subcategory references:', error);
    throw new Error('Failed to check subcategory references');
  }

  const count = data?.length || 0;
  return {
    hasReferences: count > 0,
    count,
    message: count > 0 
      ? `Cannot delete this subcategory because it is currently linked to ${count} incident${count > 1 ? 's' : ''}`
      : ''
  };
}

/**
 * Check if a report type is referenced by any incidents
 */
export async function checkReportTypeReferences(typeId: string, clientId: string): Promise<IncidentReferenceCheck> {
  const { data, error } = await supabase
    .from('incidents')
    .select('id')
    .eq('type_id', typeId)
    .eq('client_id', clientId);

  if (error) {
    console.error('Error checking report type references:', error);
    throw new Error('Failed to check report type references');
  }

  const count = data?.length || 0;
  return {
    hasReferences: count > 0,
    count,
    message: count > 0 
      ? `Cannot delete this report type because it is currently linked to ${count} incident${count > 1 ? 's' : ''}`
      : ''
  };
}

/**
 * Check if a priority is referenced by any incidents
 */
export async function checkPriorityReferences(priorityId: string, clientId: string): Promise<IncidentReferenceCheck> {
  const { data, error } = await supabase
    .from('incidents')
    .select('id')
    .eq('priority_id', priorityId)
    .eq('client_id', clientId);

  if (error) {
    console.error('Error checking priority references:', error);
    throw new Error('Failed to check priority references');
  }

  const count = data?.length || 0;
  return {
    hasReferences: count > 0,
    count,
    message: count > 0 
      ? `Cannot delete this priority because it is currently linked to ${count} incident${count > 1 ? 's' : ''}`
      : ''
  };
}

/**
 * Check if a location (campus) is referenced by any incidents
 */
export async function checkLocationReferences(locationId: string, clientId: string): Promise<IncidentReferenceCheck> {
  const { data, error } = await supabase
    .from('incidents')
    .select('id')
    .eq('location_id', locationId)
    .eq('client_id', clientId);

  if (error) {
    console.error('Error checking location references:', error);
    throw new Error('Failed to check location references');
  }

  const count = data?.length || 0;
  return {
    hasReferences: count > 0,
    count,
    message: count > 0 
      ? `Cannot delete this location because it is currently linked to ${count} incident${count > 1 ? 's' : ''}`
      : ''
  };
}

/**
 * Check if a facility is referenced by any incidents
 */
export async function checkFacilityReferences(facilityId: string, clientId: string): Promise<IncidentReferenceCheck> {
  const { data, error } = await supabase
    .from('incidents')
    .select('id')
    .eq('facility_id', facilityId)
    .eq('client_id', clientId);

  if (error) {
    console.error('Error checking facility references:', error);
    throw new Error('Failed to check facility references');
  }

  const count = data?.length || 0;
  return {
    hasReferences: count > 0,
    count,
    message: count > 0 
      ? `Cannot delete this facility because it is currently linked to ${count} incident${count > 1 ? 's' : ''}`
      : ''
  };
}