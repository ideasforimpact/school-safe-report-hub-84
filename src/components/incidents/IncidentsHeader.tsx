
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const IncidentsHeader = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="text-left w-full">
        <h1 className="text-2xl font-bold">All Incidents</h1>
        <p className="text-gray-600 mt-1">
          View and manage reported incidents
        </p>
      </div>
      
      <Button onClick={() => navigate('/report-incident')}>
        <AlertTriangle className="h-4 w-4 mr-2" />
        Report New
      </Button>
    </div>
  );
};

export default IncidentsHeader;
