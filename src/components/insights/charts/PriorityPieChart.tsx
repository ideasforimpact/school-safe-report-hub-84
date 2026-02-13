import React, { useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PriorityDistribution } from "@/hooks/useNewInsightsData";

interface PriorityPieChartProps {
  title: string;
  description: string;
  data: PriorityDistribution;
}


/* ---------- Label Text ---------- */
const renderLabel = ({
  cx,
  cy,
  midAngle,
  outerRadius,
  payload,
}: any) => {
  const RADIAN = Math.PI / 180;

  const textDistance = 24;
  const r = outerRadius + textDistance;

  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);

  const isRightSide = x > cx;

  return (
    <text
      x={x}
      y={y}
      textAnchor={isRightSide ? "start" : "end"}
      dominantBaseline="middle"
      style={{ whiteSpace: "nowrap" }}
      className="text-xs font-medium"
    >
      {`${payload.name}: ${payload.percentFixed.toFixed(1)}%`}
    </text>
  );
};


/* ---------- Label Line ---------- */
const renderLabelLine = ({
  cx,
  cy,
  midAngle,
  outerRadius,
}: any) => {
  const RADIAN = Math.PI / 180;

  const textDistance = 12;
  const r1 = outerRadius - 2;
  const r2 = outerRadius + textDistance;

  const x1 = cx + r1 * Math.cos(-midAngle * RADIAN);
  const y1 = cy + r1 * Math.sin(-midAngle * RADIAN);

  let x2 = cx + r2 * Math.cos(-midAngle * RADIAN);
  const y2 = cy + r2 * Math.sin(-midAngle * RADIAN);

  const isRightSide = x2 > cx;

  // adjust line end slightly based on text anchor
  x2 += isRightSide ? 0 : -2;

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

  // Responsive configuration
//   useEffect(() => {
//   const observer = new ResizeObserver((entries) => {
//     const width = entries[0].contentRect.width;

//     if (width < 500) {
//       setChartConfig({
//         radius: "50%",
//         margin: { top: 20, bottom: 20, left: 30, right: 30 },
//       });
//     } else if (width < 700) {
//       setChartConfig({
//         radius: "55%",
//         margin: { top: 25, bottom: 25, left: 40, right: 40 },
//       });
//     } else if (width < 900) {
//       setChartConfig({
//         radius: "60%",
//         margin: { top: 30, bottom: 30, left: 60, right: 60 },
//       });
//     } else {
//       setChartConfig({
//         radius: "65%",
//         margin: { top: 35, bottom: 35, left: 80, right: 80 },
//       });
//     }
//   });

//   if (containerRef.current) {
//     observer.observe(containerRef.current);
//   }

//   return () => observer.disconnect();
// }, []);


  const rawData =
  data?.priorities?.map((p) => ({
    name: p.name,
    value: p.count,
    fill: p.color,
  })) || [];

const total = rawData.reduce((sum, item) => sum + item.value, 0);

let accumulated = 0;

const chartData = rawData.map((item, index) => {
  if (index === rawData.length - 1) {
    // Last item gets the remaining percentage
    const percent = 100 - accumulated;
    return { ...item, percentFixed: percent };
  }

  const percent = parseFloat(((item.value / total) * 100).toFixed(1));
  accumulated += percent;

  return { ...item, percentFixed: percent };
});


  if (chartData.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">
            No priority data available
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full overflow-visible">
  <CardHeader>
    <CardTitle>{title}</CardTitle>
    <CardDescription>{description}</CardDescription>
  </CardHeader>

  <CardContent>
    <ChartContainer
      config={{}}
      className="h-[360px] w-full overflow-visible"
    >
      <div className="flex justify-center">
        <PieChart
          width={420}     // Fixed width
          height={360}    // Fixed height
          margin={{ top: 40, bottom: 40, left: 110, right: 110 }}
        >
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            outerRadius={90}   // Fixed radius (will NOT resize)
            paddingAngle={2}
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
      </div>
    </ChartContainer>
  </CardContent>
</Card>

  );
};

export default PriorityPieChart;
