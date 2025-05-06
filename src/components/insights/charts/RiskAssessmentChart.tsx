
import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ScatterChart, 
  XAxis, 
  YAxis, 
  ZAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import RiskTooltip from './risk-assessment/RiskTooltip';
import RiskLegend from './risk-assessment/RiskLegend';
import RiskScatterPlot from './risk-assessment/RiskScatterPlot';
import { createRiskZones } from './risk-assessment/riskUtils';

interface RiskDataPoint {
  name: string;
  frequency: number;
  severity: number;
  count: number;
}

interface RiskAssessmentChartProps {
  data: RiskDataPoint[];
}

const RiskAssessmentChart: React.FC<RiskAssessmentChartProps> = ({ data }) => {
  // Memoize risk zones for better performance
  const riskZones = useMemo(() => createRiskZones(), []);

  return (
    <Card className="w-full h-full">
      <CardHeader className="text-left">
        <CardTitle className="text-xl">Risk Assessment Matrix</CardTitle>
        <CardDescription className="text-sm">
          Visualizes incident categories by frequency and severity to identify high-risk areas that require immediate attention
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[calc(100%-90px)] relative">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart
              margin={{ top: 20, right: 40, bottom: 70, left: 40 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                type="number" 
                dataKey="frequency" 
                name="Frequency" 
                domain={[0, 5]}
                tickCount={6}
                label={{ value: 'Frequency', position: 'bottom', offset: 0 }}
              />
              <YAxis 
                type="number" 
                dataKey="severity" 
                name="Severity" 
                domain={[0, 5]} 
                tickCount={6}
                label={{ value: 'Severity', angle: -90, position: 'left' }}
              />
              <ZAxis type="number" range={[60, 400]} dataKey="count" />
              <Tooltip content={<RiskTooltip />} />
              
              {/* Risk zones as background */}
              <RiskScatterPlot data={riskZones} isZone={true} />
              
              {/* Data points */}
              <RiskScatterPlot data={data} />
            </ScatterChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            No data available for risk assessment
          </div>
        )}
        
        {/* Custom legend inside the chart */}
        {data.length > 0 && <RiskLegend />}
      </CardContent>
    </Card>
  );
};

export default RiskAssessmentChart;
