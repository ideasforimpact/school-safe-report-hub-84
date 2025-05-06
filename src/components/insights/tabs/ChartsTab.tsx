
import React from 'react';
import CategoryChartWrapper from './charts/CategoryChartWrapper';
import StatusBlocksWrapper from './charts/StatusBlocksWrapper';
import RoleDistributionChart from './charts/RoleDistributionChart';
import RiskAssessmentChartWrapper from './charts/RiskAssessmentChartWrapper';
import IncidentTypeChart from './charts/IncidentTypeChart';
import SubcategoryChartWrapper from './charts/SubcategoryChartWrapper';
import TimeSeriesChart from './charts/TimeSeriesChart';
import LocationChart from './charts/LocationChart';
import FacilityChart from './charts/FacilityChart';
import AssigneeChart from './charts/AssigneeChart';
import HeatmapChart from '@/components/insights/charts/HeatmapChart';

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
  roleDistributionData?: Array<{name: string, value: number}>;
  heatmapData?: Array<{
    name: string;
    values: Array<{
      day: string;
      value: number;
    }>;
  }>;
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
  colors,
  roleDistributionData = [],
  heatmapData = []
}) => {
  return (
    <div className="mt-4 flex flex-col gap-12 w-full">
      {/* Featured Incidents by Category chart */}
      <div className="chart-container">
        <CategoryChartWrapper data={categoryData} colors={colors} />
      </div>
      
      {/* Status Blocks */}
      <div className="chart-container">
        <StatusBlocksWrapper data={statusData} />
      </div>
      
      {/* Role Distribution */}
      <div className="chart-container">
        <RoleDistributionChart data={roleDistributionData} colors={colors} />
      </div>
      
      {/* Risk Assessment Matrix */}
      <div className="chart-container">
        <RiskAssessmentChartWrapper data={riskData} />
      </div>
      
      {/* Incident Hotspot (Heatmap) Chart */}
      {heatmapData.length > 0 && (
        <div className="chart-container">
          <HeatmapChart 
            data={heatmapData} 
            title="Incident Hotspots" 
            description="Heatmap showing when and where incidents occur most frequently" 
          />
        </div>
      )}
      
      {/* Incidents by Type */}
      <div className="chart-container">
        <IncidentTypeChart data={typeData} />
      </div>
      
      {/* Subcategories chart */}
      <div className="chart-container">
        <SubcategoryChartWrapper data={subcategoryData} colors={colors} />
      </div>
      
      {/* Time series chart - full width */}
      <div className="chart-container">
        <TimeSeriesChart data={timeSeriesData} />
      </div>
      
      {/* Location chart - full width */}
      <div className="chart-container">
        <LocationChart data={locationData} />
      </div>

      {/* Facilities chart - only shown for admins */}
      {isAdmin && facilityData.length > 0 && (
        <div className="chart-container">
          <FacilityChart data={facilityData} colors={colors} />
        </div>
      )}
      
      {/* Assignee chart */}
      <div className="chart-container">
        <AssigneeChart data={assigneeData} colors={colors} />
      </div>
    </div>
  );
};

export default ChartsTab;
