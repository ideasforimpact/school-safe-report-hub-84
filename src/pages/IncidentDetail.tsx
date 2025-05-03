import { useParams, useNavigate } from 'react-router-dom';
import { useIncidents } from '@/contexts/IncidentContext';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import { Action, Comment as IncidentComment, FileItem, IncidentStatus, User as IncidentUser } from '@/types/incident';
import { useIncidentDetail } from '@/hooks/useIncidentDetail';
import { useState } from 'react';
import { toast } from "sonner";
import IncidentDetailContent from '@/components/incident/IncidentDetailContent';

// Utility for image compression
import { compressImageData } from '@/utils/imageCompression';

const IncidentDetail = () => {
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

  if (!incident) {
    return (
      <Layout>
        <div className="text-center p-8">
          <h2 className="text-xl font-semibold">Incident not found</h2>
          <p className="text-gray-600 mt-2">The incident you're looking for doesn't exist or has been removed.</p>
          <button 
            className="text-primary-600 hover:underline mt-4"
            onClick={() => navigate('/incidents')}
          >
            Return to Incidents List
          </button>
        </div>
      </Layout>
    );
  }

  const handleStatusChange = () => {
    updateIncident(incident.id, { status: statusUpdate as IncidentStatus });
  };

  const handleActionSubmit = (action: Action) => {
    const newActions = [...(incident.actions || []), action];
    updateIncident(incident.id, { actions: newActions });
  };

  const canEditComment = (item: IncidentComment) => {
    return isAdmin || item.createdBy.id === user?.id;
  };

  const handleCommentSubmit = async () => {
    if (!commentText.trim()) return;
    
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

  // Convert AuthContext User to IncidentUser
  const incidentUser: IncidentUser | null = user ? {
    id: user.id,
    name: user.name,
    role: isAdmin ? 'Admin' : 'Staff'
  } : null;

  return (
    <Layout>
      <IncidentDetailContent
        incident={incident}
        incidentActivities={incidentActivities}
        commentText={commentText}
        setCommentText={setCommentText}
        commentFiles={commentFiles}
        setCommentFiles={setCommentFiles}
        isSubmitting={isSubmitting}
        handleCommentSubmit={handleCommentSubmit}
        handleActionSubmit={handleActionSubmit}
        handleStatusChange={handleStatusChange}
        statusUpdate={statusUpdate}
        setStatusUpdate={setStatusUpdate}
        formatDate={formatDate}
        formatDateTime={formatDateTime}
        getStatusColor={getStatusColor}
        getCommentStatusColor={getCommentStatusColor}
        addComment={addComment}
        updateComment={updateComment}
        deleteComment={deleteComment}
        canEditComment={canEditComment}
        user={incidentUser}
        isAdmin={isAdmin}
      />
    </Layout>
  );
};

export default IncidentDetail;
