
import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, List, ChartPie } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const QuickActions: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="space-y-4 md:space-y-6">
      <h2 className="text-lg md:text-xl font-medium text-gray-900">Quick Actions</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        <Button 
          variant="outline" 
          className="h-auto py-4 md:py-6 flex flex-col items-center justify-center gap-2 hover:bg-primary-50 hover:text-primary-700 border-none shadow-card hover:shadow-card-hover"
          onClick={() => navigate('/report')}
        >
          <div className="bg-red-100 h-8 w-8 md:h-10 md:w-10 rounded-full flex items-center justify-center">
            <AlertTriangle className="h-4 w-4 md:h-5 md:w-5 text-red-600" />
          </div>
          <span className="text-xs md:text-sm text-center">Report New Incident</span>
        </Button>
        
        <Button 
          variant="outline" 
          className="h-auto py-4 md:py-6 flex flex-col items-center justify-center gap-2 hover:bg-primary-50 hover:text-primary-700 border-none shadow-card hover:shadow-card-hover"
          onClick={() => navigate('/incidents')}
        >
          <div className="bg-blue-100 h-8 w-8 md:h-10 md:w-10 rounded-full flex items-center justify-center">
            <List className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
          </div>
          <span className="text-xs md:text-sm text-center">View All Incidents</span>
        </Button>
        
        <Button 
          variant="outline" 
          className="h-auto py-4 md:py-6 flex flex-col items-center justify-center gap-2 hover:bg-primary-50 hover:text-primary-700 border-none shadow-card hover:shadow-card-hover"
          onClick={() => navigate('/insights')}
        >
          <div className="bg-green-100 h-8 w-8 md:h-10 md:w-10 rounded-full flex items-center justify-center">
            <ChartPie className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
          </div>
          <span className="text-xs md:text-sm text-center">View Insights</span>
        </Button>
      </div>
    </div>
  );
};

export default QuickActions;
