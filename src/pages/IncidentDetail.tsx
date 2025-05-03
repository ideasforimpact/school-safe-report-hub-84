
import Layout from '@/components/layout/Layout';
import IncidentDetailContent from '@/components/incident/IncidentDetailContent';
import { useIncidentDetailPage } from '@/hooks/useIncidentDetailPage';

const IncidentDetail = () => {
  const incidentDetailProps = useIncidentDetailPage();
  
  if (!incidentDetailProps.incident) {
    return (
      <Layout>
        <div className="text-center p-8">
          <h2 className="text-xl font-semibold">Incident not found</h2>
          <p className="text-gray-600 mt-2">The incident you're looking for doesn't exist or has been removed.</p>
          <button 
            className="text-primary-600 hover:underline mt-4"
            onClick={() => incidentDetailProps.navigate('/incidents')}
          >
            Return to Incidents List
          </button>
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
