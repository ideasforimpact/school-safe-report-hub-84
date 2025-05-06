
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import CategoryCardHeader from './CategoryCardHeader';
import ChartPieView from './ChartPieView';
import CategoryTags from './CategoryTags';
import ChartPagination from './ChartPagination';
import NoDataDisplay from './NoDataDisplay';

interface CategoryChartProps {
  data: Array<{name: string, value: number}>;
  colors: string[];
  title?: string;
  description?: string;
}

const CategoryChart: React.FC<CategoryChartProps> = ({ 
  data, 
  colors, 
  title = "Incidents by Category", 
  description = "" 
}) => {
  // Calculate total for percentage calculation and center display
  const total = data.reduce((acc, curr) => acc + curr.value, 0);
  
  // State to track the hovered segment
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15; // Show 15 tags per page
  const totalPages = Math.ceil(data.length / itemsPerPage);

  // Sort data by value (descending) for better visualization
  const sortedData = [...data].sort((a, b) => b.value - a.value);
  
  // Get current page data
  const currentData = sortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setActiveIndex(null);
  };

  // Handle mouse events for hover effects
  const onPieEnter = (_: any, index: number) => {
    // Find the actual index in the original data array
    const actualIndex = sortedData.findIndex(item => item === data[index]);
    setActiveIndex(actualIndex);
  };

  const onPieLeave = () => {
    setActiveIndex(null);
  };

  return (
    <Card className="w-full border-0 shadow-sm bg-white">
      <CategoryCardHeader title={title} description={description} total={total} />
      <CardContent className="pt-4">
        {data.length > 0 ? (
          <div className="flex flex-col animate-fade-in">
            <div className="grid grid-cols-1 gap-4">
              {/* Chart and tags layout */}
              <div className="flex flex-col md:flex-row">
                <ChartPieView 
                  data={data}
                  colors={colors}
                  activeIndex={activeIndex}
                  total={total}
                  onPieEnter={onPieEnter}
                  onPieLeave={onPieLeave}
                />
                
                <CategoryTags 
                  currentData={currentData}
                  colors={colors}
                  originalData={data}
                  total={total}
                  activeIndex={activeIndex}
                  setActiveIndex={setActiveIndex}
                />
              </div>
            </div>
            
            {/* Pagination controls - only show if we have multiple pages */}
            {totalPages > 1 && (
              <ChartPagination 
                currentPage={currentPage}
                totalPages={totalPages}
                handlePageChange={handlePageChange}
              />
            )}
          </div>
        ) : (
          <NoDataDisplay />
        )}
      </CardContent>
    </Card>
  );
};

export default CategoryChart;
