
import React from 'react';
import TimeSeriesAnalysis from '../charts/TimeSeriesAnalysis';
import RiskAssessmentChart from '../charts/RiskAssessmentChart';
import HeatmapChart from '../charts/HeatmapChart';
import { Incident } from '@/types/incident';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CircleCheck, Filter, TrendingDown, TrendingUp } from 'lucide-react';

interface DashboardTabProps {
  timeSeriesData: Array<{month: string, count: number}>;
  riskData: Array<{name: string, frequency: number, severity: number, count: number}>;
  heatmapData: Array<{
    name: string, 
    values: Array<{day: string, value: number}>
  }>;
  recentIncidents: Incident[];
}

const DashboardSummary = ({
  totalIncidents,
  openIncidents,
  percentResolved
}: {
  totalIncidents: number;
  openIncidents: number;
  percentResolved: number;
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Incidents</p>
              <h3 className="text-2xl font-bold mt-1">{totalIncidents}</h3>
            </div>
            <div className="bg-purple-100 h-10 w-10 rounded-full flex items-center justify-center">
              <Filter className="h-5 w-5 text-purple-600" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Open Incidents</p>
              <h3 className="text-2xl font-bold mt-1 flex items-center">
                {openIncidents}
                <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${openIncidents > totalIncidents / 3 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                  {Math.round((openIncidents / totalIncidents) * 100)}%
                </span>
              </h3>
            </div>
            <div className="bg-orange-100 h-10 w-10 rounded-full flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-orange-600" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Resolution Rate</p>
              <h3 className="text-2xl font-bold mt-1 flex items-center">
                {percentResolved}%
                <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${percentResolved > 70 ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                  {percentResolved > 70 ? 'Good' : 'Needs Attention'}
                </span>
              </h3>
            </div>
            <div className="bg-green-100 h-10 w-10 rounded-full flex items-center justify-center">
              <CircleCheck className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const DashboardTab: React.FC<DashboardTabProps> = ({
  timeSeriesData,
  riskData,
  heatmapData,
  recentIncidents
}) => {
  // Calculate summary metrics
  const totalIncidents = recentIncidents.length;
  const openIncidents = recentIncidents.filter(i => i.status === 'Open').length;
  const percentResolved = Math.round(((totalIncidents - openIncidents) / Math.max(totalIncidents, 1)) * 100);

  return (
    <div>
      <DashboardSummary 
        totalIncidents={totalIncidents} 
        openIncidents={openIncidents} 
        percentResolved={percentResolved} 
      />
      
      {/* Two-column layout for top charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Enhanced time series analysis */}
        <TimeSeriesAnalysis data={timeSeriesData} />
        
        {/* Risk assessment matrix */}
        <RiskAssessmentChart data={riskData} />
      </div>
      
      {/* Full-width container for heatmap */}
      <div className="w-full">
        {/* Heatmap showing when and where incidents occur */}
        <HeatmapChart 
          data={heatmapData} 
          title="Incident Hotspots"
          description="Heatmap showing when and where incidents occur most frequently"
        />
      </div>
    </div>
  );
};

export default DashboardTab;
