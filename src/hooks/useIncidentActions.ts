
import { useState } from 'react';
import { Incident, Activity, User, UserRef, Document, IncidentType, IncidentCategory, IncidentLocation } from '@/types/incident';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { Json } from '@/integrations/supabase/types';
import { useEmployeeStore } from '@/store/EmployeeContext';

interface IncidentData extends Omit<Incident, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'ticketId'> {
  typeId?: string;
  categoryId: string;
  subcategoryId?: string | null;
  locationId: string;
  facilityId?: string;
  priorityId?: string;
  statusId?: string | null;
}

export function useIncidentActions(
  incidents: Incident[], 
  refetchIncidents: () => Promise<void>,
  activities: Activity[],
  setActivities: React.Dispatch<React.SetStateAction<Activity[]>>,
  users: User[]
) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { state } = useEmployeeStore();

  // Generate a ticket ID in the format INC-12345
  const generateTicketId = () => {
    return `INC-${Math.floor(10000 + Math.random() * 90000)}`;
  };

  // Check if user has client_id access
  const validateClientAccess = () => {
    if (!state.employeeData?.clientId) {
      toast.error("Access denied: No client association found");
      throw new Error("Access denied: No client association found");
    }
    return state.employeeData.clientId;
  };

  // Add a new incident
  const addIncident = async (incidentData: IncidentData) => {
    setIsSubmitting(true);
    try {
      // Validate client access
      const clientId = validateClientAccess();
      
      console.log('Adding incident with data:', incidentData);
      
      // Use provided status_id or fetch the "New" status ID as default
      let statusId = incidentData.statusId;
      
      if (!statusId) {
        // Fetch the "New" status ID if not provided
        const { data: statusData, error: statusError } = await supabase
          .from('incident_status')
          .select('id')
          .eq('name', 'New')
          .single();
          
        if (statusError || !statusData) {
          console.error('Error fetching New status:', statusError);
          throw new Error('Could not fetch incident status');
        }
        
        statusId = statusData.id;
        console.log('Got status ID:', statusId);
      }
      
      // Generate a new ticket ID
      const ticketId = generateTicketId();

      // Create incident record in the database with client_id restriction
      const dbRecord: any = {
        category_id: incidentData.categoryId,
        description: incidentData.description,
        date: incidentData.date instanceof Date ? incidentData.date.toISOString() : incidentData.date,
        location_id: incidentData.locationId,
        people_involved: incidentData.peopleInvolved,
        status_id: statusId,
        created_by: incidentData.reportedBy.id,
        ticket_id: ticketId,
        documents: incidentData.documents ? JSON.parse(JSON.stringify(incidentData.documents)) : [],
        assigned_to: incidentData.owner?.id || null,
        client_id: clientId, // Ensure client_id is always set
      };
      
      // Add optional fields only if they have values
      if (incidentData.typeId) {
        dbRecord['type_id'] = incidentData.typeId;
      }
      
      if (incidentData.subcategoryId) {
        dbRecord['subcategory_id'] = incidentData.subcategoryId;
      }
      
      if (incidentData.facilityId) {
        dbRecord['facility_id'] = incidentData.facilityId;
      }
      
      if (incidentData.priorityId) {
        dbRecord['priority_id'] = incidentData.priorityId;
      }
      
      console.log('Submitting record to database:', dbRecord);
      
      const { data, error } = await supabase
        .from('incidents')
        .insert(dbRecord)
        .select();
      
      if (error) {
        console.error('Error creating incident:', error);
        throw error;
      }
      
      console.log('Incident created successfully:', data);
      
      // Create corresponding activity log
      const newActivity: Activity = {
        type: 'incident',
        activity: 'create',
        entityId: data[0].id,
        entityTitle: `Incident #${ticketId}`,
        user: incidentData.reportedBy.name,
        userId: incidentData.reportedBy.id,
        date: new Date(),
        details: `Reported a new ${incidentData.type.toLowerCase()}: ${incidentData.description.substring(0, 50)}${incidentData.description.length > 50 ? '...' : ''}`
      };
      
      addActivity(newActivity);
      
      // Convert the created record to our local Incident type
      const newIncident: Incident = {
        id: data[0].id,
        ticketId,
        type: incidentData.type,
        category: incidentData.category,
        subcategory: incidentData.subcategory,
        description: incidentData.description,
        date: incidentData.date,
        location: incidentData.location,
        peopleInvolved: incidentData.peopleInvolved,
        status: 'New',
        reportedBy: incidentData.reportedBy,
        owner: incidentData.owner,
        facility: incidentData.facility,
        documents: incidentData.documents,
        createdAt: new Date(),
        updatedAt: new Date(),
        priority: incidentData.priority
      };
      
      // Wait for a brief moment to ensure database consistency
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Trigger refetch to ensure fresh data
      await refetchIncidents();
      
      toast.success(`${incidentData.type} reported successfully!`);
      
      return newIncident;
    } catch (error: any) {
      console.error('Failed to create incident:', error);
      toast.error(`Failed to create incident: ${error.message}`);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add a new activity to the log
  const addActivity = (activity: Activity) => {
    setActivities(prevActivities => [activity, ...prevActivities]);
  };

  // Update an existing incident
  const updateIncident = async (id: string, updates: Partial<Incident>) => {
    try {
      // Validate client access
      validateClientAccess();
      
      const incident = incidents.find(inc => inc.id === id);
      if (!incident) {
        toast.error('Incident not found');
        return;
      }

      // Wait for a brief moment to ensure database consistency
      await new Promise(resolve => setTimeout(resolve, 300));

      // Trigger refetch for immediate feedback
      await refetchIncidents();

      // Create activity record for the update
      const currentUser: UserRef = {
        id: users[0]?.id || 'system',
        name: users[0]?.name || 'System'
      };

      // Add to activity log
      addActivity({
        type: 'incident',
        activity: 'update',
        entityId: id,
        entityTitle: `Incident #${incident.ticketId}`,
        user: currentUser.name,
        userId: currentUser.id,
        date: new Date(),
        details: `Updated incident details`
      });

      toast.success('Incident updated successfully');
    } catch (error: any) {
      console.error('Error updating incident:', error);
      toast.error(`Failed to update incident: ${error.message}`);
      throw error;
    }
  };

  // Get a specific incident by ID - remove client validation for read operations
  const getIncident = (id: string) => {
    try {
      return incidents.find(incident => incident.id === id);
    } catch (error) {
      console.error('Error getting incident:', error);
      return undefined;
    }
  };

  return {
    addIncident,
    updateIncident,
    getIncident,
    addActivity,
    isSubmitting
  };
}
