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
    <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-none shadow-lg hover:shadow-xl transition-shadow">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm">High-Risk Facilities</h3>
          <Building2 className="w-4 h-4 text-white/80" />
        </div>
        
        {topFacility ? (
          <div className="space-y-2">
            <div 
              className="cursor-pointer hover:bg-white/10 p-2 rounded transition-colors"
              onClick={() => onFilterApply('facility', topFacility.name)}
            >
              <div className="text-lg font-bold truncate">{topFacility.name}</div>
              <div className="text-sm text-white/80">{topFacility.count} incidents</div>
            </div>
            
            {risk.topFacilities.slice(1, 3).map((facility) => (
              <div 
                key={facility.name}
                className="flex justify-between items-center text-sm cursor-pointer hover:bg-white/10 p-1 rounded"
                onClick={() => onFilterApply('facility', facility.name)}
              >
                <span className="truncate">{facility.name}</span>
                <span className="font-semibold">{facility.count}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-white/80">No data available</div>
        )}
        
        <div className="mt-3 pt-2 border-t border-white/20">
          <div className="flex justify-between items-center">
            <span className="text-sm text-white/80">Total incidents</span>
            <span className="text-lg font-bold">{risk.totalIncidents}</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default FacilityRiskCard;