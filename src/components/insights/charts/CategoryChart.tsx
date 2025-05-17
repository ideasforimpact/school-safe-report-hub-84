
import React from 'react';
import { useIncidents } from '@/contexts/incident'; // Fixed import path
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';

// Define the component props interface
interface CategoryChartProps {
  data?: { name: string; value: number }[];
  colors?: string[];
  title?: string;
  description?: string;
}

const CategoryChart: React.FC<CategoryChartProps> = ({ 
  data: propData,
  colors: propColors,
  title = "Incident Categories",
  description
}) => {
  const { incidents } = useIncidents();
  
  // Use provided data or generate from incidents
  const categoryData = React.useMemo(() => {
    if (propData) return propData;
    
    const categoryCount: { [key: string]: number } = {};
    
    incidents.forEach((incident) => {
      const categoryName = incident.category;
      categoryCount[categoryName] = (categoryCount[categoryName] || 0) + 1;
    });
    
    // Convert to the format expected by recharts
    return Object.entries(categoryCount).map(([name, value]) => ({
      name,
      value
    }));
  }, [incidents, propData]);

  // Use provided colors or default colors
  const COLORS = propColors || ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

  // If there's no data, display a message
  if (!categoryData.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          {description && <p className="text-muted-foreground text-sm">{description}</p>}
        </CardHeader>
        <CardContent className="flex justify-center items-center h-60">
          <p className="text-muted-foreground">No incident data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        {description && <p className="text-muted-foreground text-sm">{description}</p>}
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value} incidents`, 'Count']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default CategoryChart;
