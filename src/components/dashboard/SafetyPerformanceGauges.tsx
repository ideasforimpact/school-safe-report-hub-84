import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Shield, Target, Clock, AlertCircle } from 'lucide-react';

interface SafetyPerformanceGaugesProps {
  stats: {
    openIncidents: number;
    totalEmployees: number;
    employeesVerified: number;
    totalVehicles: number;
    vehiclesWithDocuments: number;
    incidentsLastMonth: number;
  };
  loading: boolean;
}

const SafetyPerformanceGauges = ({ stats, loading }: SafetyPerformanceGaugesProps) => {
  const employeeComplianceRate = stats.totalEmployees > 0 
    ? Math.round((stats.employeesVerified / stats.totalEmployees) * 100) 
    : 0;

  const vehicleComplianceRate = stats.totalVehicles > 0 
    ? Math.round((stats.vehiclesWithDocuments / stats.totalVehicles) * 100) 
    : 0;

  // Calculate safety score based on multiple factors
  const safetyScore = Math.round((
    (stats.openIncidents === 0 ? 100 : Math.max(0, 100 - (stats.openIncidents * 20))) * 0.4 +
    employeeComplianceRate * 0.3 +
    vehicleComplianceRate * 0.3
  ));

  // Response time metric (mock for demonstration)
  const responseTimeScore = 85;

  const gauges = [
    {
      title: 'Overall Safety Score',
      value: safetyScore,
      max: 100,
      unit: '%',
      icon: Shield,
      description: 'Comprehensive safety performance',
      color: safetyScore >= 90 ? 'success' : safetyScore >= 70 ? 'warning' : 'destructive'
    },
    {
      title: 'Employee Compliance',
      value: employeeComplianceRate,
      max: 100,
      unit: '%',
      icon: Target,
      description: `${stats.employeesVerified}/${stats.totalEmployees} verified`,
      color: employeeComplianceRate >= 90 ? 'success' : employeeComplianceRate >= 70 ? 'warning' : 'destructive'
    },
    {
      title: 'Vehicle Compliance',
      value: vehicleComplianceRate,
      max: 100,
      unit: '%',
      icon: Target,
      description: `${stats.vehiclesWithDocuments}/${stats.totalVehicles} compliant`,
      color: vehicleComplianceRate >= 90 ? 'success' : vehicleComplianceRate >= 70 ? 'warning' : 'destructive'
    },
    {
      title: 'Response Time',
      value: responseTimeScore,
      max: 100,
      unit: '%',
      icon: Clock,
      description: 'Average incident response efficiency',
      color: responseTimeScore >= 90 ? 'success' : responseTimeScore >= 70 ? 'warning' : 'destructive'
    }
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'success':
        return {
          progress: 'bg-success',
          text: 'text-success',
          border: 'border-success/20',
          bg: 'bg-success/5'
        };
      case 'warning':
        return {
          progress: 'bg-warning',
          text: 'text-warning',
          border: 'border-warning/20',
          bg: 'bg-warning/5'
        };
      case 'destructive':
        return {
          progress: 'bg-destructive',
          text: 'text-destructive',
          border: 'border-destructive/20',
          bg: 'bg-destructive/5'
        };
      default:
        return {
          progress: 'bg-primary',
          text: 'text-primary',
          border: 'border-primary/20',
          bg: 'bg-primary/5'
        };
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 bg-muted rounded w-1/3 animate-pulse"></div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="space-y-4 animate-pulse">
                <div className="h-4 bg-muted rounded w-2/3"></div>
                <div className="relative">
                  <div className="h-32 w-32 bg-muted rounded-full mx-auto"></div>
                </div>
                <div className="h-3 bg-muted rounded w-1/2 mx-auto"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Safety Performance Metrics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {gauges.map((gauge, index) => {
            const Icon = gauge.icon;
            const colors = getColorClasses(gauge.color);
            
            return (
              <div key={index} className={`p-4 rounded-lg border ${colors.border} ${colors.bg}`}>
                <div className="text-center space-y-4">
                  <div className="flex items-center justify-center gap-2">
                    <Icon className={`h-4 w-4 ${colors.text}`} />
                    <h3 className="text-sm font-medium text-foreground">{gauge.title}</h3>
                  </div>
                  
                  {/* Circular Progress */}
                  <div className="relative inline-flex items-center justify-center">
                    <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                      {/* Background circle */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="8"
                        className="text-muted/20"
                      />
                      {/* Progress circle */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={`${(gauge.value / gauge.max) * 251.2} 251.2`}
                        className={colors.text}
                        style={{
                          transition: 'stroke-dasharray 1s ease-in-out'
                        }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className={`text-xl font-bold ${colors.text}`}>
                        {gauge.value}{gauge.unit}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-xs text-muted-foreground text-center">
                    {gauge.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default SafetyPerformanceGauges;