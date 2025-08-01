import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus, Calendar } from 'lucide-react';
import { MonthlyTrendMetrics } from '@/utils/insights/businessMetrics';

interface MonthlyTrendCardProps {
  metrics: MonthlyTrendMetrics;
}

const MonthlyTrendCard: React.FC<MonthlyTrendCardProps> = ({ metrics }) => {
  const getTrendIcon = () => {
    switch (metrics.trend) {
      case 'increasing':
        return <TrendingUp className="h-4 w-4 text-destructive" />;
      case 'decreasing':
        return <TrendingDown className="h-4 w-4 text-success" />;
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTrendColor = () => {
    switch (metrics.trend) {
      case 'increasing':
        return 'text-destructive';
      case 'decreasing':
        return 'text-success';
      default:
        return 'text-muted-foreground';
    }
  };

  const formatPercentage = (value: number) => {
    const absValue = Math.abs(value);
    const sign = value > 0 ? '+' : value < 0 ? '-' : '';
    return `${sign}${absValue.toFixed(1)}%`;
  };

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Monthly Trends</CardTitle>
        <Calendar className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            {getTrendIcon()}
            <span className={`text-2xl font-bold ${getTrendColor()}`}>
              {metrics.currentMonth.count}
            </span>
            <span className="text-sm text-muted-foreground">incidents</span>
          </div>
          
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">This month:</span>
              <span className="font-medium">{metrics.currentMonth.count}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Last month:</span>
              <span className="font-medium">{metrics.previousMonth.count}</span>
            </div>
          </div>
          
          <div className={`flex items-center space-x-1 ${getTrendColor()}`}>
            <span className="text-sm font-medium">
              {formatPercentage(metrics.percentageChange)}
            </span>
            <span className="text-xs text-muted-foreground">vs last month</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MonthlyTrendCard;