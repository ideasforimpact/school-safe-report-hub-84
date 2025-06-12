import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import IncidentDetails from './IncidentDetails';
import CommentsList from './CommentsList';
import InlineCommentForm from './CommentForm.inline';
import SupportingDocuments from './SupportingDocuments';
import { Incident, Comment as IncidentComment, FileItem } from '@/types/incident';
import { IncidentDocument } from '@/services/incident/incidentDocumentService';
import { useIncidents } from '@/contexts/incident';
import { useAuth } from '@/contexts/auth/AuthContext';
import { formatUserFullName } from '@/utils/userUtils';
import { Calendar, MapPin, User, Clock, AlertTriangle, Loader2 } from 'lucide-react';

interface IncidentDetailContentProps {
  incident: Incident;
  statusUpdate: string;
  setStatusUpdate: (status: string) => void;
  incidentActivities: any[];
  commentText: string;
  setCommentText: (text: string) => void;
  commentFiles: FileItem[];
  setCommentFiles: (files: FileItem[]) => void;
  isSubmitting: boolean;
  handleCommentSubmit: () => void;
  handleActionSubmit: () => Promise<void>;
  handleStatusChange: (status: string) => Promise<void>;
  formatDate: (date: Date) => string;
  formatDateTime: (date: Date) => string;
  getStatusColor: (status: string) => string;
  getCommentStatusColor: (status: string) => string;
  addComment: () => Promise<void>;
  updateComment: () => Promise<void>;
  deleteComment: () => Promise<void>;
  canEditComment: () => boolean;
  user: { id: string; name: string };
  isAdmin: boolean;
  updateIncident: () => Promise<void>;
  navigate: ReturnType<typeof useNavigate>;
  onRefreshIncident?: () => Promise<void>;
}

const IncidentDetailContent: React.FC<IncidentDetailContentProps> = ({
  incident,
  statusUpdate,
  setStatusUpdate,
  incidentActivities,
  commentText,
  setCommentText,
  commentFiles,
  setCommentFiles,
  isSubmitting,
  handleCommentSubmit,
  handleActionSubmit,
  handleStatusChange,
  formatDate,
  formatDateTime,
  getStatusColor,
  getCommentStatusColor,
  addComment,
  updateComment,
  deleteComment,
  canEditComment,
  user,
  isAdmin,
  updateIncident,
  navigate,
  onRefreshIncident
}) => {
  const { users } = useIncidents();
  const { user: authUser } = useAuth();
  const [localCommentText, setLocalCommentText] = useState('');
  const [localCommentFiles, setLocalCommentFiles] = useState<FileItem[]>([]);
  const [localIsSubmitting, setLocalIsSubmitting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentIncident, setCurrentIncident] = useState(incident);
  const [isRefreshingIncident, setIsRefreshingIncident] = useState(false);

  // Function to refresh incident details after comment submission
  const handleCommentAdded = useCallback(async () => {
    console.log('Comment added, refreshing incident details...');
    
    setIsRefreshingIncident(true);
    
    try {
      // Call the parent's refresh handler if provided
      if (onRefreshIncident) {
        await onRefreshIncident();
      } else {
        // Fallback to the existing comment submit handler
        handleCommentSubmit();
      }
      
      // Increment refresh key to trigger re-render
      setRefreshKey(prev => prev + 1);
      
      console.log('Incident details refreshed successfully');
    } catch (error) {
      console.error('Error refreshing incident details:', error);
    } finally {
      // Remove loading state after a delay
      setTimeout(() => {
        setIsRefreshingIncident(false);
      }, 1000);
    }
  }, [onRefreshIncident, handleCommentSubmit]);

  const userName = authUser ? formatUserFullName(authUser) : 'Unknown User';
  const userId = authUser?.id || 'unknown';

  // Use currentIncident instead of incident for display
  const displayIncident = currentIncident;

  // Convert incident documents to the expected format
  const convertedDocuments: IncidentDocument[] = (displayIncident.documents || []).map((doc: any) => ({
    id: doc.id || crypto.randomUUID(),
    name: doc.name || 'Unknown Document',
    type: doc.type || 'application/octet-stream',
    size: doc.size || 0,
    url: doc.url || doc.data || '',
    path: doc.path || '',
    uploadedAt: doc.uploadedAt || new Date().toISOString()
  }));

  return (
    <div className="container max-w-6xl py-6">
      {/* Loading overlay for incident refresh */}
      {isRefreshingIncident && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center gap-3 shadow-lg">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            <span className="text-lg font-medium">Refreshing incident details...</span>
          </div>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="comments">
            Comments
            {isRefreshingIncident && <Loader2 className="h-3 w-3 animate-spin ml-1" />}
          </TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-6">
          <IncidentDetails 
            incident={displayIncident}
            statusUpdate={statusUpdate}
            setStatusUpdate={setStatusUpdate}
            handleStatusChange={() => {}}
            formatDate={formatDate}
            formatDateTime={formatDateTime}
            getStatusColor={getStatusColor}
            updateIncident={updateIncident}
          />
        </TabsContent>

        <TabsContent value="documents" className="mt-6">
          <SupportingDocuments
            incidentId={displayIncident.id}
            documents={convertedDocuments}
            canDelete={isAdmin}
            onDocumentDeleted={onRefreshIncident}
          />
        </TabsContent>

        <TabsContent value="comments" className="mt-6 space-y-6">
          {/* Add Comment Form */}
          <InlineCommentForm
            incidentId={displayIncident.id}
            commentText={localCommentText}
            setCommentText={setLocalCommentText}
            commentFiles={localCommentFiles}
            setCommentFiles={setLocalCommentFiles}
            isSubmitting={localIsSubmitting}
            setIsSubmitting={setLocalIsSubmitting}
            onCommentAdded={handleCommentAdded}
          />

          {/* Comments List */}
          <CommentsList
            key={refreshKey}
            comments={displayIncident.comments || []}
            incident={displayIncident}
            addComment={addComment}
            updateComment={updateComment}
            deleteComment={deleteComment}
            formatDate={formatDate}
            formatDateTime={formatDateTime}
            getCommentStatusColor={getCommentStatusColor}
            canEditComment={canEditComment}
            userId={userId}
            userName={userName}
          />
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Activity History</CardTitle>
            </CardHeader>
            <CardContent>
              {incidentActivities && incidentActivities.length > 0 ? (
                <div className="space-y-4">
                  {incidentActivities.map((activity, index) => (
                    <div key={index} className="flex items-start space-x-3 pb-4 border-b border-gray-200 last:border-b-0">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <AlertTriangle className="w-4 h-4 text-blue-600" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">{activity.description}</p>
                        <p className="text-xs text-gray-500 mt-1">{formatDateTime(activity.date)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-6">No activity history available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IncidentDetailContent;
