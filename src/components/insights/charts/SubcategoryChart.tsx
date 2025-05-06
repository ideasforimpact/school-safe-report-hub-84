import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer } from '@/components/ui/chart';
import { SubcategoryBarChart, NoDataMessage, processChartData, calculateTotal } from './subcategory';
interface SubcategoryChartProps {
  data: Array<{
    name: string;
    value: number;
  }>;
  colors: string[];
}
const SubcategoryChart: React.FC<SubcategoryChartProps> = ({
  data,
  colors
}) => {
  // Process data for display
  const chartData = useMemo(() => processChartData(data), [data]);

  // Calculate total for percentages
  const total = useMemo(() => calculateTotal(data), [data]);
  return <Card className="w-full h-full shadow-sm">
      <CardHeader>
        <CardTitle className="text-left">Top 10 Subcategories</CardTitle>
        <CardDescription className="text-left">Most common specific types of incidents reported</CardDescription>
      </CardHeader>
      <CardContent className="h-[calc(100%-90px)]">
        {chartData.length > 0 ? <ChartContainer config={{}} className="w-full h-full animate-fade-in">
            <SubcategoryBarChart chartData={chartData} total={total} colors={colors} />
          </ChartContainer> : <NoDataMessage />}
      </CardContent>
    </Card>;
};
export default SubcategoryChart;