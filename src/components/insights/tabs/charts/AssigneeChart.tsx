
import React, { useState } from 'react';
import CategoryChart from '@/components/insights/charts/CategoryChart';

interface AssigneeChartProps {
  data?: { name: string; value: number }[];
  colors?: string[];
}

const AssigneeChart: React.FC<AssigneeChartProps> = ({ data = [], colors = [] }) => {
  const [chartData] = useState(data || [
    { name: 'John Smith', value: 35 },
    { name: 'Sarah Johnson', value: 22 },
    { name: 'Robert Lee', value: 18 },
    { name: 'Maria Garcia', value: 15 },
    { name: 'Others', value: 10 },
  ]);

  const [chartColors] = useState(colors || [
    '#4C6FFF', '#28C76F', '#FF9F43', '#EA5455', '#A8AAAE'
  ]);

  return (
    <CategoryChart 
      data={chartData}
      colors={chartColors}
      title="Incidents by Assignee"
      description="Distribution of incidents by assigned staff member"
    />
  );
};

export default AssigneeChart;
