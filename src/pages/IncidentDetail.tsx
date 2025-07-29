import Layout from '@/components/layout/Layout';
import IncidentDetailContent from '@/components/incident/IncidentDetailContent';
import IncidentHeader from '@/components/incident/IncidentHeader';
import IncidentClosureForm from '@/components/incident/IncidentClosureForm';
import { useIncidentDetailPage } from '@/hooks/useIncidentDetailPage';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useIncidentDetail } from '@/hooks/useIncidentDetail';
import { useIncidents } from '@/contexts/incident';
import { useState, useEffect, useCallback } from 'react';
import { useIncidentDetail as useIncidentDetailHook } from '@/hooks/incident/useIncidentDetail';
import { FileItem, ContributingFactor, Action } from '@/types/incident';

const IncidentDetail = () => {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { incidents, getIncident } = useIncidents();
  
  // Use the incident detail hook to fetch fresh data
  const { incident: fetchedIncident, isLoading: isFetchingIncident, error: fetchError, reload } = useIncidentDetailHook(id);
  
  const [incident, setIncident] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClosureFormOpen, setIsClosureFormOpen] = useState(false);

  // Priority: Use fetched incident data if available, otherwise fall back to context
  useEffect(() => {
    console.log("IncidentDetail - Looking for incident with ID:", id);
    console.log("IncidentDetail - Fetched incident:", fetchedIncident);
    console.log("IncidentDetail - Available incidents in context:", Array.isArray(incidents) ? incidents.length : 0);
    
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
        peopleInvolved: Array.isArray(fetchedIncident.people_involved) ? fetchedIncident.people_involved : [],
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
        documents: Array.isArray(fetchedIncident.documents) ? fetchedIncident.documents : [],
        createdAt: new Date(fetchedIncident.date),
        updatedAt: new Date(fetchedIncident.date),
        priority: fetchedIncident.priority.name,
        comments: Array.isArray(fetchedIncident.comments) ? fetchedIncident.comments : [],
        reopen: fetchedIncident.reopen || 0,
        // Map closure fields to expected UI field names
        rootCause: fetchedIncident.root_cause_analysis || '',
        actions: fetchedIncident.action_taken ? [{
          description: fetchedIncident.action_taken,
          responsiblePerson: '',
          date: new Date(fetchedIncident.date)
        }] : [],
        contributingFactors: Array.isArray(fetchedIncident.contributing_factor) ? fetchedIncident.contributing_factor : [],
        // Keep original fields for closure form pre-population
        rootCauseAnalysis: fetchedIncident.root_cause_analysis || '',
        actionTaken: fetchedIncident.action_taken || '',
        contributingFactor: Array.isArray(fetchedIncident.contributing_factor) ? fetchedIncident.contributing_factor : []
      };
      console.log("IncidentDetail - Using fetched incident data:", convertedIncident);
      setIncident(convertedIncident);
      setIsLoading(false);
    } else if (id && Array.isArray(incidents) && incidents.length > 0) {
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

  // Handle close button click - open the closure form
  const handleCloseButtonClick = async () => {
    setIsClosureFormOpen(true);
  };

  // Handle closure form submission
  const handleClosureFormSubmit = (data: {
    rootCause: string;
    contributingFactors: ContributingFactor[];
    actions: Action[];
  }) => {
    // The IncidentClosureForm component handles the actual closing logic
    // After successful closure, close the form and refresh
    setIsClosureFormOpen(false);
    handleRefreshIncident();
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
    incidentActivities: Array.isArray(incidentDetailProps.incidentActivities) ? incidentDetailProps.incidentActivities : [],
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
      
      {/* Single IncidentHeader component with Close, Reopen and Edit buttons */}
      <div className="container max-w-6xl pb-6">
        <IncidentHeader
          incident={incident}
          statusUpdate={statusUpdate}
          setStatusUpdate={setStatusUpdate}
          onStatusChange={handleStatusChangeWrapper}
          formatDate={formatDate}
          getStatusColor={getStatusColor}
          onCloseButtonClick={handleCloseButtonClick}
          onIncidentUpdate={handleRefreshIncident}
        />
      </div>
      
      <IncidentDetailContent {...contentProps} />
      
      {/* Incident Closure Form */}
      <IncidentClosureForm
        incident={incident}
        isOpen={isClosureFormOpen && !incident?.isVoided}
        onClose={() => setIsClosureFormOpen(false)}
        onSubmit={handleClosureFormSubmit}
      />
    </Layout>
  );
};

export default IncidentDetail;
