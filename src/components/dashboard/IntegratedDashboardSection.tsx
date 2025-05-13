
import React from 'react';
import SafetyModuleSummaryCards from './SafetyModuleSummaryCards';

interface IntegratedDashboardSectionProps {
  openIncidentsData: {
    count: number;
    change: number;
  };
}

const IntegratedDashboardSection: React.FC<IntegratedDashboardSectionProps> = ({ openIncidentsData }) => {
  // Mock data for other metrics (in a real app, this would come from API calls)
  const verificationData = {
    verified: 45,
    pending: 12,
    total: 57
  };
  
  const assessmentData = {
    score: 87,
    completed: 23,
    total: 25
  };
  
  const resourcesData = {
    count: 36,
    recent: 4
  };
  
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Safety Overview</h2>
      <SafetyModuleSummaryCards 
        openIncidents={openIncidentsData}
        verificationStatus={verificationData}
        assessmentPerformance={assessmentData}
        safetyResources={resourcesData}
      />
    </div>
  );
};

export default IntegratedDashboardSection;
