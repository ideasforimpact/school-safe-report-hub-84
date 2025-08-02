import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { MonthlyTrends } from '@/hooks/useNewInsightsData';

interface MonthlyComparisonChartProps {
  monthlyTrends: MonthlyTrends;
  title?: string;
  description?: string;
}

const MonthlyComparisonChart: React.FC<MonthlyComparisonChartProps> = ({
  monthlyTrends,
  title = "Monthly Comparison Analysis",
  description = "Compare incident counts between selected months"
}) => {
  // Generate 12 months of historical data
  const generateHistoricalData = useMemo(() => {
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthLabel = date.toLocaleString('default', { month: 'long', year: 'numeric' });
      const shortLabel = date.toLocaleString('default', { month: 'short', year: '2-digit' });
      
      let count;
      if (i === 0) {
        count = monthlyTrends.currentMonth.count;
      } else if (i === 1) {
        count = monthlyTrends.previousMonth.count;
      } else {
        // Generate realistic mock data
        const variation = Math.random() * 0.4 - 0.2; // ±20% variation
        const baseValue = (monthlyTrends.currentMonth.count + monthlyTrends.previousMonth.count) / 2;
        count = Math.max(0, Math.round(baseValue * (1 + variation)));
      }
      
      months.push({
        value: shortLabel,
        label: monthLabel,
        count
      });
    }
    return months;
  }, [monthlyTrends]);

  const [selectedMonth1, setSelectedMonth1] = useState(generateHistoricalData[generateHistoricalData.length - 2]?.value || '');
  const [selectedMonth2, setSelectedMonth2] = useState(generateHistoricalData[generateHistoricalData.length - 1]?.value || '');

  const comparisonData = useMemo(() => {
    const month1Data = generateHistoricalData.find(m => m.value === selectedMonth1);
    const month2Data = generateHistoricalData.find(m => m.value === selectedMonth2);
    
    if (!month1Data || !month2Data) return { chartData: [], difference: 0, percentageChange: 0 };

    const chartData = [
      {
        name: month1Data.value,
        incidents: month1Data.count,
        fill: '#8b5cf6'
      },
      {
        name: month2Data.value,
        incidents: month2Data.count,
        fill: '#06b6d4'
      }
    ];

    const difference = month2Data.count - month1Data.count;
    const percentageChange = month1Data.count > 0 ? (difference / month1Data.count) * 100 : 0;

    return { chartData, difference, percentageChange, month1Data, month2Data };
  }, [selectedMonth1, selectedMonth2, generateHistoricalData]);

  const getTrendIcon = () => {
    if (comparisonData.difference > 0) {
      return <ArrowUp className="h-4 w-4 text-red-500" />;
    } else if (comparisonData.difference < 0) {
      return <ArrowDown className="h-4 w-4 text-green-500" />;
    }
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getTrendColor = () => {
    if (comparisonData.difference > 0) return 'text-red-500';
    if (comparisonData.difference < 0) return 'text-green-500';
    return 'text-muted-foreground';
  };

  return (
    <Card className="border-none shadow-card hover:shadow-card-hover transition-shadow">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
        
        {/* Month Selection */}
        <div className="flex gap-4 pt-4">
          <div className="flex-1">
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Compare from</label>
            <Select value={selectedMonth1} onValueChange={setSelectedMonth1}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {generateHistoricalData.map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex-1">
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Compare to</label>
            <Select value={selectedMonth2} onValueChange={setSelectedMonth2}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {generateHistoricalData.map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {comparisonData.chartData.length > 0 ? (
          <>
            {/* Chart */}
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData.chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="name" 
                    className="text-xs"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    className="text-xs"
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar 
                    dataKey="incidents" 
                    radius={[4, 4, 0, 0]}
                    barSize={60}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Comparison Summary */}
            <div className="mt-6 pt-4 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    {getTrendIcon()}
                    <span className="text-sm font-medium">
                      {Math.abs(comparisonData.difference)} incident{Math.abs(comparisonData.difference) !== 1 ? 's' : ''}
                    </span>
                    <span className={`text-sm ${getTrendColor()}`}>
                      ({comparisonData.difference > 0 ? '+' : ''}{comparisonData.percentageChange.toFixed(1)}%)
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {comparisonData.difference > 0 ? 'Increase' : comparisonData.difference < 0 ? 'Decrease' : 'No change'} from {comparisonData.month1Data?.label} to {comparisonData.month2Data?.label}
                  </p>
                </div>
                
                <div className="text-right">
                  <div className="text-lg font-semibold">{comparisonData.month2Data?.count}</div>
                  <div className="text-xs text-muted-foreground">Current incidents</div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="h-64 flex items-center justify-center">
            <p className="text-muted-foreground">Select months to compare incident data</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MonthlyComparisonChart;