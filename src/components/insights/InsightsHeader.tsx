
import { Button } from '@/components/ui/button';
import { BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const InsightsHeader = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="text-left w-full">
        <h1 className="text-2xl font-bold">Insights &amp; Reports</h1>
        <p className="text-gray-600 mt-1">
          Analyze incident data and trends
        </p>
      </div>
      
      <Button onClick={() => navigate('/insights/create')}>
        <BarChart3 className="h-4 w-4 mr-2" />
        Create Report
      </Button>
    </div>
  );
};

export default InsightsHeader;
