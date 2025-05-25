
import Layout from '@/components/layout/Layout';
import IncidentDetailContent from '@/components/incident/IncidentDetailContent';
import { useIncidentDetailPage } from '@/hooks/useIncidentDetailPage';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useIncidentDetail } from '@/hooks/useIncidentDetail';
import { useIncidents } from '@/contexts/incident'; // Fixed import path
import { useState, useEffect } from 'react';

const IncidentDetail = () => {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { incidents, getIncident } = useIncidents();
  const [incident, setIncident] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Get the incident directly from the context
  useEffect(() => {
    console.log("IncidentDetail - Looking for incident with ID:", id);
    console.log("IncidentDetail - Available incidents:", incidents.length);
    
    if (id && incidents.length > 0) {
      const foundIncident = getIncident(id);
      console.log("IncidentDetail - Found incident:", foundIncident);
      setIncident(foundIncident || null);
      setIsLoading(false);
    } else if (incidents.length === 0) {
      // Still loading incidents
      setIsLoading(true);
    } else {
      // Incidents loaded but incident not found
      setIncident(null);
      setIsLoading(false);
    }
  }, [id, incidents, getIncident]);

  const incidentDetailProps = useIncidentDetailPage(id);
  const { useStatusUpdate, formatDate, formatDateTime, getStatusColor, getCommentStatusColor } = useIncidentDetail();
  
  // Initialize status update state
  const { statusUpdate, setStatusUpdate } = useStatusUpdate(
    incident?.status || 'Open'
  );
  
  if (isLoading) {
    return (
      <Layout>
        <div className="container max-w-6xl py-6">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading incident details...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }
  
  if (!incident) {
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

  // Create props for IncidentDetailContent with all required fields
  const contentProps = {
    incident,
    statusUpdate,
    setStatusUpdate,
    incidentActivities: incidentDetailProps.incidentActivities || [],
    commentText: '',
    setCommentText: () => {},
    commentFiles: [],
    setCommentFiles: () => {},
    isSubmitting: false,
    handleCommentSubmit: () => Promise.resolve(),
    handleActionSubmit: () => Promise.resolve(),
    handleStatusChange: incidentDetailProps.handleStatusChange,
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
    updateIncident: () => Promise.resolve(),
    navigate
  };

  return (
    <Layout>
      <IncidentDetailContent {...contentProps} />
    </Layout>
  );
};

export default IncidentDetail;
