import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { MonthlyTrends } from '@/hooks/useNewInsightsData';

interface MonthlyTrendsCardProps {
  trends: MonthlyTrends;
}

const MonthlyTrendsCard: React.FC<MonthlyTrendsCardProps> = ({ trends }) => {
  const getTrendIcon = () => {
    switch (trends.trend) {
      case 'increase':
        return <TrendingUp className="h-4 w-4 text-destructive" />;
      case 'decrease':
        return <TrendingDown className="h-4 w-4 text-primary" />;
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTrendColor = () => {
    switch (trends.trend) {
      case 'increase':
        return 'text-destructive';
      case 'decrease':
        return 'text-primary';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Monthly Trends</CardTitle>
        {getTrendIcon()}
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="text-2xl font-bold">
            {trends.currentMonth.count}
          </div>
          <p className="text-xs text-muted-foreground">
            {trends.currentMonth.month}
          </p>
          <div className="flex items-center space-x-2 text-xs">
            <span className={getTrendColor()}>
              {trends.percentageChange > 0 ? '+' : ''}{trends.percentageChange.toFixed(1)}%
            </span>
            <span className="text-muted-foreground">vs {trends.previousMonth.month}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Previous: {trends.previousMonth.count} incidents
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default MonthlyTrendsCard;