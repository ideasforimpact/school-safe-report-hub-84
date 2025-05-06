
import React from 'react';
import CategoryChartWrapper from './charts/CategoryChartWrapper';
import StatusBlocksWrapper from './charts/StatusBlocksWrapper';
import IncidentTypeChart from './charts/IncidentTypeChart';
import TimeSeriesAnalysis from '@/components/insights/charts/TimeSeriesAnalysis';

interface OverviewTabProps {
  categoryData: Array<{name: string, value: number}>;
  typeData: Array<{name: string, value: number}>;
  statusData: Array<{name: string, value: number}>;
  timeSeriesData: Array<{month: string, count: number}>;
  colors: string[];
}

const OverviewTab: React.FC<OverviewTabProps> = ({
  categoryData,
  typeData,
  statusData,
  timeSeriesData,
  colors
}) => {
  return (
    <div className="flex flex-col gap-12 w-full">
      {/* Featured Incidents by Category chart */}
      <div className="chart-container">
        <CategoryChartWrapper data={categoryData} colors={colors} />
      </div>
      
      {/* Status Blocks */}
      <div className="chart-container">
        <StatusBlocksWrapper data={statusData} />
      </div>
      
      {/* Incidents by Type */}
      <div className="chart-container">
        <IncidentTypeChart data={typeData} />
      </div>
      
      {/* Time series chart with analysis */}
      <div className="chart-container">
        <TimeSeriesAnalysis 
          data={timeSeriesData} 
          title="Incidents Over Time"
          description="Monthly trend of reported incidents with detailed analysis" 
        />
      </div>
    </div>
  );
};

export default OverviewTab;
