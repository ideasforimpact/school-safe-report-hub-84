
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { useIncidents } from '@/contexts/IncidentContext';
import { useAuth } from '@/contexts/auth/AuthContext';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import EditIncidentForm from '@/components/edit-incident/EditIncidentForm';
import EditIncidentHeader from '@/components/edit-incident/EditIncidentHeader';

const EditIncidentPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getIncident } = useIncidents();
  const { user } = useAuth();

  console.log('EditIncidentPage - ID:', id);

  if (!id) {
    return (
      <Layout>
        <div className="container max-w-6xl py-6">
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
        <div className="container max-w-6xl py-6">
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
      <div className="container max-w-6xl py-6 space-y-6">
        <EditIncidentHeader 
          incident={incident}
          onBackClick={() => navigate('/incidents')}
        />
        
        <EditIncidentForm 
          incident={incident}
          onSuccess={() => navigate(`/incident/${id}`)}
          onCancel={() => navigate('/incidents')}
        />
      </div>
    </Layout>
  );
};

export default EditIncidentPage;
