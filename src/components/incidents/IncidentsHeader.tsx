
import { Button } from '@/components/ui/button';
import { AlertTriangle, PieChart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEmployeeStore } from '@/store/EmployeeContext';
import { isEmployeeSuperAdmin } from '@/store/employeeSelectors';
import React from 'react';

const IncidentsHeader = () => {
  const navigate = useNavigate();
  const { state } = useEmployeeStore();
  
  // Check if user has admin access level for incidents
  const isSuperAdmin = isEmployeeSuperAdmin(state);
  
  const hasIncidentsAdminAccess = React.useMemo(() => {
    if (isSuperAdmin) return true;
    
    // Check configured modules for incidents admin access
    const incidentsModule = state.configuredModules?.find(
      module => module.key === 'incidentAdmin' || module.name.toLowerCase().includes('incident')
    );
    
    if (incidentsModule?.accessLevel) {
      // Check for different possible admin flag formats
      return incidentsModule.accessLevel.isAdmin === true || 
             incidentsModule.accessLevel.is_admin === true;
    }
    
    return false;
  }, [isSuperAdmin, state.configuredModules]);

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
        
        <Button onClick={() => navigate('/report-incident')}>
          <AlertTriangle className="h-4 w-4 mr-2" />
          Report Incident
        </Button>
      </div>
    </div>
  );
};

export default IncidentsHeader;
