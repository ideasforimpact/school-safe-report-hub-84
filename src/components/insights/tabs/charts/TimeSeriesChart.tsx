
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import TimeSeriesAnalysis from '../../charts/TimeSeriesAnalysis';

interface TimeSeriesChartProps {
  data: Array<{month: string, count: number}>;
}

const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({ data }) => {
  return (
    <div className="h-[400px]">
      <Card className="h-full">
        <CardHeader className="flex flex-col items-start">
          <CardTitle className="text-lg font-semibold text-left">Incidents Over Time</CardTitle>
          <CardDescription className="text-left">
            Monthly trend of incidents with statistical analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[calc(100%-90px)]">
          {data.length > 0 ? (
            <TimeSeriesAnalysis 
              data={data} 
              title=""
              description=""
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

export default TimeSeriesChart;
