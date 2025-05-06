
import React, { useMemo } from 'react';
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
          <span>{riskLevel} Risk (Score: {riskScore})</span>
        </div>
      </div>
    );
  }
  return null;
};

// Custom legend component that will be displayed inside the chart
const CustomLegend = () => {
  return (
    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex justify-center gap-6 px-6 py-3 bg-white/90 rounded-md border border-gray-100 shadow-sm text-sm">
      <div className="text-green-500 font-medium flex items-center gap-2">
        <div className="w-4 h-4 rounded-full bg-green-500"></div>
        Low Risk
      </div>
      <div className="text-yellow-500 font-medium flex items-center gap-2">
        <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
        Medium Risk
      </div>
      <div className="text-orange-500 font-medium flex items-center gap-2">
        <div className="w-4 h-4 rounded-full bg-orange-500"></div>
        High Risk
      </div>
      <div className="text-red-500 font-medium flex items-center gap-2">
        <div className="w-4 h-4 rounded-full bg-red-500"></div>
        Critical Risk
      </div>
    </div>
  );
};

const RiskAssessmentChart: React.FC<RiskAssessmentChartProps> = ({ data }) => {
  // Memoize risk zones for better performance
  const riskZones = useMemo(() => {
    // Create a visual representation of risk zones
    const zones = [];
    for (let i = 0; i <= 5; i++) {
      for (let j = 0; j <= 5; j++) {
        if (i === 0 || j === 0) continue; // Skip the 0 values
        zones.push({
          x: i,
          y: j,
          z: 10, // Fixed size
          name: `Zone ${i}x${j}`,
          color: getRiskColor(i, j)
        });
      }
    }
    return zones;
  }, []);

  return (
    <Card className="w-full h-full">
      <CardHeader>
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
              <Tooltip content={<CustomTooltip />} />
              
              {/* Risk zones as background */}
              <Scatter 
                name="Risk Zones" 
                data={riskZones} 
                fill="#8884d8"
                opacity={0.2}
                shape="circle"
              >
                {riskZones.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
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
        
        {/* Custom legend inside the chart */}
        {data.length > 0 && <CustomLegend />}
      </CardContent>
    </Card>
  );
};

export default RiskAssessmentChart;
