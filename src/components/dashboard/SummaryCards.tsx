
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Calendar, ActivityIcon, Users } from 'lucide-react';
import { TrendingUp } from 'lucide-react';

interface SummaryCardsProps {
  openIncidents: number;
  totalIncidents: number;
  incidentsThisMonth: number;
  mostCommonCategory: string;
  categoryCounts: Record<string, number>;
  totalPeopleInvolved: number;
}

const SummaryCards: React.FC<SummaryCardsProps> = ({
  openIncidents,
  totalIncidents,
  incidentsThisMonth,
  mostCommonCategory,
  categoryCounts,
  totalPeopleInvolved
}) => {
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
          <CardDescription>Awaiting action</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-2xl md:text-3xl font-semibold text-primary-700">{openIncidents}</p>
          <div className="h-2 w-full bg-gray-100 rounded-full mt-2 mb-1">
            <div 
              className="h-2 bg-primary-500 rounded-full" 
              style={{width: `${Math.min(100, (openIncidents / Math.max(totalIncidents, 1)) * 100)}%`}}
            ></div>
          </div>
          <p className="text-xs text-gray-500">
            {Math.round((openIncidents / Math.max(totalIncidents, 1)) * 100)}% of total incidents
          </p>
        </CardContent>
      </Card>
      
      {/* Incidents This Month Card */}
      <Card className="border-none shadow-card hover:shadow-card-hover transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base md:text-lg font-medium">This Month</CardTitle>
            <div className="bg-blue-100 h-8 w-8 md:h-10 md:w-10 rounded-full flex items-center justify-center">
              <Calendar className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
            </div>
          </div>
          <CardDescription>Recent incidents</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-2xl md:text-3xl font-semibold text-primary-700">{incidentsThisMonth}</p>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex items-center text-xs md:text-sm text-green-600">
              <TrendingUp className="h-3 w-3 md:h-4 md:w-4 mr-1" />
              <span>12% increase</span>
            </div>
            <span className="text-xs text-gray-500">from last month</span>
          </div>
        </CardContent>
      </Card>
      
      {/* Common Category Card */}
      <Card className="border-none shadow-card hover:shadow-card-hover transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base md:text-lg font-medium">Common Category</CardTitle>
            <div className="bg-purple-100 h-8 w-8 md:h-10 md:w-10 rounded-full flex items-center justify-center">
              <ActivityIcon className="h-4 w-4 md:h-5 md:w-5 text-purple-600" />
            </div>
          </div>
          <CardDescription>Most reported</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-lg md:text-xl font-semibold text-primary-700 truncate">{mostCommonCategory}</p>
          <div className="flex items-center gap-1 mt-2">
            <span className="text-xs text-gray-500">
              {categoryCounts[mostCommonCategory] || 0} incidents reported
            </span>
          </div>
        </CardContent>
      </Card>
      
      {/* People Involved Card */}
      <Card className="border-none shadow-card hover:shadow-card-hover transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base md:text-lg font-medium">People Involved</CardTitle>
            <div className="bg-green-100 h-8 w-8 md:h-10 md:w-10 rounded-full flex items-center justify-center">
              <Users className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
            </div>
          </div>
          <CardDescription>Total affected</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-2xl md:text-3xl font-semibold text-primary-700">
            {totalPeopleInvolved}
          </p>
          <div className="flex items-center gap-1 mt-2">
            <span className="text-xs text-gray-500">
              Across all incidents
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SummaryCards;
