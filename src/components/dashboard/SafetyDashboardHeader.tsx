import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Shield, Phone, Calendar, TrendingUp, TrendingDown } from 'lucide-react';

interface SafetyDashboardHeaderProps {
  stats: {
    openIncidents: number;
    incidentsLastMonth: number;
    incidentsLast6Months: number;
  };
  schoolName: string;
  loading: boolean;
}

const SafetyDashboardHeader = ({ stats, schoolName, loading }: SafetyDashboardHeaderProps) => {
  // Calculate safety status based on open incidents
  const getSafetyStatus = () => {
    if (stats.openIncidents === 0) return { level: 'SAFE', color: 'bg-success text-success-foreground', icon: Shield };
    if (stats.openIncidents <= 3) return { level: 'CAUTION', color: 'bg-warning text-warning-foreground', icon: AlertTriangle };
    return { level: 'ALERT', color: 'bg-destructive text-destructive-foreground', icon: AlertTriangle };
  };

  // Calculate days since last incident (mock for now)
  const daysSinceLastIncident = 12;
  
  // Calculate trend from last month vs 6 months avg
  const monthlyAvg = Math.round(stats.incidentsLast6Months / 6);
  const trend = stats.incidentsLastMonth <= monthlyAvg ? 'down' : 'up';
  const trendPercentage = monthlyAvg > 0 ? Math.abs(Math.round(((stats.incidentsLastMonth - monthlyAvg) / monthlyAvg) * 100)) : 0;

  const safetyStatus = getSafetyStatus();
  const StatusIcon = safetyStatus.icon;
  const TrendIcon = trend === 'down' ? TrendingDown : TrendingUp;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-muted rounded w-1/3"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-6 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-muted rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header with Safety Status */}
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center gap-3">
          <h1 className="text-3xl font-bold text-foreground">
            {schoolName} Safety Management
          </h1>
          <div className={`px-3 py-1 rounded-full ${safetyStatus.color} flex items-center gap-2 animate-pulse`}>
            <StatusIcon className="h-4 w-4" />
            <span className="text-sm font-medium">{safetyStatus.level}</span>
          </div>
        </div>
        <p className="text-muted-foreground">
          Comprehensive safety monitoring and incident management dashboard
        </p>
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Current Status */}
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Incidents</p>
                <p className="text-2xl font-bold text-foreground">{stats.openIncidents}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-primary opacity-80" />
            </div>
          </CardContent>
        </Card>

        {/* Safety Streak */}
        <Card className="border-l-4 border-l-success">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Safety Streak</p>
                <p className="text-2xl font-bold text-success">{daysSinceLastIncident} days</p>
              </div>
              <Calendar className="h-8 w-8 text-success opacity-80" />
            </div>
          </CardContent>
        </Card>

        {/* Monthly Trend */}
        <Card className="border-l-4 border-l-warning">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Monthly Trend</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold text-foreground">{stats.incidentsLastMonth}</p>
                  <div className={`flex items-center ${trend === 'down' ? 'text-success' : 'text-destructive'}`}>
                    <TrendIcon className="h-4 w-4" />
                    <span className="text-xs font-medium">{trendPercentage}%</span>
                  </div>
                </div>
              </div>
              <TrendIcon className={`h-8 w-8 opacity-80 ${trend === 'down' ? 'text-success' : 'text-destructive'}`} />
            </div>
          </CardContent>
        </Card>

        {/* Emergency Actions */}
        <Card className="border-l-4 border-l-destructive">
          <CardContent className="p-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Emergency Actions</p>
              <Button 
                size="sm" 
                variant="destructive" 
                className="w-full hover:scale-105 transition-transform"
              >
                <Phone className="h-4 w-4 mr-2" />
                Report Incident
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SafetyDashboardHeader;