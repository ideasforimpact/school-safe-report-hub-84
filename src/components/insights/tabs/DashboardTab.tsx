
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import TimeSeriesAnalysis from '../charts/TimeSeriesAnalysis';
import IncidentDetailsCard from '../charts/IncidentDetailsCard';
import RiskAssessmentChart from '../charts/RiskAssessmentChart';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DashboardTabProps {
  timeSeriesData: Array<{month: string, count: number}>;
  riskData: Array<{name: string, frequency: number, severity: number, count: number}>;
  recentIncidents: any[];
}

const DashboardTab: React.FC<DashboardTabProps> = ({
  timeSeriesData,
  riskData,
  recentIncidents = []
}) => {
  return (
    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
      {/* First column */}
      <div className="space-y-8">
        <TimeSeriesAnalysis data={timeSeriesData} />
        
        <Card className="overflow-hidden shadow-md border">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 border-b pb-4">
            <CardTitle className="text-lg font-bold text-indigo-900">Recent Incidents</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[350px]">
              {recentIncidents.length > 0 ? (
                <div className="space-y-1 p-1">
                  {recentIncidents.map((incident) => (
                    <IncidentDetailsCard key={incident.id} incident={incident} />
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-[320px] text-gray-500">
                  No recent incidents matching the selected filters
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
      
      {/* Second column */}
      <div>
        <RiskAssessmentChart data={riskData} />
      </div>
    </div>
  );
};

export default DashboardTab;
