
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, FileCheck, AlertCircle, FileText } from 'lucide-react';

interface SafetyModuleSummaryCardsProps {
  openIncidents: {
    count: number;
    change: number;
  };
  verificationStatus: {
    verified: number;
    pending: number;
    total: number;
  };
  assessmentPerformance: {
    score: number;
    completed: number;
    total: number;
  };
  safetyResources: {
    count: number;
    recent: number;
  };
}

const SafetyModuleSummaryCards: React.FC<SafetyModuleSummaryCardsProps> = ({
  openIncidents,
  verificationStatus,
  assessmentPerformance,
  safetyResources
}) => {
  // Calculate percentages
  const verifiedPercentage = Math.round((verificationStatus.verified / Math.max(verificationStatus.total, 1)) * 100);
  const assessmentCompletionRate = Math.round((assessmentPerformance.completed / Math.max(assessmentPerformance.total, 1)) * 100);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {/* Open Incidents Card */}
      <Card className="border-none shadow-card hover:shadow-card-hover transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base md:text-lg font-medium">Open Incidents</CardTitle>
            <div className="bg-red-100 h-8 w-8 md:h-10 md:w-10 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 md:h-5 md:w-5 text-red-600" />
            </div>
          </div>
          <CardDescription>Require attention</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-2xl md:text-3xl font-semibold text-primary-700">{openIncidents.count}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className={`text-xs ${openIncidents.change > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {openIncidents.change > 0 ? '+' : ''}{openIncidents.change}%
            </span>
            <span className="text-xs text-gray-500">from last week</span>
          </div>
        </CardContent>
      </Card>

      {/* Verification Status Card */}
      <Card className="border-none shadow-card hover:shadow-card-hover transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base md:text-lg font-medium">Verification Status</CardTitle>
            <div className="bg-green-100 h-8 w-8 md:h-10 md:w-10 rounded-full flex items-center justify-center">
              <FileCheck className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
            </div>
          </div>
          <CardDescription>Employee verification</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-2xl md:text-3xl font-semibold text-primary-700">{verifiedPercentage}%</p>
          <div className="h-2 w-full bg-gray-100 rounded-full mt-2 mb-1">
            <div 
              className="h-2 bg-green-500 rounded-full" 
              style={{width: `${verifiedPercentage}%`}}
            ></div>
          </div>
          <p className="text-xs text-gray-500">
            {verificationStatus.verified} of {verificationStatus.total} verified
          </p>
        </CardContent>
      </Card>

      {/* Assessment Performance Card */}
      <Card className="border-none shadow-card hover:shadow-card-hover transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base md:text-lg font-medium">Assessment Score</CardTitle>
            <div className="bg-blue-100 h-8 w-8 md:h-10 md:w-10 rounded-full flex items-center justify-center">
              <AlertCircle className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
            </div>
          </div>
          <CardDescription>Safety compliance</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-2xl md:text-3xl font-semibold text-primary-700">{assessmentPerformance.score}%</p>
          <div className="flex items-center gap-1 mt-2">
            <span className="text-xs text-gray-500">
              {assessmentPerformance.completed} of {assessmentPerformance.total} completed ({assessmentCompletionRate}%)
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Safety Resources Card */}
      <Card className="border-none shadow-card hover:shadow-card-hover transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base md:text-lg font-medium">Safety Resources</CardTitle>
            <div className="bg-purple-100 h-8 w-8 md:h-10 md:w-10 rounded-full flex items-center justify-center">
              <FileText className="h-4 w-4 md:h-5 md:w-5 text-purple-600" />
            </div>
          </div>
          <CardDescription>Available materials</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-2xl md:text-3xl font-semibold text-primary-700">{safetyResources.count}</p>
          <div className="flex items-center gap-1 mt-2">
            <span className="text-xs text-gray-500">
              {safetyResources.recent} new in the last 30 days
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SafetyModuleSummaryCards;
