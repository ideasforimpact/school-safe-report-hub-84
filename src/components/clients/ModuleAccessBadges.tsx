
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { ModulePermissions } from '@/contexts/auth/types';

interface ModuleAccessBadgesProps {
  moduleAccess: Partial<ModulePermissions>;
}

const ModuleAccessBadges = ({ moduleAccess }: ModuleAccessBadgesProps) => {
  // Count enabled modules
  const enabledModulesCount = Object.values(moduleAccess || {}).filter(Boolean).length;
  
  // If no modules are enabled, show a placeholder
  if (!moduleAccess || enabledModulesCount === 0) {
    return <span className="text-gray-500 text-sm">No modules assigned</span>;
  }
  
  return (
    <div className="flex flex-wrap gap-1">
      {moduleAccess?.superAdmin && (
        <Badge variant="outline" className="bg-red-100 text-red-800">Super Admin</Badge>
      )}
      {moduleAccess?.incidentReporting && (
        <Badge variant="outline" className="bg-blue-100 text-blue-800">Reporting</Badge>
      )}
      {moduleAccess?.incidentAdmin && (
        <Badge variant="outline" className="bg-blue-100 text-blue-800">Incident Admin</Badge>
      )}
      {moduleAccess?.assessmentUser && (
        <Badge variant="outline" className="bg-green-100 text-green-800">Assessments</Badge>
      )}
      {moduleAccess?.assessmentsAdmin && (
        <Badge variant="outline" className="bg-green-100 text-green-800">Assessments Admin</Badge>
      )}
      {moduleAccess?.employeeVerificationAdmin && (
        <Badge variant="outline" className="bg-purple-100 text-purple-800">Verification</Badge>
      )}
      {moduleAccess?.grievancesAdmin && (
        <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Grievances</Badge>
      )}
      {moduleAccess?.transportSafetyAdmin && (
        <Badge variant="outline" className="bg-orange-100 text-orange-800">Transport</Badge>
      )}
      {moduleAccess?.eduSafeResourceAccess && (
        <Badge variant="outline" className="bg-teal-100 text-teal-800">Resources</Badge>
      )}
    </div>
  );
};

export default ModuleAccessBadges;
