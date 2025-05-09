
import React from 'react';
import { Badge } from "@/components/ui/badge";

interface ModuleAccessBadgesProps {
  moduleAccess: {
    incidentReporting?: boolean;
    allIncidents?: boolean;
    insights?: boolean;
    benchmarking?: boolean;
  };
}

const ModuleAccessBadges = ({ moduleAccess }: ModuleAccessBadgesProps) => {
  return (
    <div className="flex flex-wrap gap-1">
      {moduleAccess?.incidentReporting && (
        <Badge variant="outline" className="bg-blue-100 text-blue-800">Reporting</Badge>
      )}
      {moduleAccess?.allIncidents && (
        <Badge variant="outline" className="bg-green-100 text-green-800">All Incidents</Badge>
      )}
      {moduleAccess?.insights && (
        <Badge variant="outline" className="bg-purple-100 text-purple-800">Insights</Badge>
      )}
      {moduleAccess?.benchmarking && (
        <Badge variant="outline" className="bg-orange-100 text-orange-800">Benchmarking</Badge>
      )}
    </div>
  );
};

export default ModuleAccessBadges;
