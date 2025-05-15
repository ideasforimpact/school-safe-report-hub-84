
import React from 'react';
import CategoryChartComponent from './category-chart';

// Define the props interface for CategoryChart
interface CategoryChartProps {
  data: Array<{ name: string; value: number }>;
  colors: string[];
  title?: string;
  description?: string;
}

const CategoryChart: React.FC<CategoryChartProps> = ({ data, colors, title, description }) => {
  return <CategoryChartComponent data={data} colors={colors} title={title} description={description} />;
};

export default CategoryChart;
