
import { useState } from 'react';
import { Incident, Comment, Activity, User } from '@/types/incident';

export const useComments = (
  incidents: Incident[],
  setIncidents: React.Dispatch<React.SetStateAction<Incident[]>>,
  activities: Activity[],
  setActivities: React.Dispatch<React.SetStateAction<Activity[]>>,
  users: User[]
) => {
  const addActivity = (activity: Activity) => {
    setActivities(prev => [activity, ...prev]);
  };

  const addComment = (incidentId: string, comment: Omit<Comment, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date();
    const newComment = {
      ...comment,
      id: Date.now().toString(),
      createdAt: now,
      updatedAt: now
    };
    
    setIncidents(prev => 
      prev.map(incident => 
        incident.id === incidentId
          ? {
              ...incident,
              comments: [...(incident.comments || []), newComment]
            }
          : incident
      )
    );
    
    const incident = incidents.find(inc => inc.id === incidentId);
    if (incident) {
      addActivity({
        type: 'comment',
        activity: 'create',
        entityId: newComment.id,
        entityTitle: `Comment on ${incident.type}: ${incident.category}`,
        user: comment.createdBy.name,
        userId: comment.createdBy.id,
        date: now,
        details: `Comment added by ${comment.createdBy.name}`
      });
    }
    
    return newComment;
  };
  
  const updateComment = (incidentId: string, commentId: string, updates: Partial<Comment>) => {
    const now = new Date();
    
    setIncidents(prev => 
      prev.map(incident => 
        incident.id === incidentId && incident.comments
          ? {
              ...incident,
              comments: incident.comments.map(comment => 
                comment.id === commentId
                  ? { ...comment, ...updates, updatedAt: now }
                  : comment
              )
            }
          : incident
      )
    );
    
    const incident = incidents.find(inc => inc.id === incidentId);
    const comment = incident?.comments?.find(c => c.id === commentId);
    
    if (incident && comment) {
      addActivity({
        type: 'comment',
        activity: 'update',
        entityId: commentId,
        entityTitle: `Comment on ${incident.type}: ${incident.category}`,
        user: updates.createdBy?.name || comment.createdBy.name,
        userId: updates.createdBy?.id || comment.createdBy.id,
        date: now,
        details: `Comment updated by ${updates.createdBy?.name || comment.createdBy.name}`
      });
    }
  };
  
  const deleteComment = (incidentId: string, commentId: string) => {
    const now = new Date();
    const incident = incidents.find(inc => inc.id === incidentId);
    const comment = incident?.comments?.find(c => c.id === commentId);
    
    setIncidents(prev => 
      prev.map(incident => 
        incident.id === incidentId && incident.comments
          ? {
              ...incident,
              comments: incident.comments.filter(comment => comment.id !== commentId)
            }
          : incident
      )
    );
    
    if (incident && comment) {
      addActivity({
        type: 'comment',
        activity: 'delete',
        entityId: commentId,
        entityTitle: `Comment on ${incident.type}: ${incident.category}`,
        user: comment.createdBy.name,
        userId: comment.createdBy.id,
        date: now,
        details: `Comment deleted by ${comment.createdBy.name}`
      });
    }
  };

  return {
    addComment,
    updateComment,
    deleteComment
  };
};
