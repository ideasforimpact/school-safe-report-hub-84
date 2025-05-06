
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import BarChartComponent from '../../charts/BarChartComponent';

interface LocationChartProps {
  data: Array<{name: string, value: number}>;
}

const LocationChart: React.FC<LocationChartProps> = ({ data }) => {
  return (
    <div className="h-[400px]">
      <Card className="h-full">
        <CardHeader className="flex flex-col items-start">
          <CardTitle className="text-left">Incident Location</CardTitle>
          <CardDescription className="text-left">
            Distribution of incidents by location
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[calc(100%-90px)]">
          {data.length > 0 ? (
            <BarChartComponent 
              title="" 
              description=""
              data={data}
              color="#0ea5e9"
              layout="vertical"
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

export default LocationChart;
