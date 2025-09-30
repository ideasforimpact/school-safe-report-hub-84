import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface SafetyPerformanceGaugesProps {
  stats: {
    openIncidents: number;
    openIncidentOlder7days?: number;
    totalEmployees: number;
    employeesVerified: number;
    totalVehicles: number;
    vehiclesVerified?: number;
    activeAssessments?: number;
    overdueAssessments?: number;
    incidentsLastMonth: number;
  };
  loading: boolean;
}

const SafetyPerformanceGauges = ({ stats, loading }: SafetyPerformanceGaugesProps) => {
  console.log('🔍 SafetyPerformanceGauges - Raw stats received at:', new Date().toISOString(), stats);
  console.log('🔍 SafetyPerformanceGauges - Key values:');
  console.log('  - stats.totalEmployees:', stats.totalEmployees);
  console.log('  - stats.employeesVerified:', stats.employeesVerified);
  console.log('  - stats.totalVehicles:', stats.totalVehicles);
  console.log('  - stats.vehiclesVerified:', stats.vehiclesVerified);
  console.log('  - stats.activeAssessments:', stats.activeAssessments);
  console.log('  - stats.openIncidents:', stats.openIncidents);

  // Calculate Employee Compliance score = 100 * (number of verified employees / number of active employees)
  const employeeComplianceScore = stats.totalEmployees > 0 
    ? Math.round(100 * (stats.employeesVerified / stats.totalEmployees)) 
    : 0;

  console.log('🔍 Employee Compliance Score Calculation:');
  console.log('  - Number of verified employees:', stats.employeesVerified);
  console.log('  - Number of active employees:', stats.totalEmployees);
  console.log('  - Calculation: 100 * (', stats.employeesVerified, '/', stats.totalEmployees, ') =', employeeComplianceScore);
  console.log('  - Final Employee Compliance Score:', employeeComplianceScore);

  // Calculate Vehicle Compliance score = 100 * (number of verified vehicles / number of vehicles)
  const vehicleComplianceScore = stats.totalVehicles > 0 
    ? Math.round(100 * ((stats.vehiclesVerified || 0) / stats.totalVehicles)) 
    : 0;

  console.log('🔍 Vehicle Compliance Score Calculation:');
  console.log('  - Number of verified vehicles:', stats.vehiclesVerified || 0);
  console.log('  - Number of vehicles:', stats.totalVehicles);
  console.log('  - Calculation: 100 * (', stats.vehiclesVerified || 0, '/', stats.totalVehicles, ') =', vehicleComplianceScore);
  console.log('  - Final Vehicle Compliance Score:', vehicleComplianceScore);

  // Calculate Incidents Score = max(100 - 20 * Open Incidents, 0)
  const incidentsScore = Math.max(100 - 20 * stats.openIncidentOlder7days, 0);

  console.log('🔍 Incidents Score Calculation:');
  console.log('  - Number of open incidents:', stats.openIncidents);
  console.log('  - Calculation: max(100 - 20 *', stats.openIncidents, ', 0) = max(', 100 - 20 * stats.openIncidents, ', 0) =', incidentsScore);
  console.log('  - Final Incidents Score:', incidentsScore);
  console.log('  - Number of open incidents older than 7 days:', stats.openIncidentOlder7days);
  

  // Calculate Assessment Activity Score (new formula)
  // CASE WHEN ActiveAssessments = 0 THEN 100
  //      WHEN OverdueAssessments = 0 THEN 100
  //      ELSE 100 * (OverdueAssessments / ActiveAssessments)
  const activeA = stats.activeAssessments || 0;
  const overdueA = stats.overdueAssessments || 0;
  const assessmentActivityScore = activeA === 0 || overdueA === 0
    ? 100
    : Math.min(100, Math.round(100 * (overdueA * 1.0 / activeA)));
  
  const overallSafetyScore = Math.round(
    (0.3 * employeeComplianceScore) + 
    (0.2 * vehicleComplianceScore) + 
    (0.25 * assessmentActivityScore) + 
    (0.25 * incidentsScore)
  );

  console.log('🔍 Assessment Activity Score Calculation:');
  console.log('  - Active Assessments:', stats.activeAssessments || 0);
  console.log('  - Calculation: min(100, (', stats.activeAssessments || 0, '/ 10) * 100) =', assessmentActivityScore);
  console.log('  - Final Assessment Activity Score:', assessmentActivityScore);

  console.log('🔍 Overall Safety Score Calculation:');
  console.log('  - Employee Compliance Score:', employeeComplianceScore, '(weight: 30%)');
  console.log('  - Vehicle Compliance Score:', vehicleComplianceScore, '(weight: 20%)');
  console.log('  - Assessment Activity Score:', assessmentActivityScore, '(weight: 15%)');
  console.log('  - Incident Management Score:', incidentsScore, '(weight: 35%)');
  console.log('  - Calculation: (0.30 *', employeeComplianceScore, ') + (0.20 *', vehicleComplianceScore, ') + (0.15 *', assessmentActivityScore, ') + (0.35 *', incidentsScore, ')');
  console.log('  - Step 1: (0.30 *', employeeComplianceScore, ') =', 0.30 * employeeComplianceScore);
  console.log('  - Step 2: (0.20 *', vehicleComplianceScore, ') =', 0.20 * vehicleComplianceScore);
  console.log('  - Step 3: (0.15 *', assessmentActivityScore, ') =', 0.15 * assessmentActivityScore);
  console.log('  - Step 4: (0.35 *', incidentsScore, ') =', 0.35 * incidentsScore);
  console.log('  - Sum:', (0.30 * employeeComplianceScore) + (0.20 * vehicleComplianceScore) + (0.15 * assessmentActivityScore) + (0.35 * incidentsScore));
  console.log('  - Final Overall Safety Score (rounded):', overallSafetyScore);

  console.log('📊 FINAL SAFETY PERFORMANCE GAUGES SUMMARY:');
  console.log('  - Employee Compliance Score:', employeeComplianceScore, '%');
  console.log('  - Vehicle Compliance Score:', vehicleComplianceScore, '%');
  console.log('  - Incidents Score:', incidentsScore, '%');
  console.log('  - Overall Safety Score:', overallSafetyScore, '%');
  console.log('  - Raw stats received:', stats);

  const createGaugeData = (percentage: number, color: string) => [
    { name: 'Completed', value: percentage, color: color },
    { name: 'Remaining', value: 100 - percentage, color: '#e5e7eb' }
  ];

  const getScoreInfo = (score: number) => {
    console.log('🎨 Color/Status Determination for score:', score);
    
    if (score <= 20) {
      console.log('  - Score <= 20: Poor (Red)');
      return { color: '#ef4444', status: 'Poor', textColor: 'text-red-600', bgColor: 'bg-red-100', textBgColor: 'text-red-800' }; // red
    } else if (score > 20 && score <= 40) {
      console.log('  - Score > 20 && <= 40: Need Attention (Orange)');
      return { color: '#f97316', status: 'Need Attention', textColor: 'text-orange-600', bgColor: 'bg-orange-100', textBgColor: 'text-orange-800' }; // orange
    } else if (score > 40 && score <= 60) {
      console.log('  - Score > 40 && <= 60: Good (Yellow)');
      return { color: '#f59e0b', status: 'Good', textColor: 'text-yellow-600', bgColor: 'bg-yellow-100', textBgColor: 'text-yellow-800' }; // yellow
    } else if (score > 60 && score <= 80) {
      console.log('  - Score > 60 && <= 80: Fair (Green)');
      return { color: '#10b981', status: 'Fair', textColor: 'text-green-600', bgColor: 'bg-green-100', textBgColor: 'text-green-800' }; // green
    } else {
      console.log('  - Score > 80: Excellent (Green)');
      return { color: '#10b981', status: 'Excellent', textColor: 'text-green-600', bgColor: 'bg-green-100', textBgColor: 'text-green-800' }; // green
    }
  };

  const gauges = [
    {
      title: 'Overall Safety Score',
      value: overallSafetyScore,
      data: createGaugeData(overallSafetyScore, getScoreInfo(overallSafetyScore).color),
      description: 'Comprehensive safety performance',
      scoreInfo: getScoreInfo(overallSafetyScore)
    },
    {
      title: 'Employee Compliance',
      value: employeeComplianceScore,
      data: createGaugeData(employeeComplianceScore, getScoreInfo(employeeComplianceScore).color),
      description: `${stats.employeesVerified}/${stats.totalEmployees} verified`,
      scoreInfo: getScoreInfo(employeeComplianceScore)
    },
    {
      title: 'Vehicle Compliance',
      value: vehicleComplianceScore,
      data: createGaugeData(vehicleComplianceScore, getScoreInfo(vehicleComplianceScore).color),
      description: `${stats.vehiclesVerified || 0}/${stats.totalVehicles} compliant`,
      scoreInfo: getScoreInfo(vehicleComplianceScore)
    },
    {
      title: 'Incident Management',
      value: incidentsScore,
      data: createGaugeData(incidentsScore, getScoreInfo(incidentsScore).color),
      description: `${stats.openIncidents} open incidents`,
      scoreInfo: getScoreInfo(incidentsScore)
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
                    <div className={`text-2xl font-bold ${gauge.scoreInfo.textColor}`}>
                      {gauge.value}%
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-medium text-gray-900">{gauge.title}</h4>
                <p className="text-xs text-gray-600">{gauge.description}</p>
                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${gauge.scoreInfo.bgColor} ${gauge.scoreInfo.textBgColor}`}>
                  {gauge.scoreInfo.status}
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