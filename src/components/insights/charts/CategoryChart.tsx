
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
    <Card className="h-full overflow-hidden border-0 bg-gradient-to-br from-white to-gray-50 shadow-md">
      <CardHeader className="bg-white/40 backdrop-blur-sm">
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
            {/* Donut chart on the left */}
            <div className="w-full md:w-2/3 h-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    innerRadius={80}
                    outerRadius={140}
                    fill="#8884d8"
                    dataKey="value"
                    onMouseEnter={onPieEnter}
                    onMouseLeave={onPieLeave}
                    animationDuration={800}
                    animationBegin={0}
                    animationEasing="ease-out"
                  >
                    {data.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={colors[index % colors.length]}
                        opacity={activeIndex === null || activeIndex === index ? 1 : 0.6}
                        strokeWidth={activeIndex === index ? 2 : 1}
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
              
              {/* Center content showing total incidents */}
              <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                <div className="text-3xl font-bold">{total}</div>
                <div className="text-sm text-gray-500">Total Incidents</div>
              </div>
            </div>
            
            {/* Enhanced legend on the right */}
            <div className="w-full md:w-1/3 pl-0 md:pl-4 mt-4 md:mt-0 overflow-y-auto max-h-[300px] md:max-h-full">
              <h4 className="text-sm font-medium mb-3 text-gray-500 uppercase tracking-wider">Categories</h4>
              <div className="space-y-3">
                {data.map((item, index) => {
                  // Format the percentage with consistent decimals
                  const percentage = ((item.value / total) * 100).toFixed(1);
                  // Format value with commas for thousands
                  const formattedValue = item.value.toLocaleString();
                  const color = colors[index % colors.length];
                  const isActive = activeIndex === index;
                  
                  return (
                    <div
                      key={`legend-${index}`}
                      className={`p-2 rounded-lg transition-all duration-200 ${isActive ? 'bg-gray-100 shadow-sm' : 'hover:bg-gray-50'}`}
                      onMouseEnter={() => setActiveIndex(index)}
                      onMouseLeave={() => setActiveIndex(null)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div 
                            className="w-4 h-4 rounded-md mr-2" 
                            style={{ backgroundColor: color }}
                          />
                          <span className="text-sm font-medium truncate max-w-[150px]">
                            {item.name}
                          </span>
                        </div>
                        <span className="text-sm font-semibold whitespace-nowrap">
                          {formattedValue}
                        </span>
                      </div>
                      
                      {/* Progress bar showing percentage */}
                      <div className="mt-1 w-full bg-gray-100 rounded-full h-1.5">
                        <div 
                          className="h-1.5 rounded-full transition-all duration-500 ease-out"
                          style={{ 
                            width: `${percentage}%`,
                            backgroundColor: color,
                            boxShadow: isActive ? `0 0 8px ${color}` : 'none'
                          }}
                        />
                      </div>
                      <div className="flex justify-end mt-0.5">
                        <span className="text-xs text-gray-500">
                          {percentage}%
                        </span>
                      </div>
                    </div>
                  );
                })}
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
