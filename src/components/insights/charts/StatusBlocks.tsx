import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
interface StatusBlocksProps {
  data: Array<{
    name: string;
    value: number;
  }>;
}
const StatusBlocks: React.FC<StatusBlocksProps> = ({
  data
}) => {
  // Calculate total for percentage
  const total = useMemo(() => data.reduce((acc, entry) => acc + entry.value, 0), [data]);

  // Status color mapping
  const statusColors: Record<string, string> = {
    'Open': '#f97316',
    // Orange
    'In Progress': '#0ea5e9',
    // Blue
    'Closed': '#8b5cf6' // Purple
  };
  return <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-left">Incident Status Overview</CardTitle>
        <CardDescription className="text-left">
          Current status distribution of all reported incidents
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {data.map(item => {
          const percentage = total > 0 ? (item.value / total * 100).toFixed(0) : '0';
          const color = statusColors[item.name] || '#94a3b8'; // Default color if status not found

          return <div key={item.name} className="relative rounded-lg p-6 shadow-sm transition-all hover:shadow-md border" style={{
            borderColor: color
          }}>
                  <div className="absolute top-0 left-0 h-1 w-full" style={{
              backgroundColor: color
            }}></div>
                  <div className="text-3xl font-bold mb-2">{item.value}</div>
                  <div className="flex justify-between items-center">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm font-medium px-2 py-1 rounded-full" style={{
                backgroundColor: `${color}20`,
                color: color
              }}>
                      {percentage}%
                    </div>
                  </div>
                </div>;
        })}
          </div> : <div className="flex items-center justify-center h-full text-gray-500 py-12">
            No data available for the selected filters
          </div>}
      </CardContent>
    </Card>;
};
export default StatusBlocks;