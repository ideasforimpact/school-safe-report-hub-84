
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Layers, Tag, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from '@/components/ui/pagination';

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
  description = "" // Set default to empty string instead of the lengthy description
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

  // Create an array of page numbers for pagination
  const pageNumbers = [];
  const maxVisiblePages = 5;
  
  if (totalPages <= maxVisiblePages) {
    // Show all pages if total is less than max visible
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(i);
    }
  } else {
    // Always show first page
    pageNumbers.push(1);
    
    // Calculate start and end of visible range
    let startPage = Math.max(2, currentPage - 1);
    let endPage = Math.min(totalPages - 1, currentPage + 1);
    
    // Adjust if we're near the beginning
    if (currentPage <= 3) {
      endPage = 4;
    }
    
    // Adjust if we're near the end
    if (currentPage >= totalPages - 2) {
      startPage = totalPages - 3;
    }
    
    // Add ellipsis after first page if needed
    if (startPage > 2) {
      pageNumbers.push('ellipsis-start');
    }
    
    // Add visible pages
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    
    // Add ellipsis before last page if needed
    if (endPage < totalPages - 1) {
      pageNumbers.push('ellipsis-end');
    }
    
    // Always show last page
    pageNumbers.push(totalPages);
  }

  return (
    <Card className="h-full overflow-hidden border-0 shadow-sm bg-white">
      <CardHeader className="bg-white/40 backdrop-blur-sm border-b border-gray-50">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-primary" />
          <CardTitle className="text-xl">{title}</CardTitle>
          <Badge variant="outline" className="ml-2 bg-gray-50">
            {total} incidents
          </Badge>
        </div>
        {description && (
          <CardDescription>
            {description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="h-[calc(100%-90px)] pt-4">
        {data.length > 0 ? (
          <div className="flex flex-col h-full animate-fade-in">
            <div className="grid grid-cols-1 gap-4">
              {/* Chart and tags layout */}
              <div className="flex flex-col md:flex-row h-full">
                {/* Left side - chart */}
                <div className="w-full md:w-1/3 h-[260px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        innerRadius={60}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        onMouseEnter={onPieEnter}
                        onMouseLeave={onPieLeave}
                        animationDuration={800}
                        animationBegin={0}
                        animationEasing="ease-out"
                        paddingAngle={2}
                      >
                        {data.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={colors[index % colors.length]}
                            opacity={activeIndex === null || activeIndex === index ? 1 : 0.6}
                            strokeWidth={activeIndex === index ? 2 : 0}
                            stroke="#fff"
                          />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => [`${value} incidents (${((value as number / total) * 100).toFixed(1)}%)`]} 
                        contentStyle={{ borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', border: 'none' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Right side - category tags with scroll area */}
                <div className="w-full md:w-2/3 pl-0 md:pl-6 flex flex-col">
                  {/* Scrollable tags container with fixed height */}
                  <ScrollArea className="flex-grow h-[210px] pr-4">
                    <div className="flex flex-wrap gap-2">
                      {currentData.map((item, index) => {
                        const originalIndex = data.findIndex(d => d.name === item.name);
                        const percentage = ((item.value / total) * 100).toFixed(1);
                        const color = colors[originalIndex % colors.length];
                        const isActive = activeIndex === originalIndex;
                        
                        return (
                          <Badge
                            key={`tag-${item.name}-${index}`}
                            className={`
                              flex items-center gap-1.5 py-1.5 px-3 transition-all duration-200 cursor-pointer
                              mb-2 max-w-full
                              ${isActive ? 'ring-2 ring-offset-1' : 'hover:ring-1 hover:ring-offset-1'}
                            `}
                            style={{ 
                              backgroundColor: `${color}15`, 
                              color: color,
                              borderColor: color,
                            }}
                            variant="outline"
                            onMouseEnter={() => setActiveIndex(originalIndex)}
                            onMouseLeave={() => setActiveIndex(null)}
                          >
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }}></div>
                            <span className="font-medium truncate max-w-[120px]" title={item.name}>{item.name}</span>
                            <span className="px-1.5 py-0.5 bg-white/80 rounded-full text-xs font-medium whitespace-nowrap">
                              {item.value}
                            </span>
                            <span className="text-xs opacity-80 whitespace-nowrap">
                              {percentage}%
                            </span>
                          </Badge>
                        );
                      })}
                    </div>
                  </ScrollArea>
                  
                  {/* Pagination controls - only show if we have multiple pages */}
                  {totalPages > 1 && (
                    <div className="flex justify-center mt-4">
                      <Pagination>
                        <PaginationContent>
                          {/* Previous page button */}
                          <PaginationItem>
                            <PaginationLink
                              onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                              disabled={currentPage === 1}
                              aria-disabled={currentPage === 1}
                              className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </PaginationLink>
                          </PaginationItem>
                          
                          {/* Page numbers */}
                          {pageNumbers.map((page, i) => (
                            <PaginationItem key={`page-${i}`}>
                              {page === 'ellipsis-start' || page === 'ellipsis-end' ? (
                                <span className="px-2">...</span>
                              ) : (
                                <PaginationLink
                                  onClick={() => typeof page === 'number' && handlePageChange(page)}
                                  isActive={page === currentPage}
                                  className={typeof page === 'number' ? "cursor-pointer" : ""}
                                >
                                  {page}
                                </PaginationLink>
                              )}
                            </PaginationItem>
                          ))}
                          
                          {/* Next page button */}
                          <PaginationItem>
                            <PaginationLink
                              onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                              disabled={currentPage === totalPages}
                              aria-disabled={currentPage === totalPages}
                              className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                            >
                              <ChevronRight className="h-4 w-4" />
                            </PaginationLink>
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-500">
            No data available for the selected filters
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CategoryChart;
