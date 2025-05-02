
import { Incident, ActionItem, Activity } from '@/types/incident';
import { toast } from "@/components/ui/sonner";

export const useActionItems = (
  incidents: Incident[],
  setIncidents: React.Dispatch<React.SetStateAction<Incident[]>>,
  addActivity: (activity: Activity) => void
) => {

  const addActionItem = (incidentId: string, actionItemData: Omit<ActionItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date();
    const newActionItem: ActionItem = {
      ...actionItemData,
      id: Date.now().toString(),
      createdAt: now,
      updatedAt: now
    };
    
    setIncidents(prev => 
      prev.map(incident => 
        incident.id === incidentId 
          ? { 
              ...incident, 
              actionItems: [...(incident.actionItems || []), newActionItem],
              updatedAt: now 
            } 
          : incident
      )
    );
    
    // Add to activity log with enhanced audit information
    const incident = incidents.find(inc => inc.id === incidentId);
    if (incident) {
      addActivity({
        type: 'actionItem',
        activity: 'create',
        entityId: newActionItem.id,
        entityTitle: `Action: ${newActionItem.description.substring(0, 30)}${newActionItem.description.length > 30 ? '...' : ''}`,
        user: newActionItem.createdBy.name,
        userId: newActionItem.createdBy.id,
        date: now,
        details: `Action item created by ${newActionItem.createdBy.name} and assigned to ${newActionItem.assignedTo.name}`
      });
    }
    
    toast.success("Action item added");
  };

  const updateActionItem = (incidentId: string, actionItemId: string, updates: Partial<ActionItem>) => {
    const now = new Date();
    const incident = incidents.find(inc => inc.id === incidentId);
    const currentActionItem = incident?.actionItems?.find(item => item.id === actionItemId);
    
    if (!incident || !currentActionItem) return;
    
    setIncidents(prev => 
      prev.map(incident => {
        if (incident.id !== incidentId) return incident;
        
        const updatedActionItems = incident.actionItems?.map(item => 
          item.id === actionItemId 
            ? { ...item, ...updates, updatedAt: now } 
            : item
        ) || [];
        
        return { 
          ...incident, 
          actionItems: updatedActionItems,
          updatedAt: now
        };
      })
    );
    
    // Log status change specifically
    if (updates.status && updates.status !== currentActionItem.status) {
      const user = updates.createdBy?.name || currentActionItem.createdBy.name;
      const userId = updates.createdBy?.id || currentActionItem.createdBy.id;
      
      addActivity({
        type: 'actionItem',
        activity: 'update',
        entityId: actionItemId,
        entityTitle: `Action: ${currentActionItem.description.substring(0, 30)}${currentActionItem.description.length > 30 ? '...' : ''}`,
        user,
        userId,
        date: now,
        details: `Action item status changed from ${currentActionItem.status} to ${updates.status} by ${user}`
      });
    } 
    // Log assignee change
    else if (updates.assignedTo && updates.assignedTo.id !== currentActionItem.assignedTo.id) {
      const user = updates.createdBy?.name || currentActionItem.createdBy.name;
      const userId = updates.createdBy?.id || currentActionItem.createdBy.id;
      
      addActivity({
        type: 'actionItem',
        activity: 'update',
        entityId: actionItemId,
        entityTitle: `Action: ${currentActionItem.description.substring(0, 30)}${currentActionItem.description.length > 30 ? '...' : ''}`,
        user,
        userId,
        date: now,
        details: `Action item reassigned from ${currentActionItem.assignedTo.name} to ${updates.assignedTo.name} by ${user}`
      });
    }
    // Log other updates
    else if (Object.keys(updates).length > 0) {
      const user = updates.createdBy?.name || currentActionItem.createdBy.name;
      const userId = updates.createdBy?.id || currentActionItem.createdBy.id;
      
      addActivity({
        type: 'actionItem',
        activity: 'update',
        entityId: actionItemId,
        entityTitle: `Action: ${currentActionItem.description.substring(0, 30)}${currentActionItem.description.length > 30 ? '...' : ''}`,
        user,
        userId,
        date: now,
        details: `Action item updated by ${user}`
      });
    }
    
    toast.success("Action item updated");
  };

  const deleteActionItem = (incidentId: string, actionItemId: string) => {
    const incident = incidents.find(inc => inc.id === incidentId);
    const actionItem = incident?.actionItems?.find(item => item.id === actionItemId);
    
    if (!incident || !actionItem) return;
    
    setIncidents(prev => 
      prev.map(incident => {
        if (incident.id !== incidentId) return incident;
        
        const filteredActionItems = incident.actionItems?.filter(item => 
          item.id !== actionItemId
        ) || [];
        
        return { 
          ...incident, 
          actionItems: filteredActionItems,
          updatedAt: new Date()
        };
      })
    );
    
    addActivity({
      type: 'actionItem',
      activity: 'delete',
      entityId: actionItemId,
      entityTitle: `Action: ${actionItem.description.substring(0, 30)}${actionItem.description.length > 30 ? '...' : ''}`,
      user: actionItem.createdBy.name,
      userId: actionItem.createdBy.id,
      date: new Date(),
      details: `Action item deleted by ${actionItem.createdBy.name}`
    });
    
    toast.success("Action item deleted");
  };

  return {
    addActionItem,
    updateActionItem,
    deleteActionItem
  };
};
