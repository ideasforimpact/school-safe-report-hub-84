import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MonthlyTrendsArea } from '@/hooks/useNewInsightsData';
import { CHART_COLORS } from '@/utils/chartColorUtils';

interface MonthlyTrendsAreaChartProps {
  title: string;
  description: string;
  data: MonthlyTrendsArea;
}

const MonthlyTrendsAreaChart: React.FC<MonthlyTrendsAreaChartProps> = ({ title, description, data }) => {
  const chartConfig = {
    incidents: {
      label: "Total Incidents",
      color: CHART_COLORS.blue,
    },
    closed: {
      label: "Closed",
      color: CHART_COLORS.green,
    },
    open: {
      label: "Open",
      color: CHART_COLORS.red,
    },
  };

  if (data.monthlyData.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">No trend data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={chartConfig}
          className="h-[300px] w-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              <Area
                type="monotone"
                dataKey="incidents"
                stackId="1"
                stroke={CHART_COLORS.blue}
                fill={CHART_COLORS.blue}
                fillOpacity={0.6}
                name="Total Incidents"
              />
              <Area
                type="monotone"
                dataKey="closed"
                stackId="2"
                stroke={CHART_COLORS.green}
                fill={CHART_COLORS.green}
                fillOpacity={0.6}
                name="Closed"
              />
              <Area
                type="monotone"
                dataKey="open"
                stackId="3"
                stroke={CHART_COLORS.red}
                fill={CHART_COLORS.red}
                fillOpacity={0.6}
                name="Open"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default MonthlyTrendsAreaChart;