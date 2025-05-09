
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIncident } from '@/contexts/IncidentContext';
import { useAuth } from '@/contexts/auth/types';
import { toast } from 'sonner';
import { formatUserFullName } from '@/utils/userUtils';

export function useIncidentDetailPage(id: string) {
  const { getIncidentById, updateIncidentStatus, addIncidentComment } = useIncident();
  const { user } = useAuth();
  const incident = getIncidentById(id);
  const navigate = useNavigate();
  
  const [statusOptions, setStatusOptions] = useState<string[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!incident) {
      navigate('/incidents', { replace: true });
      return;
    }
    
    // Define available status transitions based on current status
    const availableTransitions: Record<string, string[]> = {
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
  }, [incident, navigate]);

  const handleStatusChange = async (newStatus: string) => {
    if (!incident) return;
    
    setIsLoading(true);
    
    try {
      await updateIncidentStatus(incident.id, newStatus);
      
      // Auto-generate a comment about the status change
      const userName = user ? formatUserFullName(user) : 'A user';
      const statusComment = `${userName} changed status from ${incident.status} to ${newStatus}`;
      
      await addIncidentComment(incident.id, {
        id: `comment_${Date.now()}`,
        authorId: user?.id || 'system',
        authorName: user ? formatUserFullName(user) : 'System',
        content: statusComment,
        timestamp: new Date().toISOString(),
        type: 'status_change'
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
      await addIncidentComment(incident.id, {
        id: `comment_${Date.now()}`,
        authorId: user.id,
        authorName: formatUserFullName(user),
        content: newComment,
        timestamp: new Date().toISOString(),
        type: 'comment'
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
    newComment,
    setNewComment,
    isLoading,
    handleStatusChange,
    handleAddComment
  };
}
