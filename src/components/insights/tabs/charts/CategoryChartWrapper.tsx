
import React from 'react';
import CategoryChart from '../../charts/category-chart';

interface CategoryChartWrapperProps {
  data: Array<{name: string, value: number}>;
  colors: string[];
}

const CategoryChartWrapper: React.FC<CategoryChartWrapperProps> = ({ data, colors }) => {
  return (
    <div className="h-[400px] shadow-sm rounded-xl overflow-hidden w-full">
      <CategoryChart data={data} colors={colors} />
    </div>
  );
};

export default CategoryChartWrapper;
