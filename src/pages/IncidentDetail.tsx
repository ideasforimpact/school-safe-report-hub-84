
import Layout from '@/components/layout/Layout';
import IncidentDetailContent from '@/components/incident/IncidentDetailContent';
import { useIncidentDetailPage } from '@/hooks/useIncidentDetailPage';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

const IncidentDetail = () => {
  const incidentDetailProps = useIncidentDetailPage();
  
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
              className="mr-4"
              onClick={() => incidentDetailProps.navigate('/incidents')}
            >
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

  return (
    <Layout>
      <IncidentDetailContent {...incidentDetailProps} />
    </Layout>
  );
};

export default IncidentDetail;
