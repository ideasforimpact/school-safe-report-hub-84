
import React from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useIncidents } from "@/contexts/incident"; // Fixed import path
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

const STATUS_COLORS = {
  Open: "#f97316",
  "In Progress": "#0ea5e9",
  Closed: "#8b5cf6",
};

const IncidentStatusChart = () => {
  const { incidents } = useIncidents();

  // Calculate counts by status
  const statusCounts = incidents.reduce(
    (acc, incident) => {
      acc[incident.status] = (acc[incident.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  // Format data for chart
  const data = Object.entries(statusCounts).map(([name, value]) => ({
    name,
    value,
  }));

  // Define chart configuration
  const chartConfig = {
    Open: {
      label: "Open",
      color: STATUS_COLORS.Open,
    },
    "In Progress": {
      label: "In Progress",
      color: STATUS_COLORS["In Progress"],
    },
    Closed: {
      label: "Closed",
      color: STATUS_COLORS.Closed,
    },
  };

  const renderEmptyState = () => (
    <div className="h-[200px] flex items-center justify-center text-gray-500">
      No incident data available
    </div>
  );

  if (data.length === 0) return renderEmptyState();

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Incident Status Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ChartContainer
            config={chartConfig}
            className="h-full w-full"
          >
            <PieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={STATUS_COLORS[entry.name as keyof typeof STATUS_COLORS]} 
                  />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent />} />
            </PieChart>
          </ChartContainer>
        </div>
        <div className="flex justify-center mt-2 space-x-4">
          {Object.entries(STATUS_COLORS).map(([status, color]) => (
            <div key={status} className="flex items-center">
              <div
                className="w-3 h-3 mr-2 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="text-xs">{status}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default IncidentStatusChart;
