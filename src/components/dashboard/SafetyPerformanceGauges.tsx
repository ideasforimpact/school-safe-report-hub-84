import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

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
  // Calculate percentages
  const employeeComplianceRate = stats.totalEmployees > 0 
    ? Math.round((stats.employeesVerified / stats.totalEmployees) * 100) 
    : 0;

  const vehicleComplianceRate = stats.totalVehicles > 0 
    ? Math.round((stats.vehiclesWithDocuments / stats.totalVehicles) * 100) 
    : 0;

  // Calculate overall safety score
  const safetyScore = Math.round(
    (employeeComplianceRate * 0.4) + 
    (vehicleComplianceRate * 0.3) + 
    ((stats.openIncidents <= 5 ? 100 - (stats.openIncidents * 10) : 50) * 0.3)
  );

  // Calculate incident severity (mock data based on open incidents)
  const incidentSeverityScore = stats.openIncidents <= 2 ? 95 : 
                               stats.openIncidents <= 5 ? 75 : 
                               stats.openIncidents <= 10 ? 50 : 25;

  const createGaugeData = (percentage: number, color: string) => [
    { name: 'Completed', value: percentage, color: color },
    { name: 'Remaining', value: 100 - percentage, color: '#e5e7eb' }
  ];

  const getColorByScore = (score: number) => {
    if (score >= 90) return '#10b981'; // green
    if (score >= 70) return '#f59e0b'; // yellow
    if (score >= 50) return '#f97316'; // orange
    return '#ef4444'; // red
  };

  const gauges = [
    {
      title: 'Overall Safety Score',
      value: safetyScore,
      data: createGaugeData(safetyScore, getColorByScore(safetyScore)),
      description: 'Comprehensive safety performance'
    },
    {
      title: 'Employee Compliance',
      value: employeeComplianceRate,
      data: createGaugeData(employeeComplianceRate, getColorByScore(employeeComplianceRate)),
      description: `${stats.employeesVerified}/${stats.totalEmployees} verified`
    },
    {
      title: 'Vehicle Compliance',
      value: vehicleComplianceRate,
      data: createGaugeData(vehicleComplianceRate, getColorByScore(vehicleComplianceRate)),
      description: `${stats.vehiclesWithDocuments}/${stats.totalVehicles} compliant`
    },
    {
      title: 'Incident Management',
      value: incidentSeverityScore,
      data: createGaugeData(incidentSeverityScore, getColorByScore(incidentSeverityScore)),
      description: `${stats.openIncidents} open incidents`
    }
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white p-2 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium">{`${data.payload.name}: ${data.value}%`}</p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Safety Performance Gauges</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="text-center space-y-4 animate-pulse">
                <div className="h-32 w-32 bg-gray-200 rounded-full mx-auto"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mx-auto"></div>
                </div>
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
        <CardTitle className="text-lg font-semibold text-gray-900">Safety Performance Gauges</CardTitle>
        <p className="text-sm text-gray-600">Real-time safety metrics and compliance tracking</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {gauges.map((gauge, index) => (
            <div key={index} className="text-center space-y-4">
              <div className="relative">
                <ResponsiveContainer width="100%" height={120}>
                  <PieChart>
                    <Pie
                      data={gauge.data}
                      cx="50%"
                      cy="50%"
                      startAngle={90}
                      endAngle={-270}
                      innerRadius={30}
                      outerRadius={50}
                      dataKey="value"
                    >
                      {gauge.data.map((entry, entryIndex) => (
                        <Cell key={`cell-${entryIndex}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${
                      gauge.value >= 90 ? 'text-green-600' : 
                      gauge.value >= 70 ? 'text-yellow-600' : 
                      gauge.value >= 50 ? 'text-orange-600' : 'text-red-600'
                    }`}>
                      {gauge.value}%
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-medium text-gray-900">{gauge.title}</h4>
                <p className="text-xs text-gray-600">{gauge.description}</p>
                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  gauge.value >= 90 ? 'bg-green-100 text-green-800' : 
                  gauge.value >= 70 ? 'bg-yellow-100 text-yellow-800' : 
                  gauge.value >= 50 ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800'
                }`}>
                  {gauge.value >= 90 ? 'Excellent' : 
                   gauge.value >= 70 ? 'Good' : 
                   gauge.value >= 50 ? 'Fair' : 'Needs Attention'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default SafetyPerformanceGauges;