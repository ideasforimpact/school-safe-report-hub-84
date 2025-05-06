
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
    <div className="mt-4 space-y-8">
      {/* First row: Featured Incidents by Category chart - Increased height to 400px */}
      <div className="h-[400px] shadow-sm rounded-xl overflow-hidden">
        <CategoryChart data={categoryData} colors={colors} />
      </div>
      
      {/* Second row: Incidents by Type */}
      <div className="h-[400px]">
        <BarChartComponent 
          title="Incidents by Type" 
          description="Compare occurrence of incidents, near misses, and unsafe conditions"
          data={typeData}
        />
      </div>
      
      {/* Remaining charts in a grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="h-[400px]">
          <TimeSeriesAnalysis 
            data={timeSeriesData} 
            title="Incidents Over Time"
            description="Monthly trend of incidents with statistical analysis"
          />
        </div>
        
        <div className="h-[400px]">
          <RiskAssessmentChart data={riskData} />
        </div>
        
        <div className="h-[400px]">
          <BarChartComponent 
            title="Incident Location" 
            description="Distribution of incidents by location"
            data={locationData}
            color="#0ea5e9"
            layout="vertical"
          />
        </div>

        <div className="h-[400px]">
          <BarChartComponent 
            title="Top 10 Subcategories" 
            description="Most common specific types of incidents reported"
            data={subcategoryData}
            color="#8884d8"
            layout="vertical"
          />
        </div>
      </div>

      {/* Full width charts - pulled out of the grid */}
      {isAdmin && facilityData.length > 0 && (
        <div className="h-[600px] shadow-sm rounded-xl overflow-hidden">
          <CategoryChart 
            data={facilityData} 
            colors={colors}
            title="Incidents by Facility"
            description="Distribution of incidents across different school facilities"
          />
        </div>
      )}
      
      <div className="h-[400px] shadow-sm rounded-xl overflow-hidden">
        <CategoryChart 
          data={assigneeData} 
          colors={colors}
          title="Incident Ownership"
          description="Distribution of incidents by assigned owner"
        />
      </div>

      <div className="h-[400px]">
        <StatusChart data={statusData} />
      </div>
    </div>
  );
};

export default ChartsTab;
