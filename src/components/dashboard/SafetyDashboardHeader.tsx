import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, Calendar, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface SafetyDashboardHeaderProps {
  stats: {
    openIncidents: number;
    totalEmployees: number;
    employeesVerified: number;
    totalVehicles: number;
    vehiclesVerified?: number;
    activeAssessments?: number;
    overdueAssessments?: number;
    incidentsLastMonth: number;
    openIncidentOlder7days: number
  };
  loading: boolean;
}

const SafetyDashboardHeader = ({ stats, loading }: SafetyDashboardHeaderProps) => {
  const { employeeData } = useAuth();

  // Use direct client object from employeeData
  const userClient = employeeData?.client || null;

  // Calculate Employee Compliance score = 100 * (number of verified employees / number of active employees)
  const employeeComplianceScore = stats.totalEmployees > 0 
    ? Math.round(100 * (stats.employeesVerified / stats.totalEmployees)) 
    : 0;

  // Calculate Vehicle Compliance score = 100 * (number of verified vehicles / number of vehicles)
  const vehicleComplianceScore = stats.totalVehicles > 0 
    ? Math.round(100 * ((stats.vehiclesVerified || 0) / stats.totalVehicles)) 
    : 0;

  // Calculate Incidents Score = max(100 - 20 * Open Incidents, 0)
  const incidentsScore = Math.max(100 - 20 * stats.openIncidentOlder7days, 0);

  console.log(stats.openIncidentOlder7days,'openIncidentOlder7days');
  
  // Calculate Assessment Activity Score (new formula)
  // CASE WHEN ActiveAssessments = 0 THEN 100
  //      WHEN OverdueAssessments = 0 THEN 100
  //      ELSE 100 * (OverdueAssessments / ActiveAssessments)
  const activeA = stats.activeAssessments || 0;
  const overdueA = stats.overdueAssessments || 0;
  const assessmentActivityScore = activeA === 0 || overdueA === 0
    ? 100
    : Math.min(100, Math.round(100 * (overdueA * 1.0 / activeA)));

  // Overall Safety Score (same formula as gauges)
  const overallSafetyScore = Math.round(
    (0.3 * employeeComplianceScore) + 
    (0.2 * vehicleComplianceScore) + 
    (0.25 * assessmentActivityScore) + 
    (0.25 * incidentsScore)
  );

  const getScoreInfo = (score: number) => {
    if (score <= 20) {
      return { color: '#ef4444', status: 'POOR', textColor: 'text-red-600', bgColor: 'bg-red-100', textBgColor: 'text-red-800' };
    } else if (score > 20 && score <= 40) {
      return { color: '#f97316', status: 'NEED ATTENTION', textColor: 'text-orange-600', bgColor: 'bg-orange-100', textBgColor: 'text-orange-800' };
    } else if (score > 40 && score <= 60) {
      return { color: '#f59e0b', status: 'GOOD', textColor: 'text-yellow-600', bgColor: 'bg-yellow-100', textBgColor: 'text-yellow-800' };
    } else if (score > 60 && score <= 80) {
      return { color: '#10b981', status: 'FAIR', textColor: 'text-green-600', bgColor: 'bg-green-100', textBgColor: 'text-green-800' };
    } else {
      return { color: '#10b981', status: 'EXCELLENT', textColor: 'text-green-600', bgColor: 'bg-green-100', textBgColor: 'text-green-800' };
    }
  };

  const safetyInfo = getScoreInfo(overallSafetyScore);

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-8 bg-gray-200 rounded w-64"></div>
              <div className="h-4 bg-gray-200 rounded w-48"></div>
            </div>
            <div className="h-16 w-16 bg-gray-200 rounded-lg"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-primary-50 border-l-4 border-primary shadow-md hover:shadow-lg transition-all duration-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-900">
              {userClient?.name || 'Your Organization'} School Safety Command Center
            </h1>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>Last updated: {new Date().toLocaleString()}</span>
              </div>
              {employeeData && (
                <div className="flex items-center space-x-1">
                  <span className="font-medium">Welcome, {employeeData.firstName} {employeeData.lastName}</span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                    {employeeData.isSuperAdmin ? 'Super Admin' : employeeData.employeeType}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Overall Safety Status */}
            <div className={`flex items-center justify-center px-4 py-2 rounded-lg ${safetyInfo.bgColor}`}>
              <div className={`text-lg font-bold ${safetyInfo.textColor}`}>
                {safetyInfo.status}
              </div>
            </div>
            
            {/* Overall Safety Score */}
            <div className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gray-50">
              <Shield className="h-6 w-6 text-gray-600" />
              <div className="text-right">
                <div className={`text-lg font-bold ${safetyInfo.textColor}`}>
                  {overallSafetyScore}%
                </div>
                <div className="text-xs text-gray-600">Overall Safety Score</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SafetyDashboardHeader;