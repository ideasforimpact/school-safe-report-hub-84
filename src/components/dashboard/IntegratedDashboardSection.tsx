
import React from 'react';
import StatusDistributionChart from './charts/StatusDistributionChart';
import SafetyModuleSummaryCards from './SafetyModuleSummaryCards';
import { getStatusColor } from '@/utils/chartColorUtils';

const IntegratedDashboardSection: React.FC = () => {
  // Sample data for the summary cards
  const summaryData = {
    criticalItems: {
      count: 15,
      change: -12
    },
    verificationStatus: {
      verified: 42,
      pending: 8,
      total: 50
    },
    assessmentPerformance: {
      score: 87,
      completed: 24,
      total: 30
    },
    safetyResources: {
      count: 76,
      recent: 12
    }
  };

  // Sample data for the donut charts
  const incidentStatusData = [
    { name: 'Open', value: 12, color: getStatusColor('Open') },
    { name: 'In Progress', value: 18, color: getStatusColor('In Progress') },
    { name: 'Closed', value: 42, color: getStatusColor('Closed') }
  ];

  const complianceDistributionData = [
    { name: 'Pass', value: 78, color: '#4ade80' },
    { name: 'Warning', value: 15, color: '#facc15' },
    { name: 'Fail', value: 7, color: '#ef4444' }
  ];

  const resourceDistributionData = [
    { name: 'Posters', value: 24, color: '#9b87f5' },
    { name: 'Guidelines', value: 18, color: '#33C3F0' },
    { name: 'Procedures', value: 22, color: '#f97316' },
    { name: 'Forms', value: 12, color: '#facc15' },
  ];

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Summary Cards */}
      <SafetyModuleSummaryCards 
        criticalItems={summaryData.criticalItems}
        verificationStatus={summaryData.verificationStatus}
        assessmentPerformance={summaryData.assessmentPerformance}
        safetyResources={summaryData.safetyResources}
      />
      
      {/* Donut Charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatusDistributionChart 
          title="Incident & Grievance Status"
          description="Current distribution of incidents and grievances"
          data={incidentStatusData}
        />
        
        <StatusDistributionChart 
          title="Compliance Distribution"
          description="Distribution of assessment results"
          data={complianceDistributionData}
        />
        
        <StatusDistributionChart 
          title="Resource Distribution"
          description="Types of safety resources available"
          data={resourceDistributionData}
        />
      </div>
    </div>
  );
};

export default IntegratedDashboardSection;
