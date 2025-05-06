
import React from 'react';
import RiskAssessmentChart from '../../charts/RiskAssessmentChart';

interface RiskAssessmentChartWrapperProps {
  data: Array<{name: string, frequency: number, severity: number, count: number}>;
}

const RiskAssessmentChartWrapper: React.FC<RiskAssessmentChartWrapperProps> = ({ data }) => {
  return (
    <div className="h-[500px] shadow-sm rounded-xl overflow-hidden w-full">
      <RiskAssessmentChart data={data} />
    </div>
  );
};

export default RiskAssessmentChartWrapper;
