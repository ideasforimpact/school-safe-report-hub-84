
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import CategoryChart from '../../charts/category-chart';

interface AssigneeChartProps {
  data: Array<{name: string, value: number}>;
  colors: string[];
}

const AssigneeChart: React.FC<AssigneeChartProps> = ({ data, colors }) => {
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col items-start">
        <CardTitle className="text-left">Incident Ownership</CardTitle>
        <CardDescription className="text-left">
          Distribution of incidents by assigned owner
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[500px]">
        <CategoryChart 
          data={data} 
          colors={colors}
          title=""
        />
      </CardContent>
    </Card>
  );
};

export default AssigneeChart;
