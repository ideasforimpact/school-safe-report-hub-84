
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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
  // Calculate total for percentage calculation
  const total = data.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <div className="flex flex-col md:flex-row">
            {/* Chart on the left */}
            <div className="w-full md:w-2/3 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} incidents (${((value as number / total) * 100).toFixed(1)}%)`]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Categories list on the right */}
            <div className="w-full md:w-1/3 pl-0 md:pl-4 mt-4 md:mt-0">
              <h4 className="text-sm font-medium mb-2">Categories</h4>
              <ul className="space-y-2">
                {data.map((item, index) => (
                  <li key={`list-${index}`} className="flex items-center">
                    <span 
                      className="w-3 h-3 rounded-full mr-2" 
                      style={{ backgroundColor: colors[index % colors.length] }}
                    ></span>
                    <span className="text-sm font-medium">
                      {item.name} ({item.value})
                    </span>
                    <span className="text-xs text-gray-500 ml-1">
                      ({((item.value / total) * 100).toFixed(1)}%)
                    </span>
                  </li>
                ))}
              </ul>
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
