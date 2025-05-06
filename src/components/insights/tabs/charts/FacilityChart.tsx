
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import CategoryChart from '../../charts/category-chart';

interface FacilityChartProps {
  data: Array<{name: string, value: number}>;
  colors: string[];
}

const FacilityChart: React.FC<FacilityChartProps> = ({ data, colors }) => {
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col items-start">
        <CardTitle className="text-left">Incidents by Facility</CardTitle>
        <CardDescription className="text-left">
          Distribution of incidents across different facilities
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[400px]">
        <CategoryChart 
          data={data} 
          colors={colors}
          title=""
        />
      </CardContent>
    </Card>
  );
};

export default FacilityChart;
