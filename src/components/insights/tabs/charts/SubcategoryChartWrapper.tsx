
import React from 'react';
import SubcategoryChart from '../../charts/SubcategoryChart';

interface SubcategoryChartWrapperProps {
  data: Array<{name: string, value: number}>;
  colors: string[];
}

const SubcategoryChartWrapper: React.FC<SubcategoryChartWrapperProps> = ({ data, colors }) => {
  return (
    <div className="h-[500px] w-full">
      <SubcategoryChart 
        data={data}
        colors={colors}
      />
    </div>
  );
};

export default SubcategoryChartWrapper;
