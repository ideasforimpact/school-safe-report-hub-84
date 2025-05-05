
import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  LineChart, Line, CartesianGrid, XAxis, YAxis, 
  Tooltip, ResponsiveContainer, ReferenceLine, Area,
  AreaChart, Legend
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { InfoIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface TimeSeriesAnalysisProps {
  data: Array<{month: string, count: number}>;
  title?: string;
  description?: string;
}

const TimeSeriesAnalysis: React.FC<TimeSeriesAnalysisProps> = ({ 
  data, 
  title = "Incidents Over Time",
  description = "Monthly trend of reported incidents with trend analysis"
}) => {
  const [viewType, setViewType] = useState<'line' | 'area'>('line');
  
  // Calculate trend information
  const trendAnalysis = useMemo(() => {
    if (data.length < 2) return { trend: 'neutral', percentage: 0 };
    
    // Take the first and last values for basic trend calculation
    const firstValue = data[0].count;
    const lastValue = data[data.length - 1].count;
    
    // Calculate percentage change
    let percentChange = 0;
    if (firstValue > 0) {
      percentChange = ((lastValue - firstValue) / firstValue) * 100;
    }
    
    // Determine trend direction
    const trend = percentChange > 0 ? 'up' : percentChange < 0 ? 'down' : 'neutral';
    
    return { 
      trend, 
      percentage: Math.abs(Math.round(percentChange)) 
    };
  }, [data]);
  
  // Calculate average value for reference line
  const averageValue = useMemo(() => {
    if (data.length === 0) return 0;
    const sum = data.reduce((acc, item) => acc + item.count, 0);
    return Math.round(sum / data.length);
  }, [data]);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          
          {trendAnalysis.trend !== 'neutral' && (
            <Badge 
              variant={trendAnalysis.trend === 'down' ? 'outline' : 'destructive'}
              className="flex items-center gap-1"
            >
              {trendAnalysis.trend === 'up' ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {trendAnalysis.percentage}% {trendAnalysis.trend === 'up' ? 'Increase' : 'Decrease'}
            </Badge>
          )}
        </div>
        
        <Tabs defaultValue="line" className="w-full" onValueChange={(value) => setViewType(value as 'line' | 'area')}>
          <TabsList className="grid w-[200px] grid-cols-2">
            <TabsTrigger value="line">Line</TabsTrigger>
            <TabsTrigger value="area">Area</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      
      <CardContent className="h-64">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            {viewType === 'line' ? (
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [`${value} incidents`, 'Count']}
                  labelFormatter={(label) => `Month: ${label}`}
                />
                <Legend />
                <ReferenceLine 
                  y={averageValue} 
                  stroke="#ff7300" 
                  strokeDasharray="3 3" 
                  label={{ 
                    value: `Avg: ${averageValue}`, 
                    position: 'insideBottomRight' 
                  }} 
                />
                <Line
                  type="monotone"
                  name="Incident Count"
                  dataKey="count"
                  stroke="#3b82f6"
                  activeDot={{ r: 8 }}
                  strokeWidth={2}
                />
              </LineChart>
            ) : (
              <AreaChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [`${value} incidents`, 'Count']}
                  labelFormatter={(label) => `Month: ${label}`}
                />
                <Legend />
                <ReferenceLine 
                  y={averageValue} 
                  stroke="#ff7300" 
                  strokeDasharray="3 3" 
                  label={{ 
                    value: `Avg: ${averageValue}`, 
                    position: 'insideBottomRight' 
                  }} 
                />
                <Area
                  type="monotone"
                  name="Incident Count"
                  dataKey="count"
                  stroke="#3b82f6"
                  fill="#3b82f680"
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            No data available for the selected filters
          </div>
        )}
      </CardContent>
      
      <CardFooter className="text-xs text-muted-foreground border-t pt-4">
        <div className="flex items-center">
          <InfoIcon className="h-3 w-3 mr-1" />
          <span>Trend calculated based on first and last data points</span>
        </div>
      </CardFooter>
    </Card>
  );
};

export default TimeSeriesAnalysis;
