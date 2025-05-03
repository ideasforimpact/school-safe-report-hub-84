
import { useParams, useNavigate } from 'react-router-dom';
import { useIncidents } from '@/contexts/IncidentContext';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import { Action, Comment as IncidentComment, FileItem } from '@/types/incident';
import { useIncidentDetail } from '@/hooks/useIncidentDetail';

// Refactored components
import IncidentHeader from '@/components/incident/IncidentHeader';
import IncidentDetailsCard from '@/components/incident/IncidentDetailsCard';
import IncidentTabs from '@/components/incident/IncidentTabs';
import CommentsList from '@/components/incident/CommentsList';
import AddActionForm from '@/components/incident/AddActionForm';
import ActionsList from '@/components/incident/ActionsList';
import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import MultipleFilesUpload from '@/components/MultipleFilesUpload';
import { Paperclip, Send } from 'lucide-react';
import { toast } from "sonner";

// Helper function to compress image data
const compressImageData = async (file: FileItem): Promise<FileItem> => {
  // If it's not an image, return as is
  if (!file.type.startsWith('image/')) {
    return file;
  }
  
  // For images, compress them
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 800;
      const MAX_HEIGHT = 600;
      
      let width = img.width;
      let height = img.height;
      
      if (width > height) {
        if (width > MAX_WIDTH) {
          height = Math.round(height * (MAX_WIDTH / width));
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width = Math.round(width * (MAX_HEIGHT / height));
          height = MAX_HEIGHT;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      
      // Use lower quality for JPEG
      const quality = file.type === 'image/jpeg' || file.type === 'image/jpg' ? 0.7 : 0.9;
      const compressedBase64 = canvas.toDataURL(file.type, quality);
      
      resolve({
        ...file,
        base64: compressedBase64,
        size: Math.round(compressedBase64.length * 0.75) // Approximate size after compression
      });
    };
    img.src = file.base64;
  });
};

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
  const [showFileUpload, setShowFileUpload] = useState(false);

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
    updateIncident(incident.id, { status: statusUpdate });
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
      setShowFileUpload(false);
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Failed to add comment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header with back button, title, and status management */}
        <IncidentHeader 
          incident={incident}
          statusUpdate={statusUpdate}
          setStatusUpdate={setStatusUpdate}
          handleStatusChange={handleStatusChange}
          formatDateTime={formatDateTime}
          getStatusColor={getStatusColor}
          isAdmin={isAdmin}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            {/* Incident Details Card - Always visible */}
            <IncidentDetailsCard 
              incident={incident} 
              formatDateTime={formatDateTime} 
            />
            
            {/* Improved Inline Comment Form */}
            <div className="bg-white rounded-md border shadow-sm p-4">
              <h3 className="font-medium text-lg mb-3">Add Comment</h3>
              
              <div className="space-y-4">
                <div className="flex flex-col space-y-2">
                  <Textarea
                    placeholder="Type your comment here..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="min-h-[80px] w-full resize-none"
                  />
                  
                  {showFileUpload && (
                    <div className="border-t pt-3 mt-2">
                      <MultipleFilesUpload
                        onFilesChange={setCommentFiles}
                        initialFiles={commentFiles}
                        maxFiles={3}
                      />
                    </div>
                  )}
                </div>
                
                <div className="flex justify-between items-center">
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFileUpload(!showFileUpload)}
                    className="flex items-center gap-1"
                  >
                    <Paperclip className="h-4 w-4" />
                    {commentFiles.length > 0 ? `${commentFiles.length} file(s)` : "Add files"}
                  </Button>
                  
                  <Button 
                    onClick={handleCommentSubmit}
                    disabled={!commentText.trim() || isSubmitting}
                    className="flex items-center gap-1"
                  >
                    <Send className="h-4 w-4" />
                    {isSubmitting ? 'Sending...' : 'Send Comment'}
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Comments List */}
            <CommentsList
              comments={incident.comments || []}
              incident={incident}
              addComment={addComment}
              updateComment={updateComment}
              deleteComment={deleteComment}
              formatDate={formatDate}
              getCommentStatusColor={getCommentStatusColor}
              canEditComment={canEditComment}
              userId={user?.id || ''}
              userName={user?.name || ''}
            />

            {/* Audit Trail in a collapsible section */}
            <div className="mt-6">
              <IncidentTabs 
                activities={incidentActivities} 
                formatDateTime={formatDateTime} 
              />
            </div>
            
            {/* Add Action Form - only for admins */}
            {isAdmin && (
              <AddActionForm onSubmit={handleActionSubmit} />
            )}
          </div>

          <div>
            {/* Actions Taken List */}
            <ActionsList 
              actions={incident.actions || []}
              formatDate={formatDate}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default IncidentDetail;
