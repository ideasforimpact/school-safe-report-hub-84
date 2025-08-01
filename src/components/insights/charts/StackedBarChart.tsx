import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CHART_COLORS } from '@/utils/chartColorUtils';

interface StackedBarChartProps {
  title: string;
  description: string;
  data: Array<{
    name: string;
    selfAssigned: number;
    assignedByOthers: number;
    total: number;
    open: number;
  }>;
}

const StackedBarChart: React.FC<StackedBarChartProps> = ({ title, description, data }) => {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="h-[calc(100%-90px)]">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar 
                dataKey="selfAssigned" 
                stackId="a" 
                fill={CHART_COLORS.blue} 
                name="Self Assigned"
              />
              <Bar 
                dataKey="assignedByOthers" 
                stackId="a" 
                fill={CHART_COLORS.purple} 
                name="Assigned by Others"
              />
            </BarChart>
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

export default StackedBarChart;