import React from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, FileText, ExternalLink, BookOpen } from 'lucide-react';
import { useEmployeeStore } from '@/store/EmployeeContext';
import { isEmployeeSuperAdmin, getEmployeeData } from '@/store/employeeSelectors';
import { useNavigate } from 'react-router-dom';
import { useClient } from '@/contexts/ClientContext';
import { useRealTimeSubHook } from '@/hooks/useRealTimeSubHook';

interface SOPHeaderProps {
  onCreateSOP?: () => void;
  canCreateSOP?: boolean;
  onRefreshStats?: () => void;
  // Stats passed from parent (computed from fetch-sop / fetch-assigned-sop response)
  totalSOPs?: number;
  totalEmployeesInvolved?: number;
  totalSOPsSignedOff?: number;
  totalSOPsToBeDone?: number;
  loading?: boolean;
}

const InlineLoader = () => (
  <svg className="h-5 w-5 animate-spin text-gray-400" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
  </svg>
);

const SOPHeader: React.FC<SOPHeaderProps> = ({
  onCreateSOP,
  canCreateSOP = true,
  onRefreshStats,
  totalSOPs = 0,
  totalEmployeesInvolved = 0,
  totalSOPsSignedOff = 0,
  totalSOPsToBeDone = 0,
  loading = false,
}) => {
  const { state } = useEmployeeStore();
  const isSuperAdmin = isEmployeeSuperAdmin(state);
  const employeeData = getEmployeeData(state);
  const { client } = useClient();
  const navigate = useNavigate();

  const resolvedClientId = employeeData?.clientId || employeeData?.client?.id || client?.id || null;
  const employeeId = employeeData?.id || null;

  const handleAssignedSOP = () => navigate('/sops/assigned');

  // Real-time hooks that cover tables not watched by SOPPage:
  // sop_signoff_request, group_employees, groups — trigger parent to re-fetch SOPs
  useRealTimeSubHook({
    channelName: 'sop-header-signoff',
    events: ['INSERT', 'UPDATE', 'DELETE'],
    table: 'sop_signoff_request',
    filter: resolvedClientId ? `client_id=eq.${resolvedClientId}` : undefined,
    enabled: !!resolvedClientId && isSuperAdmin,
    onPayload: () => onRefreshStats?.(),
  });

  useRealTimeSubHook({
    channelName: 'sop-header-group-employees',
    events: ['INSERT', 'UPDATE', 'DELETE'],
    table: 'group_employees',
    enabled: !!resolvedClientId && isSuperAdmin,
    onPayload: () => onRefreshStats?.(),
  });

  useRealTimeSubHook({
    channelName: 'sop-header-groups',
    events: ['INSERT', 'UPDATE', 'DELETE'],
    table: 'groups',
    filter: resolvedClientId ? `client_id=eq.${resolvedClientId}` : undefined,
    enabled: !!resolvedClientId && isSuperAdmin,
    onPayload: () => onRefreshStats?.(),
  });

  // Employee view: signoff and assignment changes
  useRealTimeSubHook({
    channelName: 'sop-header-employee-signoff',
    events: ['INSERT', 'UPDATE', 'DELETE'],
    table: 'sop_signoff_request',
    filter: resolvedClientId ? `client_id=eq.${resolvedClientId}` : undefined,
    enabled: !!resolvedClientId && !isSuperAdmin && !!employeeId,
    onPayload: () => onRefreshStats?.(),
  });

  useRealTimeSubHook({
    channelName: 'sop-header-employee-assigned',
    events: ['INSERT', 'UPDATE', 'DELETE'],
    table: 'sop_assigned',
    filter: resolvedClientId ? `client_id=eq.${resolvedClientId}` : undefined,
    enabled: !!resolvedClientId && !isSuperAdmin && !!employeeId,
    onPayload: () => onRefreshStats?.(),
  });

  if (!isSuperAdmin) {
    // Non-super admin: show employee-specific statistics
    return (
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4 flex-1">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50">
            <FileText className="h-6 w-6 text-primary" />
          </div>

          <div className="flex-1">
            <h1 className="text-2xl font-bold">SOP</h1>
            <p className="text-gray-500 text-sm">
              Standard Operating Procedures - Create, manage, and review operational procedures
            </p>

              {/* Metrics in one row with 3 columns */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
                {/* Total SOPs */}
              <div>
                <p className="text-sm text-gray-500">Total SOPs</p>
                <p className="text-3xl font-semibold text-gray-900">
                  {loading ? <InlineLoader /> : totalSOPs}
                </p>
              </div>

                {/* Total SOPs Signed off */}
              <div>
                <p className="text-sm text-gray-500">Total SOPs Signed off</p>
                <p className="text-3xl font-semibold text-green-600">
                  {loading ? <InlineLoader /> : totalSOPsSignedOff}
                </p>
              </div>

                {/* To be Done */}
              <div>
                <p className="text-sm text-gray-500">To be Done</p>
                <p className="text-3xl font-semibold text-orange-600">
                  {loading ? <InlineLoader /> : totalSOPsToBeDone}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Super admin: show statistics header
  return (
    <div className="flex items-start justify-between">
      <div className="flex items-start gap-4 flex-1">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50">
          <BookOpen className="h-6 w-6 text-primary" />
        </div>

        <div className="flex-1">
          <h1 className="text-2xl font-bold">SOP</h1>
          <p className="text-gray-500 text-sm">
            Standard Operating Procedures - Create, manage, and review operational procedures
          </p>

            {/* Metrics in one row with 4 columns */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Total SOPs */}
            <div>
              <p className="text-sm text-gray-500">Total SOPs</p>
              <p className="text-3xl font-semibold text-gray-900">
                {loading ? <InlineLoader /> : totalSOPs}
              </p>
            </div>

             {/* Number of Employees Involved */}
            <div>
              <p className="text-sm text-gray-500">Number of Employees Involved</p>
              <p className="text-3xl font-semibold text-gray-900">
                {loading ? <InlineLoader /> : totalEmployeesInvolved}
              </p>
            </div>
              {/* Total SOPs Signed off */}
            <div>
              <p className="text-sm text-gray-500">Total SOPs Signed off</p>
              <p className="text-3xl font-semibold text-green-600">
                {loading ? <InlineLoader /> : totalSOPsSignedOff}
              </p>
            </div>

              {/* To be Done */}
            <div>
              <p className="text-sm text-gray-500">To be Done</p>
              <p className="text-3xl font-semibold text-orange-600">
                {loading ? <InlineLoader /> : totalSOPsToBeDone}
              </p>
            </div>
          </div>
      
            {/* Assigned SOP link below metrics */}
          <button
            onClick={handleAssignedSOP}
            className="mt-4 inline-flex items-center gap-1 text-sm text-orange-600 hover:underline"
          >
            <ExternalLink className="h-4 w-4" />
            View all Assigned SOPs →
          </button>
        </div>
      </div>

        {/* Add SOP button in top right */}
      {canCreateSOP && (
        <Button 
          onClick={onCreateSOP} 
          className="flex items-center gap-2"
        >
          <PlusCircle className="h-4 w-4" />
          Add SOP
        </Button>
      )}
    </div>
  );
};

export default SOPHeader;

