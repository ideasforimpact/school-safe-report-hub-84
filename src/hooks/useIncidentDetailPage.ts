
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIncidents } from '@/contexts/incident'; // Fixed import path
import { useAuth } from '@/contexts/auth/AuthContext';
import { toast } from 'sonner';
import { formatUserFullName } from '@/utils/userUtils';
import { IncidentStatus } from '@/types/incident';

export function useIncidentDetailPage(id: string) {
  const { incidents, updateIncident, addComment, getIncident } = useIncidents();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Get incident directly from context
  const incident = getIncident(id);
  
  const [statusOptions, setStatusOptions] = useState<string[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusUpdate, setStatusUpdate] = useState<IncidentStatus>(incident?.status || 'Open');
  const [incidentActivities, setIncidentActivities] = useState([]);

  useEffect(() => {
    console.log("useIncidentDetailPage - Incident ID:", id);
    console.log("useIncidentDetailPage - Found incident:", !!incident);
    
    if (!incident) {
      return;
    }
    
    // Set the initial status update value to match the current incident status
    setStatusUpdate(incident.status);
    
    // Define available status transitions based on current status
    const availableTransitions: Record<string, string[]> = {
      'New': ['Open', 'In Progress', 'Resolved', 'Closed'],
      'Open': ['In Progress', 'Resolved', 'Closed'],
      'In Progress': ['Resolved', 'Closed'],
      'Resolved': ['Closed', 'Reopened'],
      'Closed': ['Reopened'],
      'Reopened': ['In Progress', 'Resolved', 'Closed']
    };
    
    if (incident.status && availableTransitions[incident.status]) {
      setStatusOptions(availableTransitions[incident.status]);
    } else {
      setStatusOptions(['Open', 'In Progress', 'Resolved', 'Closed']);
    }
  }, [incident, id]);

  const handleStatusChange = async (newStatus: string) => {
    if (!incident) {
      console.error("No incident found for status change");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Update the incident status - Cast to IncidentStatus
      await updateIncident(incident.id, { status: newStatus as IncidentStatus });
      
      // Update the local state
      setStatusUpdate(newStatus as IncidentStatus);
      
      // Auto-generate a comment about the status change
      const userName = user ? formatUserFullName(user) : 'A user';
      const statusComment = `${userName} changed status from ${incident.status} to ${newStatus}`;
      
      // Add a comment about the status change
      await addComment(incident.id, {
        description: statusComment,
        dueDate: new Date(),
        assignedTo: { id: user?.id || 'system', name: userName },
        status: 'Pending',
        createdBy: { id: user?.id || 'system', name: userName },
      });
      
      toast.success(`Status updated to ${newStatus}`);
    } catch (error) {
      toast.error('Failed to update status');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAddComment = async () => {
    if (!incident || !newComment.trim() || !user) return;
    
    setIsLoading(true);
    
    try {
      // Add a new comment to the incident
      await addComment(incident.id, {
        description: newComment,
        dueDate: new Date(),
        assignedTo: { id: user.id, name: formatUserFullName(user) },
        status: 'Pending',
        createdBy: { id: user.id, name: formatUserFullName(user) },
      });
      
      setNewComment('');
      toast.success('Comment added successfully');
    } catch (error) {
      toast.error('Failed to add comment');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    incident,
    statusOptions,
    statusUpdate,
    setStatusUpdate,
    newComment,
    setNewComment,
    isLoading,
    handleStatusChange,
    handleAddComment,
    incidentId: id,
    navigate,
    incidentActivities
  };
}
