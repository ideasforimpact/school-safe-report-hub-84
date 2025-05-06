
import React from 'react';
import LocationChart from './charts/LocationChart';
import FacilityChart from './charts/FacilityChart';
import HeatmapChart from '@/components/insights/charts/HeatmapChart';

interface LocationTabProps {
  locationData: Array<{name: string, value: number}>;
  facilityData: Array<{name: string, value: number}>;
  heatmapData: Array<{
    name: string;
    values: Array<{
      day: string;
      value: number;
    }>;
  }>;
  isAdmin: boolean;
  colors: string[];
}

const LocationTab: React.FC<LocationTabProps> = ({
  locationData,
  facilityData,
  heatmapData,
  isAdmin,
  colors
}) => {
  return (
    <div className="flex flex-col gap-12 w-full">
      {/* Location chart */}
      <div className="chart-container">
        <LocationChart data={locationData} />
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
      
      {/* Facilities chart - only shown for admins */}
      {isAdmin && facilityData.length > 0 && (
        <div className="chart-container">
          <FacilityChart data={facilityData} colors={colors} />
        </div>
      )}
    </div>
  );
};

export default LocationTab;
