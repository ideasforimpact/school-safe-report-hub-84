
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Users, FileText, AlertCircle, Calendar, Clock, Truck, TrendingUp, TrendingDown } from 'lucide-react';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { Skeleton } from '@/components/ui/skeleton';

const ComprehensiveDashboardCards = () => {
  const { stats, loading, error } = useDashboardStats();

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="border-none shadow-card">
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-1/3 mb-2" />
              <Skeleton className="h-3 w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card className="col-span-full border-red-200 bg-red-50">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Dashboard Statistics</h3>
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  // Calculate percentage change (mock for now, can be enhanced with historical data)
  const getChangeIndicator = (value: number, isGood: boolean = false) => {
    const change = Math.floor(Math.random() * 20) - 10; // Mock change for demo
    const isPositive = change > 0;
    const Icon = isPositive ? TrendingUp : TrendingDown;
    const colorClass = isGood ? 
      (isPositive ? 'text-green-600' : 'text-red-600') : 
      (isPositive ? 'text-red-600' : 'text-green-600');

    return (
      <div className={`flex items-center gap-1 text-xs ${colorClass}`}>
        <Icon className="h-3 w-3" />
        <span>{Math.abs(change)}%</span>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {/* Open Incidents */}
      <Card className="border-none shadow-card hover:shadow-card-hover transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base md:text-lg font-medium">Open Incidents</CardTitle>
            <div className="bg-red-100 h-8 w-8 md:h-10 md:w-10 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 md:h-5 md:w-5 text-red-600" />
            </div>
          </div>
          <CardDescription>Require immediate attention</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-2xl md:text-3xl font-semibold text-primary-700">{stats.openIncidents.count}</p>
          <div className="flex items-center justify-between mt-2">
            {getChangeIndicator(stats.openIncidents.count, false)}
            <span className="text-xs text-gray-500">incidents</span>
          </div>
        </CardContent>
      </Card>

      {/* Verification Status */}
      <Card className="border-none shadow-card hover:shadow-card-hover transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base md:text-lg font-medium">Verification Status</CardTitle>
            <div className="bg-orange-100 h-8 w-8 md:h-10 md:w-10 rounded-full flex items-center justify-center">
              <Users className="h-4 w-4 md:h-5 md:w-5 text-orange-600" />
            </div>
          </div>
          <CardDescription>Pending employee verification</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-2xl md:text-3xl font-semibold text-primary-700">{stats.verificationStatus.pending}</p>
          <div className="flex items-center justify-between mt-2">
            {getChangeIndicator(stats.verificationStatus.pending, false)}
            <span className="text-xs text-gray-500">of {stats.verificationStatus.total} employees</span>
          </div>
        </CardContent>
      </Card>

      {/* Total Assessments */}
      <Card className="border-none shadow-card hover:shadow-card-hover transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base md:text-lg font-medium">Total Assessments</CardTitle>
            <div className="bg-blue-100 h-8 w-8 md:h-10 md:w-10 rounded-full flex items-center justify-center">
              <FileText className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
            </div>
          </div>
          <CardDescription>Created assessments</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-2xl md:text-3xl font-semibold text-primary-700">{stats.totalAssessments.count}</p>
          <div className="flex items-center justify-between mt-2">
            {getChangeIndicator(stats.totalAssessments.count, true)}
            <span className="text-xs text-gray-500">assessments</span>
          </div>
        </CardContent>
      </Card>

      {/* Open Critical Incidents */}
      <Card className="border-none shadow-card hover:shadow-card-hover transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base md:text-lg font-medium">Critical Incidents</CardTitle>
            <div className="bg-red-100 h-8 w-8 md:h-10 md:w-10 rounded-full flex items-center justify-center">
              <AlertCircle className="h-4 w-4 md:h-5 md:w-5 text-red-600" />
            </div>
          </div>
          <CardDescription>Open critical incidents</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-2xl md:text-3xl font-semibold text-primary-700">{stats.openCriticalIncidents.count}</p>
          <div className="flex items-center justify-between mt-2">
            {getChangeIndicator(stats.openCriticalIncidents.count, false)}
            <span className="text-xs text-gray-500">critical</span>
          </div>
        </CardContent>
      </Card>

      {/* Today's Incidents */}
      <Card className="border-none shadow-card hover:shadow-card-hover transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base md:text-lg font-medium">Today</CardTitle>
            <div className="bg-yellow-100 h-8 w-8 md:h-10 md:w-10 rounded-full flex items-center justify-center">
              <Calendar className="h-4 w-4 md:h-5 md:w-5 text-yellow-600" />
            </div>
          </div>
          <CardDescription>Incidents created today</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-2xl md:text-3xl font-semibold text-primary-700">{stats.todayIncidents.count}</p>
          <div className="flex items-center justify-between mt-2">
            {getChangeIndicator(stats.todayIncidents.count, false)}
            <span className="text-xs text-gray-500">today</span>
          </div>
        </CardContent>
      </Card>

      {/* This Week's Incidents */}
      <Card className="border-none shadow-card hover:shadow-card-hover transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base md:text-lg font-medium">This Week</CardTitle>
            <div className="bg-purple-100 h-8 w-8 md:h-10 md:w-10 rounded-full flex items-center justify-center">
              <Clock className="h-4 w-4 md:h-5 md:w-5 text-purple-600" />
            </div>
          </div>
          <CardDescription>Incidents this week</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-2xl md:text-3xl font-semibold text-primary-700">{stats.weekIncidents.count}</p>
          <div className="flex items-center justify-between mt-2">
            {getChangeIndicator(stats.weekIncidents.count, false)}
            <span className="text-xs text-gray-500">this week</span>
          </div>
        </CardContent>
      </Card>

      {/* Transport Safety */}
      <Card className="border-none shadow-card hover:shadow-card-hover transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base md:text-lg font-medium">Transport Safety</CardTitle>
            <div className="bg-green-100 h-8 w-8 md:h-10 md:w-10 rounded-full flex items-center justify-center">
              <Truck className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
            </div>
          </div>
          <CardDescription>Vehicles requiring action</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-2xl md:text-3xl font-semibold text-primary-700">{stats.transportSafety.vehiclesRequiringAction}</p>
          <div className="flex items-center justify-between mt-2">
            {getChangeIndicator(stats.transportSafety.vehiclesRequiringAction, false)}
            <span className="text-xs text-gray-500">of {stats.transportSafety.totalVehicles} vehicles</span>
          </div>
        </CardContent>
      </Card>

      {/* Verification Percentage */}
      <Card className="border-none shadow-card hover:shadow-card-hover transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base md:text-lg font-medium">Verification Rate</CardTitle>
            <div className="bg-indigo-100 h-8 w-8 md:h-10 md:w-10 rounded-full flex items-center justify-center">
              <Users className="h-4 w-4 md:h-5 md:w-5 text-indigo-600" />
            </div>
          </div>
          <CardDescription>Employee verification completion</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-2xl md:text-3xl font-semibold text-primary-700">
            {100 - stats.verificationStatus.percentage}%
          </p>
          <div className="flex items-center justify-between mt-2">
            <div className="h-2 w-full bg-gray-100 rounded-full">
              <div 
                className="h-2 bg-indigo-500 rounded-full" 
                style={{width: `${100 - stats.verificationStatus.percentage}%`}}
              ></div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComprehensiveDashboardCards;
