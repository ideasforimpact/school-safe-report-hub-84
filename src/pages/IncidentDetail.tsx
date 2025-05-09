
import React from 'react';
import { useParams } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import IncidentDetailContent from '@/components/incident/IncidentDetailContent';
import { useIncidentDetailPage } from '@/hooks/useIncidentDetailPage';
import { useIncidentDetail } from '@/hooks/useIncidentDetail';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ArrowLeft } from 'lucide-react';

const IncidentDetail = () => {
  const { incidentId } = useParams();
  const incidentDetailHooks = useIncidentDetailPage(incidentId || '');
  const { formatDate, formatDateTime, getStatusColor, getCommentStatusColor } = useIncidentDetail();
  
  const { 
    incident, 
    statusOptions, 
    newComment, 
    setNewComment, 
    isLoading, 
    handleStatusChange, 
    handleAddComment,
    navigate 
  } = incidentDetailHooks;
  
  if (!incident) {
    return (
      <Layout>
        <div className="container max-w-6xl py-6">
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-5 w-5" />
            <AlertTitle className="ml-2">Incident not found</AlertTitle>
            <AlertDescription className="ml-2">
              The incident with ID "{incidentId}" doesn't exist or has been removed.
            </AlertDescription>
          </Alert>
          
          <div className="flex justify-center mt-6">
            <Button 
              className="mr-4 flex items-center"
              onClick={() => navigate('/incidents')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Return to Incidents List
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate('/report-incident')}
            >
              Report New Incident
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  // We need to adapt the props expected by IncidentDetailContent
  const incidentDetailContentProps = {
    incident,
    statusOptions,
    newComment,
    setNewComment,
    isLoading,
    handleStatusChange,
    handleAddComment,
    formatDate,
    formatDateTime,
    getStatusColor,
    getCommentStatusColor,
    // These are placeholders and should be implemented as needed
    incidentActivities: [],
    commentText: newComment,
    setCommentText: setNewComment,
    commentFiles: [],
    setCommentFiles: () => {},
    isSubmitting: isLoading,
    handleCommentSubmit: handleAddComment,
    handleActionSubmit: () => {},
    statusUpdate: '',
    setStatusUpdate: () => {},
    addComment: () => {},
    updateComment: () => {},
    deleteComment: () => {},
    canEditComment: () => true,
    user: null,
    isAdmin: false,
    updateIncident: () => {}
  };

  return (
    <Layout>
      <IncidentDetailContent {...incidentDetailContentProps} />
    </Layout>
  );
};

export default IncidentDetail;
