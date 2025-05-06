
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Layers, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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
          <div className="flex flex-col h-full animate-fade-in">
            <div className="grid grid-cols-1 gap-4">
              {/* Chart and tags layout */}
              <div className="flex flex-col md:flex-row min-h-[300px]">
                {/* Left side - chart - Making it larger */}
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
                
                {/* Right side - category tags */}
                <div className="w-full md:w-2/3 pl-0 md:pl-6 flex flex-col">
                  <div className="flex flex-wrap gap-2 mb-auto">
                    {data.map((item, index) => {
                      const percentage = ((item.value / total) * 100).toFixed(1);
                      const color = colors[index % colors.length];
                      const isActive = activeIndex === index;
                      
                      return (
                        <Badge
                          key={`tag-${index}`}
                          className={`
                            flex items-center gap-1.5 py-1.5 px-3 transition-all duration-200 cursor-pointer
                            ${isActive ? 'ring-2 ring-offset-1' : 'hover:ring-1 hover:ring-offset-1'}
                          `}
                          style={{ 
                            backgroundColor: `${color}15`, 
                            color: color,
                            borderColor: color,
                            // Fix: Replace ringColor with ring-color as it's not a valid CSS property
                            // We'll handle the ring color via Tailwind's ring classes instead
                          }}
                          variant="outline"
                          onMouseEnter={() => setActiveIndex(index)}
                          onMouseLeave={() => setActiveIndex(null)}
                        >
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }}></div>
                          <span className="font-medium">{item.name}</span>
                          <span className="px-1.5 py-0.5 bg-white/80 rounded-full text-xs font-medium">
                            {item.value}
                          </span>
                          <span className="text-xs opacity-80">
                            {percentage}%
                          </span>
                        </Badge>
                      );
                    })}
                  </div>
                  
                  {/* Total count badge */}
                  <div className="mt-4 flex justify-start">
                    <Badge className="bg-gray-100 hover:bg-gray-100 text-gray-700 border border-gray-200 py-1 px-3">
                      <Tag className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                      <span className="font-medium">Total: {total} incidents</span>
                    </Badge>
                  </div>
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
