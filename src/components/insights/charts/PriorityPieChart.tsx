import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PriorityDistribution } from '@/hooks/useNewInsightsData';

interface PriorityPieChartProps {
  title: string;
  description: string;
  data: PriorityDistribution;
}

/* ---------- FIXED PERCENTAGE CALCULATION ---------- */
const distributePercentages = (values: number[]): string[] => {
  const total = values.reduce((sum, val) => sum + val, 0);

  if (total === 0) {
    return values.map(() => '0.0');
  }

  const raw = values.map((value) => (value / total) * 100);

  const rounded = raw.map((p) => Number(p.toFixed(1)));

  const roundedTotal = rounded.reduce((sum, p) => sum + p, 0);

  const diff = Number((100 - roundedTotal).toFixed(1));

  if (diff !== 0) {
    const maxIndex = rounded.indexOf(Math.max(...rounded));
    rounded[maxIndex] = Number((rounded[maxIndex] + diff).toFixed(1));
  }

  return rounded.map((p) => p.toFixed(1));
};

/* ---------- Label Text ---------- */
const makeRenderLabel = (adjustedPercentages: string[]) =>
  ({
    cx,
    cy,
    midAngle,
    outerRadius,
    name,
    index,
  }: any) => {
    const RADIAN = Math.PI / 180;

    const r = outerRadius + 18;
    let x = cx + r * Math.cos(-midAngle * RADIAN);
    const y = cy + r * Math.sin(-midAngle * RADIAN);

    const isRightSide = x > cx;


    if (!isRightSide) {
    x = x - 25; // adjust spacing if needed (30–50)
    }

    const percentage = `${adjustedPercentages[index]}%`;

    return (
      <text
        x={x}
        y={y}
      textAnchor="start"   // ✅ always start from first letter
        dominantBaseline="middle"
        fontSize={10}
        fill="#374151"
      >
        <tspan x={x} dy="0">
          {name}
        </tspan>

        <tspan x={x} dy="12">
          {percentage}
        </tspan>
      </text>
    );
  };


/* ---------- Label Line (NO DOT, NO OVERLAP) ---------- */
const renderLabelLine = ({
  cx,
  cy,
  midAngle,
  outerRadius,
}: any) => {
  const RADIAN = Math.PI / 180;

  const r1 = outerRadius - 2;   // start slightly inside pie
  const r2 = outerRadius + 10;  // end near label

  const x1 = cx + r1 * Math.cos(-midAngle * RADIAN);
  const y1 = cy + r1 * Math.sin(-midAngle * RADIAN);
  const x2 = cx + r2 * Math.cos(-midAngle * RADIAN);
  const y2 = cy + r2 * Math.sin(-midAngle * RADIAN);

  return (
    <path
      d={`M${x1},${y1} L${x2},${y2}`}
      stroke="#9CA3AF"
      fill="none"
      strokeWidth={1}
    />
  );
};

const PriorityPieChart: React.FC<PriorityPieChartProps> = ({
  title,
  description,
  data,
}) => {
  const chartData =
    data?.priorities?.map((p) => ({
      name: p.name,
      value: p.count,
      fill: p.color,
    })) || [];

  /* ---------- USE FIXED PERCENTAGES ---------- */
  const adjustedPercentages = distributePercentages(
    chartData.map((d) => d.value)
  );

  const renderLabel = makeRenderLabel(adjustedPercentages);

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
        <ChartContainer config={{}} className="h-[360px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 24, bottom: 24, left: 24, right: 24 }}>
              <Pie
                data={chartData}
                cx="50%"
                cy="47%"          // ⬅ slightly higher = centered labels
                outerRadius={90}
                paddingAngle={1}
                dataKey="value"
                label={renderLabel}
                labelLine={renderLabelLine}
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
