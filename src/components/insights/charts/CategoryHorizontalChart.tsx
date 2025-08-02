import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CategoryBreakdown } from '@/hooks/useNewInsightsData';
import { CHART_COLORS } from '@/utils/chartColorUtils';

interface CategoryHorizontalChartProps {
  title: string;
  description: string;
  data: CategoryBreakdown;
}

const CategoryHorizontalChart: React.FC<CategoryHorizontalChartProps> = ({ title, description, data }) => {
  const chartData = data.categories.map((category, index) => ({
    name: category.name,
    value: category.count,
    percentage: category.percentage,
    fill: CHART_COLORS.sequence[index % CHART_COLORS.sequence.length]
  }));

  const chartConfig = {
    value: {
      label: "Incidents",
      color: CHART_COLORS.orange,
    },
  };

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
        <ChartContainer
          config={chartConfig}
          className="h-[300px] w-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="horizontal"
              data={chartData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis 
                dataKey="name" 
                type="category" 
                width={100}
                tick={{ fontSize: 12 }}
              />
              <ChartTooltip 
                content={<ChartTooltipContent />}
              />
              <Bar 
                dataKey="value" 
                fill={CHART_COLORS.orange}
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default CategoryHorizontalChart;