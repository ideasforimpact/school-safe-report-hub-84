
import { useState } from 'react';
import { toast } from "@/components/ui/sonner";
import { Incident, ActionItem, Activity, User } from '@/types/incident';
import { generateTicketId } from '@/utils/incidentUtils';

export const useIncidentActions = (
  incidents: Incident[],
  setIncidents: React.Dispatch<React.SetStateAction<Incident[]>>,
  activities: Activity[],
  setActivities: React.Dispatch<React.SetStateAction<Activity[]>>,
  users: User[]
) => {
  
  // Add a new activity to the log with enhanced audit information
  const addActivity = (activity: Activity) => {
    setActivities(prev => [activity, ...prev]);
  };

  const addIncident = (incidentData: Omit<Incident, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'ticketId'>) => {
    const now = new Date();
    const ticketId = generateTicketId();
    
    const newIncident: Incident = {
      ...incidentData,
      id: Date.now().toString(),
      ticketId,
      status: 'Open', // The status is set here internally
      createdAt: now,
      updatedAt: now,
      priority: incidentData.priority || 'Medium' // Default priority if not provided
    };
    
    setIncidents(prev => [newIncident, ...prev]);
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
  };

  const updateIncident = (id: string, updates: Partial<Incident>) => {
    const now = new Date();
    const currentIncident = incidents.find(inc => inc.id === id);
    
    // Skip if no changes or incident not found
    if (!currentIncident) return;
    
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
    return incidents.find(incident => incident.id === id);
  };

  return {
    addIncident,
    updateIncident,
    getIncident,
    addActivity
  };
};
