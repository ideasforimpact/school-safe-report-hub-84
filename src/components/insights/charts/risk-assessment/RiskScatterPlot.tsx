
import React from 'react';
import { Scatter, Cell } from 'recharts';
import { getRiskColor } from './riskUtils';

interface RiskDataPoint {
  name: string;
  frequency: number;
  severity: number;
  count: number;
}

interface RiskScatterPlotProps {
  data: RiskDataPoint[];
  isZone?: boolean;
}

const RiskScatterPlot: React.FC<RiskScatterPlotProps> = ({ data, isZone = false }) => {
  return (
    <Scatter
      name={isZone ? "Risk Zones" : "Incident Categories"}
      data={data}
      fill="#8884d8"
      opacity={isZone ? 0.2 : 1}
      shape="circle"
    >
      {data.map((entry, index) => (
        <Cell
          key={`cell-${index}`}
          fill={isZone ? entry.color : getRiskColor(entry.frequency, entry.severity)}
        />
      ))}
    </Scatter>
  );
};

export default RiskScatterPlot;
