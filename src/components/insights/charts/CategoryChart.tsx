
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Layers } from 'lucide-react';

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
  description = "Distribution of incidents across different categories" 
}) => {
  // Calculate total for percentage calculation and center display
  const total = data.reduce((acc, curr) => acc + curr.value, 0);
  
  // State to track the hovered segment
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // Handle mouse events for hover effects
  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(null);
  };

  return (
    <Card className="h-full overflow-hidden border-0 shadow-sm bg-white">
      <CardHeader className="bg-white/40 backdrop-blur-sm border-b border-gray-50">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-primary" />
          <CardTitle className="text-xl">{title}</CardTitle>
        </div>
        <CardDescription>
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[calc(100%-90px)]">
        {data.length > 0 ? (
          <div className="flex flex-col md:flex-row h-full animate-fade-in">
            {/* Left side - chart */}
            <div className="w-full md:w-5/12 h-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    innerRadius={70}
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
            
            {/* Right side - elegant table */}
            <div className="w-full md:w-7/12 overflow-y-auto pl-0 md:pl-6 mt-4 md:mt-0">
              <div className="space-y-1">
                {data.map((item, index) => {
                  // Format the percentage with consistent decimals
                  const percentage = ((item.value / total) * 100).toFixed(1);
                  const color = colors[index % colors.length];
                  const isActive = activeIndex === index;
                  
                  return (
                    <div
                      key={`legend-${index}`}
                      className={`py-2 px-3 rounded-md transition-all duration-200 border-l-4 ${isActive ? 'bg-gray-50' : 'hover:bg-gray-50'}`}
                      style={{ borderLeftColor: color }}
                      onMouseEnter={() => setActiveIndex(index)}
                      onMouseLeave={() => setActiveIndex(null)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-medium text-gray-800">
                            {item.name}
                          </span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-medium text-gray-600">
                            {item.value}
                          </span>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                            {percentage}%
                          </span>
                        </div>
                      </div>
                      
                      {/* Thin elegant progress bar */}
                      <div className="mt-1 w-full bg-gray-100 rounded-full h-1">
                        <div 
                          className="h-1 rounded-full transition-all duration-300 ease-out"
                          style={{ 
                            width: `${percentage}%`,
                            backgroundColor: color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Total section */}
              <div className="mt-6 pt-4 border-t border-gray-100">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Total Incidents</span>
                  <span className="text-base font-semibold">{total}</span>
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
