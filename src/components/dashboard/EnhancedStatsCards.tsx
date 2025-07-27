import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, FileCheck, Users, Truck, Calendar, TrendingUp, TrendingDown, CheckCircle } from 'lucide-react';

interface EnhancedStatsCardsProps {
  stats: {
    openIncidents: number;
    activeAssessments: number;
    totalEmployees: number;
    employeesVerified: number;
    totalVehicles: number;
    vehiclesWithDocuments: number;
    incidentsLastMonth: number;
    incidentsLast6Months: number;
  };
  loading: boolean;
}

const EnhancedStatsCards = ({ stats, loading }: EnhancedStatsCardsProps) => {
  const employeeVerificationPercentage = stats.totalEmployees > 0 
    ? Math.round((stats.employeesVerified / stats.totalEmployees) * 100) 
    : 0;

  const vehicleDocumentationPercentage = stats.totalVehicles > 0 
    ? Math.round((stats.vehiclesWithDocuments / stats.totalVehicles) * 100) 
    : 0;

  // Calculate trend indicators
  const monthlyAvg = Math.round(stats.incidentsLast6Months / 6);
  const incidentTrend = stats.incidentsLastMonth <= monthlyAvg ? 'down' : 'up';
  const trendPercentage = monthlyAvg > 0 ? Math.abs(Math.round(((stats.incidentsLastMonth - monthlyAvg) / monthlyAvg) * 100)) : 0;

  const statsCards = [
    {
      title: 'Critical Incidents',
      value: stats.openIncidents,
      subtitle: `Total open incidents requiring attention`,
      progress: null,
      icon: AlertTriangle,
      variant: stats.openIncidents === 0 ? 'success' : stats.openIncidents <= 3 ? 'warning' : 'destructive',
      trend: null,
      gradient: 'from-destructive/10 to-destructive/5'
    },
    {
      title: 'Active Assessments',
      value: stats.activeAssessments,
      subtitle: `Safety assessments in progress`,
      progress: null,
      icon: FileCheck,
      variant: 'primary',
      trend: null,
      gradient: 'from-primary/10 to-primary/5'
    },
    {
      title: 'Employee Verification',
      value: `${employeeVerificationPercentage}%`,
      subtitle: `${stats.employeesVerified} of ${stats.totalEmployees} verified`,
      progress: employeeVerificationPercentage,
      icon: Users,
      variant: employeeVerificationPercentage >= 90 ? 'success' : employeeVerificationPercentage >= 70 ? 'warning' : 'destructive',
      trend: null,
      gradient: 'from-success/10 to-success/5'
    },
    {
      title: 'Vehicle Documentation',
      value: `${vehicleDocumentationPercentage}%`,
      subtitle: `${stats.vehiclesWithDocuments} of ${stats.totalVehicles} compliant`,
      progress: vehicleDocumentationPercentage,
      icon: Truck,
      variant: vehicleDocumentationPercentage >= 90 ? 'success' : vehicleDocumentationPercentage >= 70 ? 'warning' : 'destructive',
      trend: null,
      gradient: 'from-secondary/10 to-secondary/5'
    },
    {
      title: 'Monthly Incidents',
      value: stats.incidentsLastMonth,
      subtitle: `Incidents reported this month`,
      progress: null,
      icon: Calendar,
      variant: 'warning',
      trend: { direction: incidentTrend, percentage: trendPercentage },
      gradient: 'from-warning/10 to-warning/5'
    },
    {
      title: '6-Month Total',
      value: stats.incidentsLast6Months,
      subtitle: `Total incidents last 6 months`,
      progress: null,
      icon: TrendingUp,
      variant: 'info',
      trend: null,
      gradient: 'from-info/10 to-info/5'
    }
  ];

  const getVariantStyles = (variant: string) => {
    switch (variant) {
      case 'success':
        return {
          border: 'border-l-success',
          iconBg: 'bg-success/10',
          iconColor: 'text-success',
          valueColor: 'text-success',
          progressColor: 'bg-success'
        };
      case 'warning':
        return {
          border: 'border-l-warning',
          iconBg: 'bg-warning/10',
          iconColor: 'text-warning',
          valueColor: 'text-warning',
          progressColor: 'bg-warning'
        };
      case 'destructive':
        return {
          border: 'border-l-destructive',
          iconBg: 'bg-destructive/10',
          iconColor: 'text-destructive',
          valueColor: 'text-destructive',
          progressColor: 'bg-destructive'
        };
      case 'primary':
        return {
          border: 'border-l-primary',
          iconBg: 'bg-primary/10',
          iconColor: 'text-primary',
          valueColor: 'text-primary',
          progressColor: 'bg-primary'
        };
      default:
        return {
          border: 'border-l-secondary',
          iconBg: 'bg-secondary/10',
          iconColor: 'text-secondary-foreground',
          valueColor: 'text-foreground',
          progressColor: 'bg-secondary'
        };
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-muted rounded w-1/2"></div>
              <div className="h-8 w-8 bg-muted rounded-lg"></div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="h-8 bg-muted rounded w-1/3"></div>
              <div className="h-3 bg-muted rounded w-2/3"></div>
              <div className="h-2 bg-muted rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {statsCards.map((card, index) => {
        const Icon = card.icon;
        const styles = getVariantStyles(card.variant);
        const TrendIcon = card.trend?.direction === 'down' ? TrendingDown : TrendingUp;
        
        return (
          <Card 
            key={index} 
            className={`${styles.border} border-l-4 hover:shadow-lg hover:scale-[1.02] transition-all duration-200 bg-gradient-to-br ${card.gradient}`}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${styles.iconBg}`}>
                <Icon className={`h-5 w-5 ${styles.iconColor}`} />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className={`text-3xl font-bold ${styles.valueColor}`}>
                  {card.value}
                </div>
                {card.trend && (
                  <div className={`flex items-center gap-1 ${card.trend.direction === 'down' ? 'text-success' : 'text-destructive'}`}>
                    <TrendIcon className="h-4 w-4" />
                    <span className="text-xs font-medium">{card.trend.percentage}%</span>
                  </div>
                )}
              </div>
              
              <p className="text-xs text-muted-foreground">
                {card.subtitle}
              </p>
              
              {card.progress !== null && (
                <div className="space-y-1">
                  <Progress 
                    value={card.progress} 
                    className="h-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Progress</span>
                    <span>{card.progress}%</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default EnhancedStatsCards;