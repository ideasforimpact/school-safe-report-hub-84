
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { AlertTriangle } from 'lucide-react';

interface RiskDataPoint {
  name: string;
  frequency: number;
  severity: number;
  count: number;
}

interface RiskAssessmentChartProps {
  data: RiskDataPoint[];
}

// Get color based on risk score (frequency * severity)
const getRiskColor = (frequency: number, severity: number) => {
  const riskScore = frequency * severity;
  
  if (riskScore < 4) return "#4ade80"; // Low risk - green
  if (riskScore < 9) return "#facc15"; // Medium risk - yellow
  if (riskScore < 16) return "#f97316"; // High risk - orange
  return "#ef4444"; // Critical risk - red
};

// Custom tooltip for the scatter plot
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const riskScore = data.frequency * data.severity;
    let riskLevel = "Low";
    
    if (riskScore >= 16) riskLevel = "Critical";
    else if (riskScore >= 9) riskLevel = "High";
    else if (riskScore >= 4) riskLevel = "Medium";
    
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-md shadow">
        <p className="font-medium mb-1">{data.name}</p>
        <p className="text-sm mb-1">Frequency: {data.frequency}/5</p>
        <p className="text-sm mb-1">Severity: {data.severity}/5</p>
        <p className="text-sm mb-1">Incidents: {data.count}</p>
        <div className="flex items-center gap-2 mt-2 font-medium" style={{ color: getRiskColor(data.frequency, data.severity) }}>
          <AlertTriangle size={16} />
          <span>{riskLevel} Risk</span>
        </div>
      </div>
    );
  }
  return null;
};

const RiskAssessmentChart: React.FC<RiskAssessmentChartProps> = ({ data }) => {
  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Risk Assessment Matrix</CardTitle>
        <CardDescription>
          Visualizes incident categories by frequency and severity to identify high-risk areas
        </CardDescription>
      </CardHeader>
      <CardContent className="h-80">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart
              margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
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
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              
              {/* Risk zones */}
              <Scatter name="Risk Zones" data={[]} fill="#8884d8">
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={getRiskColor(entry.frequency, entry.severity)}
                  />
                ))}
              </Scatter>
              
              {/* Data points */}
              <Scatter
                name="Incident Categories"
                data={data}
                fill="#8884d8"
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={getRiskColor(entry.frequency, entry.severity)}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            No data available for risk assessment
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RiskAssessmentChart;
