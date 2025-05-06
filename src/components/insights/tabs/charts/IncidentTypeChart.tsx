
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import BarChartComponent from '../../charts/BarChartComponent';

interface IncidentTypeChartProps {
  data: Array<{name: string, value: number}>;
}

const IncidentTypeChart: React.FC<IncidentTypeChartProps> = ({ data }) => {
  return (
    <div className="h-[400px] w-full">
      <Card className="h-full">
        <CardHeader className="flex flex-col items-start">
          <CardTitle className="text-left">Incidents by Type</CardTitle>
          <CardDescription className="text-left">
            Compare occurrence of incidents, near misses, and unsafe conditions
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[calc(100%-90px)]">
          {data.length > 0 ? (
            <BarChartComponent 
              title="" 
              description=""
              data={data}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              No data available for the selected filters
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default IncidentTypeChart;
