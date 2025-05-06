import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { InfoIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { useTimeSeriesMetrics } from '@/hooks/insights/useTimeSeriesMetrics';
interface TimeSeriesAnalysisProps {
  data: Array<{
    month: string;
    count: number;
  }>;
  title?: string;
  description?: string;
}
const TimeSeriesAnalysis: React.FC<TimeSeriesAnalysisProps> = ({
  data,
  title = "Incidents Over Time",
  description = "Monthly trend of reported incidents with trend analysis"
}) => {
  const metrics = useTimeSeriesMetrics(data);

  // Calculate average value for reference line
  const averageValue = useMemo(() => {
    if (data.length === 0) return 0;
    const sum = data.reduce((acc, item) => acc + item.count, 0);
    return Math.round(sum / data.length);
  }, [data]);
  return <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-left">{title}</CardTitle>
            <CardDescription className="max-w-md">{description}</CardDescription>
          </div>
          
          {data.length > 1 && <Badge variant={metrics.isIncreasing ? 'destructive' : 'outline'} className="flex items-center gap-1 ml-2">
              {metrics.isIncreasing ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {metrics.percentageChange}% {metrics.isIncreasing ? 'Increase' : 'Decrease'}
            </Badge>}
        </div>
      </CardHeader>
      
      <CardContent className="h-64">
        {data.length > 0 ? <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={value => [`${value} incidents`, 'Count']} labelFormatter={label => `Month: ${label}`} />
              <Legend />
              <ReferenceLine y={averageValue} stroke="#ff7300" strokeDasharray="3 3" label={{
            value: `Avg: ${averageValue}`,
            position: 'insideBottomRight'
          }} />
              <Line type="monotone" name="Incident Count" dataKey="count" stroke="#9b87f5" activeDot={{
            r: 8
          }} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer> : <div className="flex items-center justify-center h-full text-gray-500">
            No data available for the selected filters
          </div>}
      </CardContent>
      
      <CardFooter className="text-xs text-muted-foreground border-t pt-4">
        <div className="flex items-center">
          <InfoIcon className="h-3 w-3 mr-1" />
          <span>
            {data.length > 1 ? `Change: ${metrics.currentPeriodCount} vs ${metrics.previousPeriodCount} incidents (previous period)` : 'Insufficient data for trend analysis'}
          </span>
        </div>
      </CardFooter>
    </Card>;
};
export default TimeSeriesAnalysis;