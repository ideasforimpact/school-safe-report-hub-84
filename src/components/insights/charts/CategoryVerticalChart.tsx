import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
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
    const closedData = payload.find(p => p.dataKey === 'closedCount');
    
    const total = totalData?.value || 0;
    const closed = closedData?.value || 0;
    
    return (
      <div className="bg-background p-3 border border-border shadow-md rounded-lg">
        <p className="font-medium text-foreground mb-2">{label}</p>
        <p className="text-sm text-muted-foreground">
          Total incidents: <span className="font-semibold text-foreground">{total}</span>
        </p>
        <p className="text-sm text-muted-foreground">
          Closed incidents: <span className="font-semibold text-foreground">{closed}</span>
        </p>
      </div>
    );
  }

  return null;
};

const CategoryVerticalChart: React.FC<CategoryVerticalChartProps> = ({ title, description, data }) => {
  // Transform data for chart
  const chartData = data.categories.map((category) => ({
    name: category.name,
    count: category.count,
    closedCount: category.closedCount,
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
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                angle={-45}
                textAnchor="end"
                height={80}
                interval={0}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip 
                content={<CategoryTooltip />}
              />
              <Bar 
                dataKey="count" 
                fill="#3B82F6"
                radius={[4, 4, 0, 0]}
                name="Total"
              />
              <Bar 
                dataKey="closedCount" 
                fill="#14B8A6"
                radius={[4, 4, 0, 0]}
                name="Closed"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default CategoryVerticalChart;