
import { Button } from '@/components/ui/button';
import { AlertTriangle, PieChart, BookOpen } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEmployeeStore } from '@/store/EmployeeContext';
import { isEmployeeSuperAdmin } from '@/store/employeeSelectors';
import React from 'react';

interface IncidentsHeaderProps {
  hasIncidentAdmin: boolean;
}

const IncidentsHeader = ({ hasIncidentAdmin }: IncidentsHeaderProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useEmployeeStore();
  
  // Check if user has admin access level for incidents
  const isSuperAdmin = isEmployeeSuperAdmin(state);
  
  const hasIncidentsAdminAccess = React.useMemo(() => {
    if (isSuperAdmin) return true;
    
    // Find incidents module by name (more reliable than URL matching)
    const incidentsModule = state.configuredModules?.find(
      module => module.name.toLowerCase() === 'incidents'
    );
    
    console.log('Incidents module found:', incidentsModule);
    console.log('Access level:', incidentsModule?.accessLevel);
    
    return incidentsModule?.accessLevel?.is_admin === true;
  }, [isSuperAdmin, state.configuredModules]);

  console.log('hasIncidentsAdminAccess:', hasIncidentsAdminAccess);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="p-3 bg-blue-50 rounded-xl">
        <AlertTriangle className="h-6 w-6 text-primary" />
      </div>
      <div className="text-left w-full">
        <h1 className="text-2xl font-bold">All Incidents</h1>
        <p className="text-gray-600 mt-1">
          View and manage reported incidents
        </p>
      </div>
      
      <div className="flex gap-3">
        {/* Show Learning Points for super admins only */}
        {isSuperAdmin && (
          <Button 
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg transition-all" 
            onClick={() => navigate('/learning-points')}
          >
            <BookOpen className="h-4 w-4 mr-2" />
            Learning Points
          </Button>
        )}
        {/* Only show Insights button if user has admin access */}
        {(hasIncidentsAdminAccess || hasIncidentAdmin) && (
          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all" 
            onClick={() => navigate('/new-insights')}
          >
            <PieChart className="h-4 w-4 mr-2" />
            Insights
          </Button>
        )}
        
        {/* Show Report Incident button for all users */}
        <Button onClick={() => navigate('/report-incident')}>
          <AlertTriangle className="h-4 w-4 mr-2" />
          Report Incident
        </Button>
      </div>
    </div>
  );
};

export default IncidentsHeader;
