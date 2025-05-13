
import Layout from '@/components/layout/Layout';
import IncidentDetailContent from '@/components/incident/IncidentDetailContent';
import { useIncidentDetailPage } from '@/hooks/useIncidentDetailPage';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useIncidentDetail } from '@/hooks/useIncidentDetail';

const IncidentDetail = () => {
  const { id = '' } = useParams<{ id: string }>();
  const incidentDetailProps = useIncidentDetailPage(id);
  const { useStatusUpdate, formatDate, formatDateTime, getStatusColor, getCommentStatusColor } = useIncidentDetail();
  
  // Initialize status update state
  const { statusUpdate, setStatusUpdate } = useStatusUpdate(
    incidentDetailProps.incident?.status || 'Open'
  );
  
  if (!incidentDetailProps.incident) {
    return (
      <Layout>
        <div className="container max-w-6xl py-6">
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-5 w-5" />
            <AlertTitle className="ml-2">Incident not found</AlertTitle>
            <AlertDescription className="ml-2">
              The incident you're looking for doesn't exist or has been removed.
            </AlertDescription>
          </Alert>
          
          <div className="flex justify-center mt-6">
            <Button 
              className="mr-4 flex items-center"
              onClick={() => incidentDetailProps.navigate('/incidents')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Return to Incidents List
            </Button>
            <Button 
              variant="outline"
              onClick={() => incidentDetailProps.navigate('/report-incident')}
            >
              Report New Incident
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  // Let's create a stub for missing props that IncidentDetailContent expects
  const contentProps = {
    ...incidentDetailProps,
    statusUpdate,
    setStatusUpdate,
    incidentActivities: [],
    commentText: '',
    setCommentText: () => {},
    commentFiles: [],
    setCommentFiles: () => {},
    isSubmitting: false,
    handleCommentSubmit: () => Promise.resolve(),
    handleActionSubmit: () => Promise.resolve(),
    formatDate: formatDate,
    formatDateTime: formatDateTime,
    getStatusColor: getStatusColor,
    getCommentStatusColor: getCommentStatusColor,
    addComment: () => Promise.resolve(),
    updateComment: () => Promise.resolve(),
    deleteComment: () => Promise.resolve(),
    canEditComment: () => false,
    user: { id: '', name: '' },
    isAdmin: false,
    updateIncident: () => Promise.resolve()
  };

  return (
    <Layout>
      <IncidentDetailContent {...contentProps} />
    </Layout>
  );
};

export default IncidentDetail;
