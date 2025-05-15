
import React from 'react';
import CategoryChart from '../../charts/category-chart';

interface CategoryChartWrapperProps {
  data: Array<{name: string, value: number}>;
  colors: string[];
  title?: string;
  description?: string;
}

const CategoryChartWrapper: React.FC<CategoryChartWrapperProps> = ({ data, colors, title, description }) => {
  return (
    <div className="h-[400px] shadow-sm rounded-xl overflow-hidden w-full">
      <CategoryChart 
        data={data} 
        colors={colors} 
        title={title}
        description={description}
      />
    </div>
  );
};

export default CategoryChartWrapper;
