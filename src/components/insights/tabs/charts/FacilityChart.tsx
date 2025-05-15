
import React, { useState } from 'react';
import CategoryChart from '@/components/insights/charts/CategoryChart';

interface FacilityChartProps {
  data?: { name: string; value: number }[];
  colors?: string[];
}

const FacilityChart: React.FC<FacilityChartProps> = ({ data = [], colors = [] }) => {
  const [chartData] = useState(data || [
    { name: 'Classrooms', value: 38 },
    { name: 'Playground', value: 25 },
    { name: 'Cafeteria', value: 15 },
    { name: 'Gymnasium', value: 12 },
    { name: 'Other', value: 10 },
  ]);

  const [chartColors] = useState(colors || [
    '#4C6FFF', '#28C76F', '#FF9F43', '#EA5455', '#A8AAAE'
  ]);

  return (
    <CategoryChart 
      data={chartData}
      colors={chartColors}
      title="Incidents by Facility"
      description="Distribution of incidents by facility location"
    />
  );
};

export default FacilityChart;
