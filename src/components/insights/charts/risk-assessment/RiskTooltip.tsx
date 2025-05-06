
import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { getRiskColor, getRiskLevel } from './riskUtils';

interface RiskTooltipProps {
  active?: boolean;
  payload?: any[];
}

const RiskTooltip: React.FC<RiskTooltipProps> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const riskScore = data.frequency * data.severity;
    const riskLevel = getRiskLevel(riskScore);
    
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-md shadow">
        <p className="font-medium mb-1">{data.name}</p>
        <p className="text-sm mb-1">Frequency: {data.frequency}/5</p>
        <p className="text-sm mb-1">Severity: {data.severity}/5</p>
        <p className="text-sm mb-1">Incidents: {data.count}</p>
        <div 
          className="flex items-center gap-2 mt-2 font-medium" 
          style={{ color: getRiskColor(data.frequency, data.severity) }}
        >
          <AlertTriangle size={16} />
          <span>{riskLevel} Risk (Score: {riskScore})</span>
        </div>
      </div>
    );
  }
  return null;
};

export default RiskTooltip;
