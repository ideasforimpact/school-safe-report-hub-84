
import { Button } from '@/components/ui/button';
import { AlertTriangle, PieChart } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEmployeeStore } from '@/store/EmployeeContext';
import { isEmployeeSuperAdmin } from '@/store/employeeSelectors';
import React from 'react';

const IncidentsHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useEmployeeStore();
  
  // Check if user has admin access level for incidents
  const isSuperAdmin = isEmployeeSuperAdmin(state);
  
  const hasIncidentsAdminAccess = React.useMemo(() => {
    if (isSuperAdmin) return true;
    
    // Find module based on current route
    const currentModule = state.configuredModules?.find(
      module => module.url === location.pathname
    );
    
    return currentModule?.accessLevel?.is_admin === true;
  }, [isSuperAdmin, state.configuredModules, location.pathname]);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="text-left w-full">
        <h1 className="text-2xl font-bold">All Incidents</h1>
        <p className="text-gray-600 mt-1">
          View and manage reported incidents
        </p>
      </div>
      
      <div className="flex gap-3">
        {/* Only show Insights button if user has admin access */}
        {hasIncidentsAdminAccess && (
          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all" 
            onClick={() => navigate('/insights')}
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
