
import React, { useMemo } from 'react';
import CategoryChart from '@/components/insights/charts/category-chart';
import { useInsightsContext } from '@/contexts/InsightsContext';

const FacilityChart = () => {
  const { incidents, facilities } = useInsightsContext();

  const facilityData = useMemo(() => {
    const facilityCounts: Record<string, number> = {};
    
    incidents.forEach(incident => {
      if (!incident.facility_id) return;
      
      const facility = facilities.find(f => f.id === incident.facility_id);
      const facilityName = facility ? facility.name : 'Unknown';
      
      facilityCounts[facilityName] = (facilityCounts[facilityName] || 0) + 1;
    });
    
    return Object.entries(facilityCounts).map(([name, value]) => ({ name, value }));
  }, [incidents, facilities]);

  return (
    <div className="mb-6">
      <CategoryChart 
        data={facilityData}
        colors={['#22c55e', '#f59e0b', '#06b6d4', '#a855f7', '#f43f5e']}
        title="Facilities"
      />
    </div>
  );
};

export default FacilityChart;
