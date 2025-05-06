
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

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
            
            {/* Categories list on the right - Improved styling */}
            <div className="w-full md:w-1/3 pl-0 md:pl-4 mt-4 md:mt-0">
              <h4 className="text-sm font-medium mb-3">Categories</h4>
              <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-3">
                <table className="w-full">
                  <tbody>
                    {data.map((item, index) => {
                      // Format the percentage with consistent decimals
                      const percentage = ((item.value / total) * 100).toFixed(1);
                      // Format value with commas for thousands
                      const formattedValue = item.value.toLocaleString();
                      
                      return (
                        <tr 
                          key={`list-${index}`} 
                          className={`
                            ${index !== data.length - 1 ? "border-b border-gray-200 dark:border-gray-700/50" : ""}
                          `}
                        >
                          <td className="py-2">
                            <div className="flex items-center">
                              <div 
                                className="w-3 h-3 rounded-sm mr-2" 
                                style={{ backgroundColor: colors[index % colors.length] }}
                              />
                              <span className="text-sm font-medium truncate max-w-[120px]">
                                {item.name}
                              </span>
                            </div>
                          </td>
                          <td className="text-right py-2 whitespace-nowrap">
                            <span className="text-sm font-medium">
                              {formattedValue}
                            </span>
                            <span className="text-xs text-gray-500 ml-1">
                              ({percentage}%)
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
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
