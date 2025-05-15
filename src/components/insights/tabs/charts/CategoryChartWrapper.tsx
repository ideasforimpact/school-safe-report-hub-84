
import React, { useState } from 'react';
import CategoryChart from '@/components/insights/charts/CategoryChart';

interface CategoryChartWrapperProps {
  data?: { name: string; value: number }[];
  colors?: string[];
  title?: string;
  description?: string;
}

const CategoryChartWrapper: React.FC<CategoryChartWrapperProps> = ({ 
  data, 
  colors,
  title = "Incidents by Category",
  description = "Distribution of incidents across categories"
}) => {
  const [chartData] = useState(data || [
    { name: 'Physical Injury', value: 40 },
    { name: 'Bullying', value: 20 },
    { name: 'Property Damage', value: 15 },
    { name: 'Health Concern', value: 15 },
    { name: 'Other', value: 10 },
  ]);

  const [chartColors] = useState(colors || [
    '#4C6FFF', '#28C76F', '#FF9F43', '#EA5455', '#A8AAAE'
  ]);

  return (
    <CategoryChart 
      data={chartData}
      colors={chartColors}
      title={title}
      description={description}
    />
  );
};

export default CategoryChartWrapper;
