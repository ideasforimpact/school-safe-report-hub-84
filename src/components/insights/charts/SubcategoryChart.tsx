
import React, { useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LabelList,
  Cell
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer } from '@/components/ui/chart';

interface SubcategoryChartProps {
  data: Array<{name: string, value: number}>;
  colors: string[];
}

const SubcategoryChart: React.FC<SubcategoryChartProps> = ({ data, colors }) => {
  // Sort data by value in descending order and take top 10
  const chartData = useMemo(() => {
    return [...data]
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)
      .map(item => ({
        ...item,
        formattedValue: item.value // Store original value for label
      }));
  }, [data]);
  
  // Calculate total for percentages
  const total = useMemo(() => {
    return data.reduce((sum, item) => sum + item.value, 0);
  }, [data]);

  // Generate color gradient based on value
  const getBarColor = (index: number) => {
    const baseColor = colors[0] || '#8884d8'; // Default to purple
    
    // Calculate opacity based on position in sorted array
    const opacity = 0.4 + (0.6 * (1 - (index / 10)));
    
    // For hex colors, convert to RGB to add opacity
    if (baseColor.startsWith('#')) {
      const r = parseInt(baseColor.slice(1, 3), 16);
      const g = parseInt(baseColor.slice(3, 5), 16);
      const b = parseInt(baseColor.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
    
    return baseColor;
  };

  return (
    <Card className="w-full h-full shadow-sm">
      <CardHeader>
        <CardTitle>Top 10 Subcategories</CardTitle>
        <CardDescription>Most common specific types of incidents reported</CardDescription>
      </CardHeader>
      <CardContent className="h-[calc(100%-90px)]">
        {chartData.length > 0 ? (
          <ChartContainer config={{}} className="w-full h-full animate-fade-in">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 15, right: 50, left: 30, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={150} 
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  formatter={(value: number) => {
                    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) + '%' : '0%';
                    return [`${value} (${percentage})`, 'Count'];
                  }}
                  labelStyle={{ fontWeight: 'bold' }}
                />
                <Bar
                  dataKey="value"
                  radius={[0, 4, 4, 0]}
                  animationDuration={1500}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getBarColor(index)} />
                  ))}
                  <LabelList 
                    dataKey="formattedValue" 
                    position="right" 
                    style={{ fill: '#6b7280', fontWeight: 'bold', fontSize: 12 }} 
                    formatter={(value: number) => {
                      const percentage = total > 0 ? ((value / total) * 100).toFixed(0) + '%' : '0%';
                      return `${value} (${percentage})`;
                    }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            No data available for the selected filters
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SubcategoryChart;
