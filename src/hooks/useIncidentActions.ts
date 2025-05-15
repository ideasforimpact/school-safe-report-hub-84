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
        status: 'New', // Changed default status from 'Open' to 'New'
        createdAt: now,
        updatedAt: now,
        priority: incidentData.priority || 'Medium' // Default priority if not provided
      };
      
      console.log("Creating new incident with data:", JSON.stringify(newIncident, null, 2));
      
      // Add to the local state first for immediate UI feedback
      setIncidents(prev => [newIncident, ...prev]);
      
      // Initialize reference data if needed
      try {
        console.log("Checking if reference data needs initialization");
        const response = await fetch('https://ybvxkiubnnixntghojyy.supabase.co/functions/v1/init-incident-data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Warning: Reference data initialization failed:", errorText);
          // Continue with the submission even if this fails
        } else {
          console.log("Reference data initialization check completed");
        }
      } catch (initError) {
        console.error("Error checking reference data:", initError);
        // Continue with the submission even if this fails
      }
      
      // Prepare IDs for database insertion - with default fallbacks
      let statusId: string | null = null;
      let typeId: string | null = null;
      let categoryId: string | null = null;
      let priorityId: string | null = null;
      let facilityId: string | null = null;
      let locationId: string | null = null;
      
      // Get UUID for status (now using "New" instead of "Open")
      try {
        console.log("Fetching status UUID for 'New'");
        const { data: statusData, error: statusError } = await supabase
          .from('incident_status')
          .select('id')
          .eq('name', 'New');
          
        if (statusError) {
          console.error("Error fetching status:", statusError);
        } else if (statusData && statusData.length > 0) {
          statusId = statusData[0].id;
          console.log("Fetched status UUID:", statusId);
        } else {
          console.log("No status found for 'New', trying to create it");
          
          // Try to create the status if it doesn't exist
          const { data: newStatus, error: createError } = await supabase
            .from('incident_status')
            .insert([{ name: 'New', description: 'Newly reported incident' }])
            .select('id');
            
          if (createError) {
            console.error("Error creating 'New' status:", createError);
          } else if (newStatus && newStatus.length > 0) {
            statusId = newStatus[0].id;
            console.log("Created and fetched 'New' status UUID:", statusId);
          }
        }
      } catch (error) {
        console.error("Failed to fetch status:", error);
      }
      
      // Get UUID for type
      try {
        console.log("Fetching type UUID for:", incidentData.type);
        const { data: typeData, error: typeError } = await supabase
          .from('incident_report_types')
          .select('id')
          .eq('name', incidentData.type);
          
        if (typeError) {
          console.error("Error fetching type:", typeError);
        } else if (typeData && typeData.length > 0) {
          typeId = typeData[0].id;
          console.log("Fetched type UUID:", typeId);
        } else {
          // Try to create the type if it doesn't exist
          const { data: newType, error: createError } = await supabase
            .from('incident_report_types')
            .insert([{ name: incidentData.type, description: `${incidentData.type} report` }])
            .select('id');
            
          if (createError) {
            console.error(`Error creating type ${incidentData.type}:`, createError);
          } else if (newType && newType.length > 0) {
            typeId = newType[0].id;
            console.log("Created and fetched type UUID:", typeId);
          }
        }
      } catch (error) {
        console.error("Failed to fetch type:", error);
      }
      
      // Get UUID for category - with special handling for "Other"
      try {
        console.log("Fetching category UUID for:", incidentData.category);
        
        const { data: categoryData, error: categoryError } = await supabase
          .from('incident_categories')
          .select('id')
          .eq('name', incidentData.category);
            
        if (categoryError) {
          console.error("Error fetching category:", categoryError);
        } else if (categoryData && categoryData.length > 0) {
          categoryId = categoryData[0].id;
          console.log("Fetched category UUID:", categoryId);
        } else {
          // Try to create the category if it doesn't exist
          const { data: newCategory, error: createError } = await supabase
            .from('incident_categories')
            .insert([{ name: incidentData.category, description: `${incidentData.category} incidents`, is_active: true }])
            .select('id');
              
          if (createError) {
            console.error(`Error creating category ${incidentData.category}:`, createError);
          } else if (newCategory && newCategory.length > 0) {
            categoryId = newCategory[0].id;
            console.log(`Created and fetched '${incidentData.category}' category UUID:`, categoryId);
          }
        }
        
        // If we still don't have a category ID, try using "Other" as fallback
        if (!categoryId) {
          // Check for "Other" category
          const { data: otherData, error: otherError } = await supabase
            .from('incident_categories')
            .select('id')
            .eq('name', 'Other');
              
          if (otherError) {
            console.error("Error fetching 'Other' category:", otherError);
          } else if (otherData && otherData.length > 0) {
            categoryId = otherData[0].id;
            console.log("Using 'Other' category as fallback:", categoryId);
          } else {
            // Create "Other" category as last resort
            const { data: newOther, error: createOtherError } = await supabase
              .from('incident_categories')
              .insert([{ name: 'Other', description: 'Other incidents', is_active: true }])
              .select('id');
                
            if (createOtherError) {
              console.error("Error creating 'Other' category:", createOtherError);
            } else if (newOther && newOther.length > 0) {
              categoryId = newOther[0].id;
              console.log("Created and using 'Other' category as fallback:", categoryId);
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch/create category:", error);
      }
      
      // Get UUID for priority
      try {
        console.log("Fetching priority UUID for:", incidentData.priority || 'Medium');
        const { data: priorityData, error: priorityError } = await supabase
          .from('incident_priorities')
          .select('id')
          .eq('name', incidentData.priority || 'Medium');
          
        if (priorityError) {
          console.error("Error fetching priority:", priorityError);
        } else if (priorityData && priorityData.length > 0) {
          priorityId = priorityData[0].id;
          console.log("Fetched priority UUID:", priorityId);
        } else {
          // Try to create the priority if it doesn't exist
          const { data: newPriority, error: createError } = await supabase
            .from('incident_priorities')
            .insert([{ 
              name: incidentData.priority || 'Medium', 
              description: `${incidentData.priority || 'Medium'} priority incidents`, 
              weight: getPriorityWeight(incidentData.priority || 'Medium'),
              color: getPriorityColor(incidentData.priority || 'Medium')
            }])
            .select('id');
            
          if (createError) {
            console.error(`Error creating priority ${incidentData.priority || 'Medium'}:`, createError);
          } else if (newPriority && newPriority.length > 0) {
            priorityId = newPriority[0].id;
            console.log("Created and fetched priority UUID:", priorityId);
          }
        }
      } catch (error) {
        console.error("Failed to fetch priority:", error);
      }
      
      // Find the facility UUID by name
      if (incidentData.facility) {
        try {
          console.log("Looking up facility by name:", incidentData.facility);
          const { data: facilityData, error: facilityError } = await supabase
            .from('facilities')
            .select('id')
            .eq('name', incidentData.facility);
            
          if (facilityError) {
            console.error("Error fetching facility:", facilityError);
          } else if (facilityData && facilityData.length > 0) {
            facilityId = facilityData[0].id;
            console.log("Found facility ID:", facilityId);
          } else {
            console.log("No facility found with name:", incidentData.facility);
          }
        } catch (error) {
          console.error("Failed to fetch facility:", error);
        }
      }
      
      // Convert location from string type to UUID if needed
      if (incidentData.location) {
        try {
          console.log("Looking up location by name:", incidentData.location);
          const { data: locationData, error: locationError } = await supabase
            .from('campuses')  // Assuming locations are stored in campuses table
            .select('id')
            .eq('name', incidentData.location);
            
          if (locationError) {
            console.error("Error fetching location:", locationError);
          } else if (locationData && locationData.length > 0) {
            locationId = locationData[0].id;
            console.log("Found location ID:", locationId);
          } else {
            console.log("No location found with name:", incidentData.location);
          }
        } catch (error) {
          console.error("Failed to fetch location:", error);
        }
      }

      // Ensure we have the minimum required data
      if (!statusId || !categoryId) {
        console.error("Missing required data for database insertion:", {
          statusId,
          categoryId
        });
        
        throw new Error("Could not create required reference data. Please try again.");
      }
      
      // Format the data for database insertion - using real UUIDs from database
      // CRITICAL FIX: Make sure all ID references are valid UUIDs, not simple numeric strings
      const dbIncident = {
        ticket_id: ticketId,
        description: incidentData.description,
        date: incidentData.date.toISOString(),
        location_id: locationId || null,  // Use null if we couldn't find a matching UUID
        people_involved: JSON.stringify(incidentData.peopleInvolved),
        status_id: statusId,
        reported_by_id: incidentData.reportedBy.id,
        facility_id: facilityId || null,  // Use null if we couldn't find a matching UUID
        documents: incidentData.documents ? JSON.stringify(incidentData.documents) : null,
        priority_id: priorityId || null,  // Use null if we couldn't find a matching UUID
        type_id: typeId || null,  // Use null if we couldn't find a matching UUID  
        category_id: categoryId,
        subcategory_id: null,  // Changed from incidentData.subcategory to null as it expects a UUID
        owner_id: incidentData.owner && typeof incidentData.owner !== 'string' 
          ? incidentData.owner.id 
          : null // Make sure owner_id is a proper UUID
      };
      
      console.log("Sending incident data to database:", JSON.stringify(dbIncident, null, 2));
      
      // Insert into the database
      const { data, error } = await supabase
        .from('incidents')
        .insert(dbIncident);
        
      if (error) {
        console.error("Error storing incident in database:", error);
        toast.error("Failed to save incident to database: " + error.message);
        throw error; // Let the parent handle this error
      } else {
        console.log("Successfully inserted incident into database");
        toast.success("Incident reported successfully");
      }
      
      // Log the activity
      addActivity({
        type: 'incident',
        activity: 'create',
        entityId: newIncident.id,
        entityTitle: `${newIncident.ticketId}: ${newIncident.type}: ${newIncident.category} - ${newIncident.subcategory || ''}`,
        user: newIncident.reportedBy.name,
        userId: newIncident.reportedBy.id,
        date: now,
        details: `Incident reported by ${newIncident.reportedBy.name}`
      });
      
      return newIncident;
    } catch (error) {
      console.error("Error adding incident:", error);
      toast.error("There was an error reporting the incident: " + error.message);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper functions for priority handling
  const getPriorityWeight = (priority: string): number => {
    switch (priority) {
      case 'Low': return 1;
      case 'Medium': return 2;
      case 'High': return 3;
      case 'Critical': return 4;
      default: return 2; // Default to Medium
    }
  };
  
  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'Low': return '#22c55e';
      case 'Medium': return '#fbbf24';
      case 'High': return '#f97316';
      case 'Critical': return '#dc2626';
      default: return '#fbbf24'; // Default to Medium (yellow/amber)
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
    const currentIncident = incidents.find(incident => incident.id === id);
    
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
    updateIncident: (id: string, updates: Partial<Incident>) => {
      const now = new Date();
      const currentIncident = incidents.find(incident => incident.id === id);
      
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
    },
    getIncident,
    addActivity,
    isSubmitting
  };
};
