import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, Shield, ShieldCheck, ShieldX, Calendar, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useClient } from '@/contexts/ClientContext';

interface SafetyDashboardHeaderProps {
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

const SafetyDashboardHeader = ({ stats, loading }: SafetyDashboardHeaderProps) => {
  const { user, employeeData } = useAuth();
  const { clients } = useClient();

  // Find the client associated with the current user
  const userClient = user?.clientId 
    ? clients.find(c => c.id === user.clientId) 
    : null;

  // Calculate safety status based on open incidents and compliance
  const employeeComplianceRate = stats.totalEmployees > 0 
    ? (stats.employeesVerified / stats.totalEmployees) * 100 
    : 0;
    
  const vehicleComplianceRate = stats.totalVehicles > 0 
    ? (stats.vehiclesWithDocuments / stats.totalVehicles) * 100 
    : 0;

  const getSafetyStatus = () => {
    const avgCompliance = (employeeComplianceRate + vehicleComplianceRate) / 2;
    
    if (stats.openIncidents <= 2 && avgCompliance >= 90) {
      return { level: 'SAFE', color: 'text-green-600', bgColor: 'bg-green-50', icon: ShieldCheck };
    } else if (stats.openIncidents <= 5 && avgCompliance >= 70) {
      return { level: 'CAUTION', color: 'text-yellow-600', bgColor: 'bg-yellow-50', icon: Shield };
    } else if (stats.openIncidents <= 10 && avgCompliance >= 50) {
      return { level: 'ALERT', color: 'text-orange-600', bgColor: 'bg-orange-50', icon: AlertTriangle };
    } else {
      return { level: 'CRITICAL', color: 'text-red-600', bgColor: 'bg-red-50', icon: ShieldX };
    }
  };

  const safetyStatus = getSafetyStatus();
  const StatusIcon = safetyStatus.icon;

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
              {userClient?.name || 'Your Organization'} Safety Management
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
            {/* Safety Status Indicator */}
            <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${safetyStatus.bgColor}`}>
              <StatusIcon className={`h-6 w-6 ${safetyStatus.color}`} />
              <div className="text-right">
                <div className={`text-lg font-bold ${safetyStatus.color}`}>
                  {safetyStatus.level}
                </div>
                <div className="text-xs text-gray-600">Safety Status</div>
              </div>
            </div>
            
            {/* Safety Streak */}
            <div className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gray-50">
              <Clock className="h-6 w-6 text-gray-600" />
              <div className="text-right">
                <div className="text-lg font-bold text-gray-900">
                  {stats.incidentsLastMonth === 0 ? '30+' : '<30'}
                </div>
                <div className="text-xs text-gray-600">Days Safe</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SafetyDashboardHeader;