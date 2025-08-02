import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CategoryBreakdown } from '@/hooks/useNewInsightsData';

interface CategoryVerticalChartProps {
  title: string;
  description: string;
  data: CategoryBreakdown;
}

interface CategoryTooltipProps {
  active?: boolean;
  payload?: Array<any>;
  label?: string;
}

const CategoryTooltip: React.FC<CategoryTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const totalData = payload.find(p => p.dataKey === 'count');
    const resolvedData = payload.find(p => p.dataKey === 'resolvedCount');
    
    const total = totalData?.value || 0;
    const resolved = resolvedData?.value || 0;
    
    return (
      <div className="bg-background p-3 border border-border shadow-lg rounded-lg">
        <p className="font-semibold text-foreground mb-2">{label}</p>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">
            Total incidents: <span className="font-semibold text-[#3B82F6]">{total}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Resolved incidents: <span className="font-semibold text-[#14B8A6]">{resolved}</span>
          </p>
        </div>
      </div>
    );
  }
  return null;
};

const CategoryVerticalChart: React.FC<CategoryVerticalChartProps> = ({ title, description, data }) => {
  // Transform data for vertical chart
  const chartData = data.categories.map((category) => ({
    name: category.name,
    count: category.count,
    resolvedCount: category.resolvedCount,
  }));

  if (chartData.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">No category data available</p>
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
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 60,
              }}
              barCategoryGap="20%"
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
                className="fill-muted-foreground"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                className="fill-muted-foreground"
              />
              <Tooltip 
                content={<CategoryTooltip />}
                cursor={{ fill: 'rgba(0, 0, 0, 0.1)' }}
              />
              <Bar 
                dataKey="count" 
                fill="#3B82F6"
                radius={[4, 4, 0, 0]}
                name="Total Incidents"
              />
              <Bar 
                dataKey="resolvedCount" 
                fill="#14B8A6"
                radius={[4, 4, 0, 0]}
                name="Resolved Incidents"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default CategoryVerticalChart;