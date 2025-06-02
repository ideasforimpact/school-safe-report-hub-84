
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
import { Incident, Comment as IncidentComment, FileItem } from '@/types/incident';
import { useIncidents } from '@/contexts/incident';
import { useAuth } from '@/contexts/auth/AuthContext';
import { formatUserFullName } from '@/utils/userUtils';
import { Calendar, MapPin, User, Clock, AlertTriangle } from 'lucide-react';

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
  navigate
}) => {
  const { users } = useIncidents();
  const { user: authUser } = useAuth();
  const [localCommentText, setLocalCommentText] = useState('');
  const [localCommentFiles, setLocalCommentFiles] = useState<FileItem[]>([]);
  const [localIsSubmitting, setLocalIsSubmitting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentIncident, setCurrentIncident] = useState(incident);

  // Function to refresh comments without page reload
  const handleCommentAdded = useCallback(() => {
    console.log('Comment added, refreshing comments...');
    // Increment refresh key to trigger re-render
    setRefreshKey(prev => prev + 1);
    
    // Update the local incident state with new comments
    // This will be updated when the parent component re-fetches data
    setCurrentIncident(prev => ({
      ...prev,
      comments: prev.comments || []
    }));
    
    // Call the parent's refresh handler
    handleCommentSubmit();
  }, [handleCommentSubmit]);

  const userName = authUser ? formatUserFullName(authUser) : 'Unknown User';
  const userId = authUser?.id || 'unknown';

  // Use currentIncident instead of incident for display
  const displayIncident = currentIncident;

  // Create a wrapper function for status change that uses the current statusUpdate value
  const handleStatusUpdate = useCallback(async () => {
    try {
      await handleStatusChange(statusUpdate);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  }, [handleStatusChange, statusUpdate]);

  return (
    <div className="container max-w-6xl py-6">
      {/* Incident Header */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {displayIncident.ticketId}
            </h1>
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="outline" className={getStatusColor(displayIncident.status)}>
                {displayIncident.status}
              </Badge>
              <Badge variant="secondary">{displayIncident.type}</Badge>
              <Badge variant="secondary">{displayIncident.category}</Badge>
            </div>
          </div>
        </div>

        {/* Quick Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="flex items-center p-4">
              <Calendar className="h-5 w-5 text-gray-500 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Date</p>
                <p className="font-semibold">{formatDate(displayIncident.date)}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex items-center p-4">
              <MapPin className="h-5 w-5 text-gray-500 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Location</p>
                <p className="font-semibold">{displayIncident.location}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex items-center p-4">
              <User className="h-5 w-5 text-gray-500 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Reported By</p>
                <p className="font-semibold">{displayIncident.reportedBy.name}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex items-center p-4">
              <Clock className="h-5 w-5 text-gray-500 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Created</p>
                <p className="font-semibold">{formatDate(displayIncident.createdAt)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="comments">Comments</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-6">
          <IncidentDetails 
            incident={displayIncident}
            statusUpdate={statusUpdate}
            setStatusUpdate={setStatusUpdate}
            handleStatusChange={handleStatusUpdate}
            formatDate={formatDate}
            formatDateTime={formatDateTime}
            getStatusColor={getStatusColor}
            updateIncident={updateIncident}
          />
        </TabsContent>

        <TabsContent value="documents" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Supporting Documents</CardTitle>
            </CardHeader>
            <CardContent>
              {displayIncident.documents && displayIncident.documents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {displayIncident.documents.map((doc, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <p className="font-medium">{doc.name}</p>
                      <p className="text-sm text-gray-500">{doc.type}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-6">No documents attached</p>
              )}
            </CardContent>
          </Card>
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
