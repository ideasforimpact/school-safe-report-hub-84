
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface MonthlyIncidentsChartProps {
  data: Array<{
    month: string;
    open: number;
    closed: number;
    total: number;
  }>;
  loading: boolean;
}

const MonthlyIncidentsChart = ({ data, loading }: MonthlyIncidentsChartProps) => {
  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-gray-200 rounded"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-gray-900">
          Monthly Incidents Overview
        </CardTitle>
        <p className="text-sm text-gray-600">
          Open vs Closed incidents by month
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [value, name === 'open' ? 'Open' : 'Closed']}
                labelFormatter={(label) => `Month: ${label}`}
              />
              <Legend />
              <Bar dataKey="open" fill="#ef4444" name="Open" />
              <Bar dataKey="closed" fill="#10b981" name="Closed" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default MonthlyIncidentsChart;
