
import React from 'react';
import ChartPieView from './ChartPieView';
import CategoryCardHeader from './CategoryCardHeader';
import NoDataDisplay from './NoDataDisplay';
import { Card } from '@/components/ui/card';
import CategoryTags from './CategoryTags';
import ChartPagination from './ChartPagination';

interface CategoryChartProps {
  data?: Array<{
    name: string;
    value: number;
  }>;
  colors?: string[];
  title?: string;
}

const CategoryChart: React.FC<CategoryChartProps> = ({ 
  data = [], 
  colors = ['#22c55e', '#06b6d4', '#f59e0b', '#f43f5e', '#a855f7'],
  title = 'Categories'
}) => {
  const hasData = data.length > 0;
  
  return (
    <Card className="overflow-hidden shadow-sm">
      <div className="p-6">
        <CategoryCardHeader title={title} />
        
        <div className="h-[300px] w-full mt-4">
          {hasData ? (
            <div className="flex flex-col h-full">
              <ChartPieView data={data} colors={colors} />
              <CategoryTags data={data} colors={colors} />
              {data.length > 5 && (
                <div className="mt-3">
                  <ChartPagination totalItems={data.length} />
                </div>
              )}
            </div>
          ) : (
            <NoDataDisplay />
          )}
        </div>
      </div>
    </Card>
  );
};

export default CategoryChart;
