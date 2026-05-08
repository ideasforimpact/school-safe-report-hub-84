
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import EditIncidentForm from '@/components/edit-incident/EditIncidentForm';
import { useEditIncidentData } from '@/hooks/useEditIncidentData';
import Loader from '@/components/common/Loader';
import { useIsReadOnlySwitchedContext } from '@/hooks/useIsReadOnlySwitchedContext';

const EditIncidentPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { incidentData, isLoading, error } = useEditIncidentData(id);
  const isReadOnlySwitchedContext = useIsReadOnlySwitchedContext();

  // Add comprehensive logging for debugging
  console.log('=== EDIT INCIDENT PAGE DEBUG ===');
  console.log('EditIncidentPage - ID from params:', id);
  console.log('EditIncidentPage - Is Loading:', isLoading);
  console.log('EditIncidentPage - Error:', error);
  console.log('EditIncidentPage - Incident data received:', incidentData);
  console.log('=== END EDIT INCIDENT PAGE DEBUG ===');

  if (!id) {
    console.log('EditIncidentPage - No ID provided, showing error');
    return (
      <Layout>
        <div className="space-y-4 md:space-y-6 w-full overflow-x-hidden">
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-5 w-5" />
            <AlertTitle className="ml-2">Invalid URL</AlertTitle>
            <AlertDescription className="ml-2">
              No incident ID provided in the URL.
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
          </div>
        </div>
      </Layout>
    );
  }

  if (isReadOnlySwitchedContext) {
    return (
      <Layout>
        <div className="space-y-4 md:space-y-6 w-full overflow-x-hidden">
          <Alert className="mb-4">
            <AlertTriangle className="h-5 w-5" />
            <AlertTitle className="ml-2">Read-only access</AlertTitle>
            <AlertDescription className="ml-2">
              You can view incidents in this client, but editing is disabled for read-only access.
            </AlertDescription>
          </Alert>

          <div className="flex justify-center mt-6">
            <Button
              className="mr-4 flex items-center"
              onClick={() => navigate(id ? `/incident/${id}` : '/incidents')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Incident Details
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  if (isLoading) {
    console.log('EditIncidentPage - Still loading incident data');
    return (
      <Layout>
        <div className="space-y-4 md:space-y-6 w-full overflow-x-hidden">
          <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-6">
            <div className="max-w-7xl mx-auto">
              <h1 className="text-2xl font-semibold text-gray-900">Edit Incident</h1>
              <Loader text="Loading incident details..." />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !incidentData) {
    console.log('EditIncidentPage - Error or no data:', { error, hasIncidentData: !!incidentData });
    return (
      <Layout>
        <div className="space-y-4 md:space-y-6 w-full overflow-x-hidden">
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-5 w-5" />
            <AlertTitle className="ml-2">Incident not found</AlertTitle>
            <AlertDescription className="ml-2">
              {error || "The incident you're trying to edit doesn't exist or has been removed."}
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
          </div>
        </div>
      </Layout>
    );
  }

  console.log('EditIncidentPage - Rendering form with incident data:', incidentData);

  return (
    <Layout>
      <div className="space-y-4 md:space-y-6 w-full overflow-x-hidden bg-gray-50 min-h-screen">
        {/* Back button */}
        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-7xl mx-auto">
            <Button 
              variant="ghost" 
              className="flex items-center -ml-4 mb-4"
              onClick={() => navigate(`/incidents`)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Incident Details
            </Button>
            
            <h1 className="text-2xl font-semibold text-gray-900">Edit Incident</h1>
            <p className="text-gray-600 text-sm mt-1">
              Document safety incidents, near misses, or unsafe conditions
            </p>
          </div>
        </div>

        <div className="w-full py-6">
          <EditIncidentForm incidentData={incidentData} />
        </div>
      </div>
    </Layout>
  );
};

export default EditIncidentPage;
