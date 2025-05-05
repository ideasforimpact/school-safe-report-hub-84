
import React from 'react';
import TimeSeriesAnalysis from '../charts/TimeSeriesAnalysis';
import RiskAssessmentChart from '../charts/RiskAssessmentChart';
import HeatmapChart from '../charts/HeatmapChart';
import IncidentDetailsCard from '../charts/IncidentDetailsCard';
import { Incident } from '@/types/incident';

interface DashboardTabProps {
  timeSeriesData: Array<{month: string, count: number}>;
  riskData: Array<{name: string, frequency: number, severity: number, count: number}>;
  heatmapData: Array<{
    name: string, 
    values: Array<{day: string, value: number}>
  }>;
  recentIncidents: Incident[];
}

const DashboardTab: React.FC<DashboardTabProps> = ({
  timeSeriesData,
  riskData,
  heatmapData,
  recentIncidents
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Enhanced time series analysis */}
      <TimeSeriesAnalysis data={timeSeriesData} />
      
      {/* Risk assessment matrix */}
      <RiskAssessmentChart data={riskData} />
      
      {/* Heatmap showing when and where incidents occur */}
      <HeatmapChart 
        data={heatmapData} 
        title="Incident Hotspots"
        description="Heatmap showing when and where incidents occur most frequently"
      />
      
      {/* Incident details - most recent incidents */}
      <IncidentDetailsCard 
        incidents={recentIncidents} 
        title="Recent Incidents"
        description="Most recently reported incidents matching your filters"
      />
    </div>
  );
};

export default DashboardTab;
