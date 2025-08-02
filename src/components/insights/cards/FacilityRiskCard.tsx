import React from 'react';
import { Card } from '@/components/ui/card';
import { Building2 } from 'lucide-react';
import { FacilityRisk } from '@/hooks/useNewInsightsData';

interface FacilityRiskCardProps {
  risk: FacilityRisk;
  onFilterApply: (filterType: string, value: string) => void;
}

const FacilityRiskCard: React.FC<FacilityRiskCardProps> = ({ risk, onFilterApply }) => {
  const topFacility = risk.topFacilities[0];

  return (
    <Card className="bg-gradient-to-br from-red-400 to-red-500 text-white border-none shadow-lg hover:shadow-xl transition-shadow h-36">
      <div className="p-4 h-full flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">High-Risk Facilities</h3>
          <Building2 className="w-4 h-4 text-white/80" />
        </div>
        
        {topFacility ? (
          <div className="text-center">
            <div 
              className="cursor-pointer hover:bg-white/10 px-2 py-1 rounded transition-colors"
              onClick={() => onFilterApply('facility', topFacility.name)}
            >
              <div className="text-lg font-bold truncate">{topFacility.name}</div>
            </div>
          </div>
        ) : (
          <div className="text-center text-sm text-white/80">No data available</div>
        )}
        
        <div className="text-center pt-2 border-t border-white/20">
          <span className="text-2xl font-bold">{risk.totalIncidents}</span>
        </div>
      </div>
    </Card>
  );
};

export default FacilityRiskCard;