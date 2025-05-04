
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, TrendingUp } from 'lucide-react';

interface MonthlyIncidentsCardProps {
  incidentsThisMonth: number;
}

const MonthlyIncidentsCard: React.FC<MonthlyIncidentsCardProps> = ({ incidentsThisMonth }) => {
  return (
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
  );
};

export default MonthlyIncidentsCard;
