
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useIncidents } from '@/contexts/IncidentContext';
import { useAuth } from '@/contexts/AuthContext';
import { Action, Comment as IncidentComment, FileItem, IncidentStatus, User as IncidentUser } from '@/types/incident';
import { useIncidentDetail } from '@/hooks/useIncidentDetail';
import { toast } from "sonner";
import { compressImageData } from '@/utils/imageCompression';

export const useIncidentDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getIncident, updateIncident, addComment, updateComment, deleteComment, getIncidentActivities } = useIncidents();
  const { user, isAdmin } = useAuth();
  const { formatDate, formatDateTime, getStatusColor, getCommentStatusColor, useStatusUpdate } = useIncidentDetail();

  const incident = getIncident(id || '');
  const incidentActivities = incident ? getIncidentActivities(incident.id) : [];

  const { statusUpdate, setStatusUpdate } = useStatusUpdate(incident?.status || 'Open');

  // Comment form state
  const [commentText, setCommentText] = useState('');
  const [commentFiles, setCommentFiles] = useState<FileItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Convert AuthContext User to IncidentUser
  const incidentUser: IncidentUser | null = user ? {
    id: user.id,
    name: user.name,
    role: isAdmin ? 'Admin' : 'Staff'
  } : null;

  const handleStatusChange = () => {
    if (incident) {
      updateIncident(incident.id, { status: statusUpdate as IncidentStatus });
    }
  };

  const handleActionSubmit = (action: Action) => {
    if (incident) {
      const newActions = [...(incident.actions || []), action];
      updateIncident(incident.id, { actions: newActions });
    }
  };

  const canEditComment = (item: IncidentComment) => {
    return isAdmin || item.createdBy.id === user?.id;
  };

  const handleCommentSubmit = async () => {
    if (!commentText.trim() || !incident) return;
    
    setIsSubmitting(true);
    
    try {
      // Compress any images before saving
      const processedFiles: FileItem[] = [];
      
      if (commentFiles.length > 0) {
        for (const file of commentFiles) {
          const processedFile = await compressImageData(file);
          processedFiles.push(processedFile);
        }
      }
      
      const commentData: Omit<IncidentComment, 'id' | 'createdAt' | 'updatedAt'> = {
        description: commentText,
        dueDate: new Date(),
        assignedTo: { id: '', name: '' },
        status: 'Pending',
        createdBy: { id: user?.id || '', name: user?.name || '' },
        files: processedFiles
      };
      
      addComment(incident.id, commentData);
      toast.success("Comment added successfully");
      
      // Reset form
      setCommentText('');
      setCommentFiles([]);
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Failed to add comment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    id,
    navigate,
    incident,
    incidentActivities,
    commentText,
    setCommentText,
    commentFiles,
    setCommentFiles,
    isSubmitting,
    handleCommentSubmit,
    handleActionSubmit,
    handleStatusChange,
    statusUpdate,
    setStatusUpdate,
    formatDate,
    formatDateTime,
    getStatusColor,
    getCommentStatusColor,
    addComment,
    updateComment,
    deleteComment,
    canEditComment,
    user: incidentUser,
    isAdmin,
    updateIncident
  };
};
