
import React from 'react';

const RiskLegend: React.FC = () => {
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

export default RiskLegend;
