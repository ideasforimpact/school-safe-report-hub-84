
import React from 'react';
import SubcategoryChartWrapper from './charts/SubcategoryChartWrapper';
import RiskAssessmentChartWrapper from './charts/RiskAssessmentChartWrapper';

interface RiskAnalysisTabProps {
  subcategoryData: Array<{name: string, value: number}>;
  riskData: Array<{name: string, frequency: number, severity: number, count: number}>;
  colors: string[];
}

const RiskAnalysisTab: React.FC<RiskAnalysisTabProps> = ({
  subcategoryData,
  riskData,
  colors
}) => {
  return (
    <div className="flex flex-col gap-12 w-full">
      {/* Risk Assessment Matrix */}
      <div className="chart-container">
        <RiskAssessmentChartWrapper data={riskData} />
      </div>
      
      {/* Subcategories chart */}
      <div className="chart-container">
        <SubcategoryChartWrapper data={subcategoryData} colors={colors} />
      </div>
    </div>
  );
};

export default RiskAnalysisTab;
