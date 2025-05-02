
import { Incident, Comment as IncidentComment, Activity } from '@/types/incident';
import { toast } from "@/components/ui/sonner";

export const useComments = (
  incidents: Incident[],
  setIncidents: React.Dispatch<React.SetStateAction<Incident[]>>,
  addActivity: (activity: Activity) => void
) => {

  const addComment = (incidentId: string, commentData: Omit<IncidentComment, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date();
    const newComment: IncidentComment = {
      ...commentData,
      id: Date.now().toString(),
      createdAt: now,
      updatedAt: now
    };
    
    setIncidents(prev => 
      prev.map(incident => 
        incident.id === incidentId 
          ? { 
              ...incident, 
              comments: [...(incident.comments || []), newComment],
              updatedAt: now 
            } 
          : incident
      )
    );
    
    // Add to activity log with enhanced audit information
    const incident = incidents.find(inc => inc.id === incidentId);
    if (incident) {
      addActivity({
        type: 'comment',
        activity: 'create',
        entityId: newComment.id,
        entityTitle: `Comment: ${newComment.description.substring(0, 30)}${newComment.description.length > 30 ? '...' : ''}`,
        user: newComment.createdBy.name,
        userId: newComment.createdBy.id,
        date: now,
        details: `Comment created by ${newComment.createdBy.name} and assigned to ${newComment.assignedTo.name}`
      });
    }
    
    toast.success("Comment added");
  };

  const updateComment = (incidentId: string, commentId: string, updates: Partial<IncidentComment>) => {
    const now = new Date();
    const incident = incidents.find(inc => inc.id === incidentId);
    const currentComment = incident?.comments?.find(item => item.id === commentId);
    
    if (!incident || !currentComment) return;
    
    setIncidents(prev => 
      prev.map(incident => {
        if (incident.id !== incidentId) return incident;
        
        const updatedComments = incident.comments?.map(item => 
          item.id === commentId 
            ? { ...item, ...updates, updatedAt: now } 
            : item
        ) || [];
        
        return { 
          ...incident, 
          comments: updatedComments,
          updatedAt: now
        };
      })
    );
    
    // Log status change specifically
    if (updates.status && updates.status !== currentComment.status) {
      const user = updates.createdBy?.name || currentComment.createdBy.name;
      const userId = updates.createdBy?.id || currentComment.createdBy.id;
      
      addActivity({
        type: 'comment',
        activity: 'update',
        entityId: commentId,
        entityTitle: `Comment: ${currentComment.description.substring(0, 30)}${currentComment.description.length > 30 ? '...' : ''}`,
        user,
        userId,
        date: now,
        details: `Comment status changed from ${currentComment.status} to ${updates.status} by ${user}`
      });
    } 
    // Log assignee change
    else if (updates.assignedTo && updates.assignedTo.id !== currentComment.assignedTo.id) {
      const user = updates.createdBy?.name || currentComment.createdBy.name;
      const userId = updates.createdBy?.id || currentComment.createdBy.id;
      
      addActivity({
        type: 'comment',
        activity: 'update',
        entityId: commentId,
        entityTitle: `Comment: ${currentComment.description.substring(0, 30)}${currentComment.description.length > 30 ? '...' : ''}`,
        user,
        userId,
        date: now,
        details: `Comment reassigned from ${currentComment.assignedTo.name} to ${updates.assignedTo.name} by ${user}`
      });
    }
    // Log other updates
    else if (Object.keys(updates).length > 0) {
      const user = updates.createdBy?.name || currentComment.createdBy.name;
      const userId = updates.createdBy?.id || currentComment.createdBy.id;
      
      addActivity({
        type: 'comment',
        activity: 'update',
        entityId: commentId,
        entityTitle: `Comment: ${currentComment.description.substring(0, 30)}${currentComment.description.length > 30 ? '...' : ''}`,
        user,
        userId,
        date: now,
        details: `Comment updated by ${user}`
      });
    }
    
    toast.success("Comment updated");
  };

  const deleteComment = (incidentId: string, commentId: string) => {
    const incident = incidents.find(inc => inc.id === incidentId);
    const comment = incident?.comments?.find(item => item.id === commentId);
    
    if (!incident || !comment) return;
    
    setIncidents(prev => 
      prev.map(incident => {
        if (incident.id !== incidentId) return incident;
        
        const filteredComments = incident.comments?.filter(item => 
          item.id !== commentId
        ) || [];
        
        return { 
          ...incident, 
          comments: filteredComments,
          updatedAt: new Date()
        };
      })
    );
    
    addActivity({
      type: 'comment',
      activity: 'delete',
      entityId: commentId,
      entityTitle: `Comment: ${comment.description.substring(0, 30)}${comment.description.length > 30 ? '...' : ''}`,
      user: comment.createdBy.name,
      userId: comment.createdBy.id,
      date: new Date(),
      details: `Comment deleted by ${comment.createdBy.name}`
    });
    
    toast.success("Comment deleted");
  };

  return {
    addComment,
    updateComment,
    deleteComment
  };
};
