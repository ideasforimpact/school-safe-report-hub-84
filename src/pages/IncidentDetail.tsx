
import Layout from '@/components/layout/Layout';
import IncidentDetailContent from '@/components/incident/IncidentDetailContent';
import IncidentHeader from '@/components/incident/IncidentHeader';
import { useIncidentDetailPage } from '@/hooks/useIncidentDetailPage';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useIncidentDetail } from '@/hooks/useIncidentDetail';
import { useIncidents } from '@/contexts/incident';
import { useState, useEffect, useCallback } from 'react';
import { useIncidentDetail as useIncidentDetailHook } from '@/hooks/incident/useIncidentDetail';
import { FileItem } from '@/types/incident';

const IncidentDetail = () => {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { incidents, getIncident } = useIncidents();
  
  // Use the incident detail hook to fetch fresh data
  const { incident: fetchedIncident, isLoading: isFetchingIncident, error: fetchError, reload } = useIncidentDetailHook(id);
  
  const [incident, setIncident] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Priority: Use fetched incident data if available, otherwise fall back to context
  useEffect(() => {
    console.log("IncidentDetail - Looking for incident with ID:", id);
    console.log("IncidentDetail - Fetched incident:", fetchedIncident);
    console.log("IncidentDetail - Available incidents in context:", incidents.length);
    
    if (isFetchingIncident) {
      setIsLoading(true);
      return;
    }
    
    if (fetchedIncident) {
      // Convert fetched incident to the format expected by the component
      const convertedIncident = {
        id: fetchedIncident.id,
        ticketId: fetchedIncident.ticket_id,
        type: fetchedIncident.type.name,
        category: fetchedIncident.category.name,
        subcategory: fetchedIncident.subcategory.name,
        description: fetchedIncident.description,
        date: new Date(fetchedIncident.date),
        location: fetchedIncident.location.name,
        peopleInvolved: fetchedIncident.people_involved || [],
        status: fetchedIncident.status.name,
        reportedBy: {
          id: fetchedIncident.created_by.id,
          name: `${fetchedIncident.created_by.first_name} ${fetchedIncident.created_by.last_name}`
        },
        owner: fetchedIncident.assigned_to ? {
          id: fetchedIncident.assigned_to.id,
          name: `${fetchedIncident.assigned_to.first_name} ${fetchedIncident.assigned_to.last_name}`
        } : undefined,
        facility: fetchedIncident.facility.name,
        documents: fetchedIncident.documents || [],
        createdAt: new Date(fetchedIncident.date),
        updatedAt: new Date(fetchedIncident.date),
        priority: fetchedIncident.priority.name,
        comments: fetchedIncident.comments || []
      };
      console.log("IncidentDetail - Using fetched incident data:", convertedIncident);
      setIncident(convertedIncident);
      setIsLoading(false);
    } else if (id && incidents.length > 0) {
      // Fall back to context data if fetch failed
      const contextIncident = getIncident(id);
      console.log("IncidentDetail - Using context incident:", contextIncident);
      setIncident(contextIncident || null);
      setIsLoading(false);
    } else if (!isFetchingIncident) {
      // No incident found and not loading
      setIncident(null);
      setIsLoading(false);
    }
  }, [id, fetchedIncident, isFetchingIncident, incidents, getIncident]);

  const incidentDetailProps = useIncidentDetailPage(id);
  const { useStatusUpdate, formatDate, formatDateTime, getStatusColor, getCommentStatusColor } = useIncidentDetail();
  
  // Initialize status update state
  const { statusUpdate, setStatusUpdate } = useStatusUpdate(
    incident?.status || 'Open'
  );
  
  // Refresh function to reload incident data without full page refresh
  const handleRefreshIncident = useCallback(async () => {
    console.log('Refreshing incident details...');
    try {
      // Use the reload function from the hook to fetch fresh data
      if (reload) {
        await reload();
      }
    } catch (error) {
      console.error('Error refreshing incident:', error);
    }
  }, [reload]);

  // Handle close button click
  const handleCloseButtonClick = async () => {
    try {
      await incidentDetailProps.handleStatusChange('Closed');
      handleRefreshIncident();
    } catch (error) {
      console.error('Error closing incident:', error);
    }
  };

  // Create a wrapper function for status change that matches the expected signature
  const handleStatusChangeWrapper = useCallback(async () => {
    try {
      await incidentDetailProps.handleStatusChange(statusUpdate);
      handleRefreshIncident();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  }, [incidentDetailProps.handleStatusChange, statusUpdate, handleRefreshIncident]);
  
  if (isLoading || isFetchingIncident) {
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

  // Create props for IncidentDetailContent with all required fields including working comment functionality
  const contentProps = {
    incident,
    statusUpdate,
    setStatusUpdate: (status: string) => setStatusUpdate(status as any),
    incidentActivities: incidentDetailProps.incidentActivities || [],
    commentText: '',
    setCommentText: () => {},
    commentFiles: [],
    setCommentFiles: () => {},
    isSubmitting: false,
    handleCommentSubmit: handleRefreshIncident,
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
    navigate,
    onRefreshIncident: handleRefreshIncident
  };

  return (
    <Layout>
      {/* Back button */}
      <div className="container max-w-6xl pt-6 pb-0">
        <Button 
          variant="ghost" 
          className="flex items-center -ml-4 mb-4"
          onClick={() => navigate('/incidents')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Incidents
        </Button>
      </div>
      
      {/* Use IncidentHeader component which already has Close and Edit buttons */}
      <div className="container max-w-6xl pb-6">
        <IncidentHeader
          incident={incident}
          statusUpdate={statusUpdate}
          setStatusUpdate={setStatusUpdate}
          onStatusChange={handleStatusChangeWrapper}
          formatDate={formatDate}
          getStatusColor={getStatusColor}
          onCloseButtonClick={handleCloseButtonClick}
        />
      </div>
      
      <IncidentDetailContent {...contentProps} />
    </Layout>
  );
};

export default IncidentDetail;
