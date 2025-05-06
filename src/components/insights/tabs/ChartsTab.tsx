
import React from 'react';
import CategoryChart from '../charts/CategoryChart';
import BarChartComponent from '../charts/BarChartComponent';
import TimeSeriesAnalysis from '../charts/TimeSeriesAnalysis';
import StatusChart from '../charts/StatusChart';
import HeatmapChart from '../charts/HeatmapChart';
import RiskAssessmentChart from '../charts/RiskAssessmentChart';

interface ChartsTabProps {
  categoryData: Array<{name: string, value: number}>;
  typeData: Array<{name: string, value: number}>;
  subcategoryData: Array<{name: string, value: number}>;
  timeSeriesData: Array<{month: string, count: number}>;
  locationData: Array<{name: string, value: number}>;
  facilityData: Array<{name: string, value: number}>;
  assigneeData: Array<{name: string, value: number}>;
  statusData: Array<{name: string, value: number}>;
  riskData: Array<{name: string, frequency: number, severity: number, count: number}>;
  isAdmin: boolean;
  colors: string[];
}

const ChartsTab: React.FC<ChartsTabProps> = ({
  categoryData,
  typeData,
  subcategoryData,
  timeSeriesData,
  locationData,
  facilityData,
  assigneeData,
  statusData,
  riskData,
  isAdmin,
  colors
}) => {
  return (
    <div className="mt-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CategoryChart data={categoryData} colors={colors} />
        
        <BarChartComponent 
          title="Incidents by Type" 
          description="Compare occurrence of incidents, near misses, and unsafe conditions"
          data={typeData}
        />
        
        <TimeSeriesAnalysis 
          data={timeSeriesData} 
          title="Incidents Over Time"
          description="Monthly trend of incidents with statistical analysis"
        />
        
        <RiskAssessmentChart data={riskData} />
        
        <BarChartComponent 
          title="Incident Location" 
          description="Distribution of incidents by location"
          data={locationData}
          color="#0ea5e9"
          layout="vertical"
        />

        {isAdmin && facilityData.length > 0 && (
          <CategoryChart 
            data={facilityData} 
            colors={colors}
            title="Incidents by Facility"
            description="Distribution of incidents across different school facilities"
          />
        )}

        <BarChartComponent 
          title="Top 10 Subcategories" 
          description="Most common specific types of incidents reported"
          data={subcategoryData}
          color="#8884d8"
          layout="vertical"
        />
        
        <CategoryChart 
          data={assigneeData} 
          colors={colors}
          title="Incident Ownership"
          description="Distribution of incidents by assigned owner"
        />
      </div>

      <StatusChart data={statusData} />
    </div>
  );
};

export default ChartsTab;
