
import { useState } from 'react';
import { toast } from "sonner";
import { Incident, ActionItem, Activity, User } from '@/types/incident';
import { generateTicketId } from '@/utils/incidentUtils';
import { supabase } from "@/integrations/supabase/client";

export const useIncidentActions = (
  incidents: Incident[],
  setIncidents: React.Dispatch<React.SetStateAction<Incident[]>>,
  activities: Activity[],
  setActivities: React.Dispatch<React.SetStateAction<Activity[]>>,
  users: User[]
) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Add a new activity to the log with enhanced audit information
  const addActivity = (activity: Activity) => {
    setActivities(prev => [activity, ...prev]);
  };

  const addIncident = async (incidentData: Omit<Incident, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'ticketId'>) => {
    const now = new Date();
    const ticketId = generateTicketId();
    setIsSubmitting(true);
    
    try {
      // Create the incident object for local state
      const newIncident: Incident = {
        ...incidentData,
        id: Date.now().toString(),
        ticketId,
        status: 'Open', // Default status is Open
        createdAt: now,
        updatedAt: now,
        priority: incidentData.priority || 'Medium' // Default priority if not provided
      };
      
      // Add to the local state first for immediate UI feedback
      setIncidents(prev => [newIncident, ...prev]);
      
      // Get UUIDs for status, type, category
      // Get UUID for status (assuming "Open" = status_id 1)
      const { data: statusData } = await supabase
        .from('incident_status')
        .select('id')
        .eq('name', 'Open')
        .single();
      
      const { data: typeData } = await supabase
        .from('incident_report_types')
        .select('id')
        .eq('name', incidentData.type)
        .single();
      
      const { data: categoryData } = await supabase
        .from('incident_categories')
        .select('id')
        .eq('name', incidentData.category)
        .single();
      
      const { data: priorityData } = await supabase
        .from('incident_priorities')
        .select('id')
        .eq('name', incidentData.priority || 'Medium')
        .single();
      
      // Format the data for database insertion - using real UUIDs from database
      const dbIncident = {
        ticket_id: ticketId,
        description: incidentData.description,
        date: incidentData.date.toISOString(),
        location_id: incidentData.location ? incidentData.location : null,
        people_involved: JSON.stringify(incidentData.peopleInvolved),
        status_id: statusData?.id || null,
        reported_by_id: incidentData.reportedBy.id,
        facility_id: incidentData.facility ? incidentData.facility : null,
        documents: incidentData.documents ? JSON.stringify(incidentData.documents) : null,
        priority_id: priorityData?.id || null,
        type_id: typeData?.id || null,
        category_id: categoryData?.id || null,
        subcategory_id: incidentData.subcategory || null,
        owner_id: incidentData.owner ? incidentData.owner.id : null
      };
      
      console.log("Sending incident data to database:", dbIncident);
      
      // Insert into the database
      const { data, error } = await supabase
        .from('incidents')
        .insert(dbIncident);
        
      if (error) {
        console.error("Error storing incident in database:", error);
        toast.error("Failed to save incident to database");
        throw error;
      }
      
      // Log the activity
      addActivity({
        type: 'incident',
        activity: 'create',
        entityId: newIncident.id,
        entityTitle: `${newIncident.ticketId}: ${newIncident.type}: ${newIncident.category} - ${newIncident.subcategory}`,
        user: newIncident.reportedBy.name,
        userId: newIncident.reportedBy.id,
        date: now,
        details: `Incident reported by ${newIncident.reportedBy.name}`
      });
      
      toast.success("Incident reported successfully");
      return newIncident;
    } catch (error) {
      console.error("Error adding incident:", error);
      toast.error("There was an error reporting the incident");
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper functions to map string values to string IDs for database
  const mapPriorityToId = (priority: string): string => {
    switch (priority) {
      case 'Low': return "1";
      case 'Medium': return "2";
      case 'High': return "3";
      case 'Critical': return "4";
      default: return "2"; // Default to Medium
    }
  };
  
  const mapTypeToId = (type: string): string => {
    switch (type) {
      case 'Incident': return "1";
      case 'Near Miss': return "2";
      case 'Unsafe Condition': return "3";
      default: return "1"; // Default to Incident
    }
  };
  
  const mapCategoryToId = (category: string): string => {
    switch (category) {
      case 'Physical Injury': return "1";
      case 'Bullying': return "2";
      case 'Tech Misuse': return "3";
      case 'Property Damage': return "4";
      case 'Health Concern': return "5";
      case 'Security Breach': return "6";
      case 'Other': return "7";
      default: return "7"; // Default to Other
    }
  };

  const updateIncident = (id: string, updates: Partial<Incident>) => {
    const now = new Date();
    const currentIncident = incidents.find(inc => inc.id === id);
    
    // Skip if no changes or incident not found
    if (!currentIncident) return;
    
    // Check if incident is being voided
    const isBeingVoided = updates.isVoided === true && !currentIncident.isVoided;
    
    // Don't allow updates to voided incidents unless it's an admin action
    if (currentIncident.isVoided && !isBeingVoided) {
      toast.error("Cannot update a voided incident");
      return;
    }
    
    // Check if this is a reopened ticket (was previously closed and now being reopened)
    if (updates.status && 
        updates.status !== 'Closed' && 
        currentIncident.status === 'Closed') {
      updates.wasReopened = true;
    }
    
    setIncidents(prev => 
      prev.map(incident => 
        incident.id === id 
          ? { ...incident, ...updates, updatedAt: now } 
          : incident
      )
    );
    
    // Handle voiding an incident
    if (isBeingVoided) {
      const user = updates.reportedBy?.name || currentIncident.reportedBy.name;
      const userId = updates.reportedBy?.id || currentIncident.reportedBy.id;
      
      addActivity({
        type: 'incident',
        activity: 'void',
        entityId: id,
        entityTitle: `${currentIncident.ticketId}: ${currentIncident.type}: ${currentIncident.category} - ${currentIncident.subcategory}`,
        user,
        userId,
        date: now,
        details: `Incident voided by ${user}. Reason: ${updates.voidReason}`
      });
      
      toast.warning("Incident has been marked as void");
      return;
    }
    
    // Log status change specifically
    if (updates.status && updates.status !== currentIncident.status) {
      const user = updates.reportedBy?.name || currentIncident.reportedBy.name;
      const userId = updates.reportedBy?.id || currentIncident.reportedBy.id;
      
      // Special handling for reopening
      if (updates.status !== 'Closed' && currentIncident.status === 'Closed') {
        addActivity({
          type: 'status',
          activity: 'reopen',
          entityId: id,
          entityTitle: `${currentIncident.type}: ${currentIncident.category} - ${currentIncident.subcategory}`,
          user,
          userId,
          date: now,
          details: `Incident reopened by ${user}`
        });
        toast.warning("Incident has been reopened");
      } 
      else {
        addActivity({
          type: 'status',
          activity: updates.status === 'Closed' ? 'close' : 'update',
          entityId: id,
          entityTitle: `${currentIncident.type}: ${currentIncident.category} - ${currentIncident.subcategory}`,
          user,
          userId,
          date: now,
          details: `Status changed from ${currentIncident.status} to ${updates.status} by ${user}`
        });
      }
    } 
    // Log owner assignment
    else if (updates.owner && (!currentIncident.owner || updates.owner.id !== currentIncident.owner.id)) {
      const user = updates.reportedBy?.name || currentIncident.reportedBy.name;
      const userId = updates.reportedBy?.id || currentIncident.reportedBy.id;
      
      addActivity({
        type: 'incident',
        activity: 'update',
        entityId: id,
        entityTitle: `${currentIncident.type}: ${currentIncident.category} - ${currentIncident.subcategory}`,
        user,
        userId,
        date: now,
        details: `Incident assigned to ${updates.owner.name} by ${user}`
      });
    }
    // Log other updates
    else if (Object.keys(updates).length > 0) {
      const user = updates.reportedBy?.name || currentIncident.reportedBy.name;
      const userId = updates.reportedBy?.id || currentIncident.reportedBy.id;
      
      addActivity({
        type: 'incident',
        activity: 'update',
        entityId: id,
        entityTitle: `${currentIncident.type}: ${currentIncident.category} - ${currentIncident.subcategory}`,
        user,
        userId,
        date: now,
        details: `Incident details updated by ${user}`
      });
    }
    
    toast.success("Incident updated");
  };

  const getIncident = (id: string) => {
    // Improved incident lookup with debugging
    const foundIncident = incidents.find(incident => incident.id === id);
    if (!foundIncident) {
      console.log(`Could not find incident with ID: ${id}`);
      console.log(`Available incident IDs:`, incidents.map(inc => inc.id));
    }
    return foundIncident;
  };

  return {
    addIncident,
    updateIncident,
    getIncident,
    addActivity,
    isSubmitting
  };
};
