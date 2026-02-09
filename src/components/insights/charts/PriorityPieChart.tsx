import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PriorityDistribution } from '@/hooks/useNewInsightsData';

interface PriorityPieChartProps {
  title: string;
  description: string;
  data: PriorityDistribution;
}

/**
 * Custom label renderer to prevent text clipping.
 * Ensures labels like "Informational: 2.9%" always show fully.
 */
const renderFullLabel = ({
  cx,
  cy,
  midAngle,
  outerRadius,
  name,
  percent,
}: any) => {
  const RADIAN = Math.PI / 180;

  // Slightly inside the safe drawing area
  const radius = outerRadius + 10;

  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      className="text-xs fill-foreground"
    >
      {`${name}: ${percent}%`}
    </text>
  );
};

const PriorityPieChart: React.FC<PriorityPieChartProps> = ({
  title,
  description,
  data,
}) => {
  const total = data.priorities.reduce((sum, p) => sum + p.count, 0);

  let accumulated = 0;

  const chartData = data.priorities.map((priority, index) => {
    const percent =
      index === data.priorities.length - 1
        ? +(100 - accumulated).toFixed(1) // force exact 100%
        : +((priority.count / total) * 100).toFixed(1);

    accumulated += percent;

    return {
      name: priority.name,
      value: priority.count, // raw value for pie geometry
      percent,
      fill: priority.color,
    };
  });

  if (chartData.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">No priority data available</p>
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
        <ChartContainer config={{}} className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                outerRadius={90}
                dataKey="value"
                label={renderFullLabel}
                labelLine
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>

              <ChartTooltip content={<ChartTooltipContent />} />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default PriorityPieChart;
