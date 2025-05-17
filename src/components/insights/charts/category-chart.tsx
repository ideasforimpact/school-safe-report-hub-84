
import React from 'react';
import { useIncidents } from '@/contexts/incident'; // Fixed import path
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

const CategoryChart = () => {
  const { incidents } = useIncidents();

  // Count incidents by category
  const categoryData = React.useMemo(() => {
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
  }, [incidents]);

  // If there's no data, display a message
  if (!categoryData.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Incident Categories</CardTitle>
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
        <CardTitle className="text-lg font-semibold">Incident Categories</CardTitle>
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
