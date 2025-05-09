
import React from 'react';
import { Badge } from "@/components/ui/badge";

interface ModuleAccessBadgesProps {
  moduleAccess: {
    superAdmin?: boolean;
    incidentReporting?: boolean;
    incidentAdmin?: boolean;
    assessmentUser?: boolean;
    assessmentsAdmin?: boolean;
    employeeVerificationAdmin?: boolean;
    grievancesAdmin?: boolean;
    transportSafetyAdmin?: boolean;
    eduSafeResourceAccess?: boolean;
  };
}

const ModuleAccessBadges = ({ moduleAccess }: ModuleAccessBadgesProps) => {
  return (
    <div className="flex flex-wrap gap-1">
      {moduleAccess?.superAdmin && (
        <Badge variant="outline" className="bg-red-100 text-red-800">Super Admin</Badge>
      )}
      {moduleAccess?.incidentReporting && (
        <Badge variant="outline" className="bg-blue-100 text-blue-800">Incident Reporting</Badge>
      )}
      {moduleAccess?.incidentAdmin && (
        <Badge variant="outline" className="bg-blue-200 text-blue-900">Incident Admin</Badge>
      )}
      {moduleAccess?.assessmentUser && (
        <Badge variant="outline" className="bg-green-100 text-green-800">Assessment User</Badge>
      )}
      {moduleAccess?.assessmentsAdmin && (
        <Badge variant="outline" className="bg-green-200 text-green-900">Assessments Admin</Badge>
      )}
      {moduleAccess?.employeeVerificationAdmin && (
        <Badge variant="outline" className="bg-purple-100 text-purple-800">Employee Verification</Badge>
      )}
      {moduleAccess?.grievancesAdmin && (
        <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Grievances</Badge>
      )}
      {moduleAccess?.transportSafetyAdmin && (
        <Badge variant="outline" className="bg-indigo-100 text-indigo-800">Transport Safety</Badge>
      )}
      {moduleAccess?.eduSafeResourceAccess && (
        <Badge variant="outline" className="bg-orange-100 text-orange-800">EduSafe Resources</Badge>
      )}
    </div>
  );
};

export default ModuleAccessBadges;
