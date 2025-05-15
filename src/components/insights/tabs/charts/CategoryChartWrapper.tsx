
import React from 'react';
import CategoryChart from '@/components/insights/charts/category-chart';
import { useCategoryData } from '@/hooks/insights/useCategoryData';

const CategoryChartWrapper = () => {
  const { categoryData, colors } = useCategoryData();
  
  return (
    <div className="mb-6">
      <CategoryChart 
        data={categoryData}
        colors={colors}
        title="Categories"
      />
    </div>
  );
};

export default CategoryChartWrapper;
