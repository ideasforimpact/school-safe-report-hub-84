
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface BarChartComponentProps {
  title: string;
  description: string;
  data: Array<{name: string, value: number}>;
  color?: string;
  layout?: 'horizontal' | 'vertical';
}

const BarChartComponent: React.FC<BarChartComponentProps> = ({ 
  title, 
  description, 
  data, 
  color = '#3b82f6',
  layout = 'horizontal'
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="h-64">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            {layout === 'horizontal' ? (
              <BarChart data={data}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill={color} />
              </BarChart>
            ) : (
              <BarChart data={data} layout="vertical">
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="value" fill={color} />
              </BarChart>
            )}
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

export default BarChartComponent;
