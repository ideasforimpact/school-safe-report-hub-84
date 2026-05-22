
import { supabase } from '@/integrations/supabase/client';

export interface EditIncidentData {
  id: string;
  ticket_id: string;
  type: string;
  typeId: string;
  category: string;
  categoryId: string;
  subcategory: string;
  subcategoryId: string;
  description: string;
  date: string;
  time: string;
  location: string;
  locationId: string;
  facility: string;
  facilityId: string;
  priority: string;
  priorityId: string;
  status: string;
  statusId: string;
  owner: string;
  ownerId: string;
  reportedBy: string;
  created_by: string;
  assigned_to: string;
  peopleInvolved: any[];
  documents: any[];
  createdAt: Date;
  updatedAt: Date;
}

export const fetchIncidentForEdit = async (incidentId: string, clientId: string): Promise<EditIncidentData | null> => {
  const { data, error } = await supabase.functions.invoke('fetch-incidents', {
    body: { operation: 'get_incident_detail', incidentId, clientId }
  });

  if (error) throw new Error(`Failed to fetch incident: ${error.message}`);
  if (!data?.success || !data?.incident) return null;

  const inc = data.incident;
  const incidentDate = new Date(inc.date);

  return {
    id: inc.id,
    ticket_id: inc.ticket_id,
    type: inc.type?.name || '',
    typeId: inc.type_id || '',
    category: inc.category?.name || '',
    categoryId: inc.category_id || '',
    subcategory: inc.subcategory?.name || '',
    subcategoryId: inc.subcategory_id || '',
    description: inc.description || '',
    date: incidentDate.toISOString().split('T')[0],
    time: incidentDate.toTimeString().split(' ')[0].slice(0, 5),
    location: inc.location?.name || '',
    locationId: inc.location_id || '',
    facility: inc.facility?.name || '',
    facilityId: inc.facility_id || '',
    priority: inc.priority?.name || '',
    priorityId: inc.priority_id || '',
    status: inc.status?.name || '',
    statusId: inc.status_id || '',
    owner: inc.assigned_to
      ? `${inc.assigned_to.first_name} ${inc.assigned_to.last_name}`
      : '',
    ownerId: inc.assigned_to?.id || '',
    reportedBy: inc.created_by
      ? `${inc.created_by.first_name} ${inc.created_by.last_name}`
      : '',
    created_by: inc.created_by?.id || '',
    assigned_to: inc.assigned_to?.id || '',
    peopleInvolved: Array.isArray(inc.people_involved) ? inc.people_involved : [],
    documents: Array.isArray(inc.documents) ? inc.documents : [],
    createdAt: new Date(inc.created_at),
    updatedAt: new Date(inc.updated_at),
  };
};
