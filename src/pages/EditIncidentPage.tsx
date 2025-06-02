
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { useIncidents } from '@/contexts/incident';
import { useAuth } from '@/contexts/auth/AuthContext';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import EditIncidentForm from '@/components/edit-incident/EditIncidentForm';
import { useIncidentData } from '@/hooks/useIncidentData';

const EditIncidentPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getIncident } = useIncidents();
  const { user } = useAuth();
  const { refetchIncidents } = useIncidentData();

  console.log('EditIncidentPage - ID:', id);

  if (!id) {
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

  const incident = getIncident(id);
  console.log('EditIncidentPage - Incident:', incident);

  if (!incident) {
    return (
      <Layout>
        <div className="space-y-4 md:space-y-6 w-full overflow-x-hidden">
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-5 w-5" />
            <AlertTitle className="ml-2">Incident not found</AlertTitle>
            <AlertDescription className="ml-2">
              The incident you're trying to edit doesn't exist or has been removed.
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

  return (
    <Layout>
      <div className="space-y-4 md:space-y-6 w-full overflow-x-hidden bg-gray-50 min-h-screen">
        {/* Back button */}
        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-7xl mx-auto">
            <Button 
              variant="ghost" 
              className="flex items-center -ml-4 mb-4"
              onClick={() => navigate(`/incident/${id}`)}
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
          <EditIncidentForm />
        </div>
      </div>
    </Layout>
  );
};

export default EditIncidentPage;
