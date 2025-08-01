import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { ResolutionMetrics, ResponseMetrics } from '@/utils/insights/advancedMetrics';

interface PerformanceMetricsChartProps {
  resolutionMetrics: ResolutionMetrics;
  responseMetrics: ResponseMetrics;
  timeSeriesData: Array<{month: string, count: number}>;
}

const PerformanceMetricsChart: React.FC<PerformanceMetricsChartProps> = ({
  resolutionMetrics,
  responseMetrics,
  timeSeriesData
}) => {
  // Prepare performance data
  const performanceData = [
    {
      metric: 'Resolution Rate',
      value: resolutionMetrics.resolutionRate,
      target: 85,
      unit: '%'
    },
    {
      metric: 'SLA Compliance',
      value: responseMetrics.slaCompliance,
      target: 90,
      unit: '%'
    },
    {
      metric: 'Avg Response Time',
      value: responseMetrics.averageResponseTime,
      target: 24,
      unit: 'hrs'
    },
    {
      metric: 'Avg Resolution Time',
      value: resolutionMetrics.averageResolutionTime,
      target: 7,
      unit: 'days'
    }
  ];

  // Prepare trend data with performance metrics
  const trendData = timeSeriesData.map((item, index) => ({
    ...item,
    resolutionRate: Math.max(60, 95 - Math.random() * 15), // Sample data
    slaCompliance: Math.max(70, 95 - Math.random() * 20) // Sample data
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Performance Metrics Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Performance KPIs</CardTitle>
          <CardDescription>Current performance vs targets</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={performanceData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="metric" 
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={12}
              />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => {
                  const numValue = typeof value === 'number' ? value : parseFloat(value.toString());
                  const item = performanceData.find(d => d.value === numValue);
                  return [`${numValue.toFixed(1)}${item?.unit || ''}`, name];
                }}
              />
              <Bar dataKey="value" fill="#3b82f6" name="Current" />
              <Bar dataKey="target" fill="#e5e7eb" name="Target" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Performance Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Trends</CardTitle>
          <CardDescription>Monthly performance metrics over time</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => {
                const numValue = typeof value === 'number' ? value : parseFloat(value.toString());
                return [`${numValue.toFixed(1)}%`, ''];
              }} />
              <Line 
                type="monotone" 
                dataKey="resolutionRate" 
                stroke="#10b981" 
                strokeWidth={2}
                dot={{ fill: '#10b981' }}
                name="Resolution Rate"
              />
              <Line 
                type="monotone" 
                dataKey="slaCompliance" 
                stroke="#f59e0b" 
                strokeWidth={2}
                dot={{ fill: '#f59e0b' }}
                name="SLA Compliance"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceMetricsChart;