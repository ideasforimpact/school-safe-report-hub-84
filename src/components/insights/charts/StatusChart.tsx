
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface StatusChartProps {
  data: Array<{name: string, value: number}>;
}

const StatusChart: React.FC<StatusChartProps> = ({ data }) => {
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Incident Status Overview</CardTitle>
        <CardDescription>
          Current status distribution of all reported incidents
        </CardDescription>
      </CardHeader>
      <CardContent className="h-64">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={
                      entry.name === 'Open' 
                        ? '#ef4444' 
                        : entry.name === 'In Progress' 
                        ? '#f59e0b' 
                        : '#22c55e'
                    } 
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            No data available for the selected filters
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StatusChart;
