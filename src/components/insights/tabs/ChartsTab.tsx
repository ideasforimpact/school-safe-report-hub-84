
import React from 'react';
import CategoryChart from '../charts/CategoryChart';
import BarChartComponent from '../charts/BarChartComponent';
import TimeSeriesChart from '../charts/TimeSeriesChart';
import StatusChart from '../charts/StatusChart';

interface ChartsTabProps {
  categoryData: Array<{name: string, value: number}>;
  typeData: Array<{name: string, value: number}>;
  subcategoryData: Array<{name: string, value: number}>;
  timeSeriesData: Array<{month: string, count: number}>;
  locationData: Array<{name: string, value: number}>;
  facilityData: Array<{name: string, value: number}>;
  assigneeData: Array<{name: string, value: number}>;
  statusData: Array<{name: string, value: number}>;
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
        
        <TimeSeriesChart data={timeSeriesData} />
        
        <BarChartComponent 
          title="Incident Location" 
          description="Distribution of incidents by location"
          data={locationData}
          color="#0ea5e9"
          layout="vertical"
        />

        {isAdmin && facilityData.length > 0 && (
          <CategoryChart data={facilityData} colors={colors} />
        )}

        <BarChartComponent 
          title="Top 10 Subcategories" 
          description="Most common specific types of incidents reported"
          data={subcategoryData}
          color="#8884d8"
          layout="vertical"
        />
        
        <CategoryChart data={assigneeData} colors={colors} />
      </div>

      <StatusChart data={statusData} />
    </div>
  );
};

export default ChartsTab;
