import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, UserCheck, FileText, ExternalLink } from 'lucide-react';
import { useEmployeeStore } from '@/store/EmployeeContext';
import { isEmployeeSuperAdmin, getEmployeeData } from '@/store/employeeSelectors';
import { useNavigate } from 'react-router-dom';
import { useClient } from '@/contexts/ClientContext';
import { useRealTimeSubHook } from '@/hooks/useRealTimeSubHook';
import {
  getAllSOPStatistics,
  getTotalSOPsCount,
  getTotalEmployeesInvolved,
  getTotalSOPsSignedOff,
  getTotalSOPsToBeDone,
  getEmployeeSOPStatistics,
} from '@/services/sop/sopStatisticsService';

interface SOPHeaderProps {
  onCreateSOP?: () => void;
  onStatisticsRefresh?: () => void;
}

const SOPHeader: React.FC<SOPHeaderProps> = ({ onCreateSOP, onStatisticsRefresh }) => {
  const { state } = useEmployeeStore();
  const employeeData = getEmployeeData(state);
  const isSuperAdmin = isEmployeeSuperAdmin(state);
  const { client } = useClient();
  const navigate = useNavigate();

  // Resolve clientId
  const resolvedClientId = employeeData?.clientId || employeeData?.client?.id || client?.id || null;
  const employeeId = employeeData?.id || null;

  // Statistics state
  const [totalSOPs, setTotalSOPs] = useState(0);
  const [totalEmployeesInvolved, setTotalEmployeesInvolved] = useState(0);
  const [totalSOPsSignedOff, setTotalSOPsSignedOff] = useState(0);
  const [totalSOPsToBeDone, setTotalSOPsToBeDone] = useState(0);
  const [loading, setLoading] = useState(true);

  // Employee-specific statistics state (for non-super admin)
  const [employeeTotalSOPs, setEmployeeTotalSOPs] = useState(0);
  const [employeeTotalSOPsSignedOff, setEmployeeTotalSOPsSignedOff] = useState(0);
  const [employeeTotalSOPsToBeDone, setEmployeeTotalSOPsToBeDone] = useState(0);
  const [employeeLoading, setEmployeeLoading] = useState(true);

  // Fetch all statistics (for super admin)
  const fetchStatistics = useCallback(async () => {
    if (!resolvedClientId || !isSuperAdmin) {
      setLoading(false);
      return;
    }

    try {
      console.log('[SOPHeader] Fetching statistics...', { resolvedClientId, employeeId });
      setLoading(true);
      const stats = await getAllSOPStatistics(resolvedClientId, employeeId);
      console.log('[SOPHeader] Statistics fetched:', stats);
      setTotalSOPs(stats.totalSOPs);
      setTotalEmployeesInvolved(stats.totalEmployeesInvolved);
      setTotalSOPsSignedOff(stats.totalSOPsSignedOff);
      setTotalSOPsToBeDone(stats.totalSOPsToBeDone);
      
      // Notify parent that statistics were refreshed
      if (onStatisticsRefresh) {
        onStatisticsRefresh();
      }
    } catch (error) {
      console.error('[SOPHeader] Error fetching SOP statistics:', error);
    } finally {
      setLoading(false);
    }
  }, [resolvedClientId, employeeId, isSuperAdmin, onStatisticsRefresh]);

  // Fetch employee-specific statistics (for non-super admin)
  const fetchEmployeeStatistics = useCallback(async () => {
    if (!resolvedClientId || !employeeId || isSuperAdmin) {
      setEmployeeLoading(false);
      return;
    }

    try {
      console.log('[SOPHeader] Fetching employee statistics...', { resolvedClientId, employeeId });
      setEmployeeLoading(true);
      const stats = await getEmployeeSOPStatistics(resolvedClientId, employeeId);
      console.log('[SOPHeader] Employee statistics fetched:', stats);
      setEmployeeTotalSOPs(stats.totalSOPs);
      setEmployeeTotalSOPsSignedOff(stats.totalSOPsSignedOff);
      setEmployeeTotalSOPsToBeDone(stats.totalSOPsToBeDone);
    } catch (error) {
      console.error('[SOPHeader] Error fetching employee SOP statistics:', error);
    } finally {
      setEmployeeLoading(false);
    }
  }, [resolvedClientId, employeeId, isSuperAdmin]);

  // Initial fetch
  useEffect(() => {
    if (isSuperAdmin) {
      fetchStatistics();
    } else {
      fetchEmployeeStatistics();
    }
  }, [fetchStatistics, fetchEmployeeStatistics, isSuperAdmin]);

  // Real-time updates for SOP table
  useRealTimeSubHook({
    channelName: 'sop-stats-sop',
    events: ['INSERT', 'UPDATE', 'DELETE'],
    table: 'sop',
    filter: resolvedClientId ? `client_id=eq.${resolvedClientId}` : undefined,
    enabled: !!resolvedClientId && isSuperAdmin,
    onPayload: (payload) => {
      console.log('[SOPHeader] Real-time update from sop table:', payload.eventType, payload);
      // Small delay to ensure database transaction is committed
      setTimeout(() => {
        fetchStatistics();
      }, 100);
    },
    onStatusChange: (status) => {
      console.log('[SOPHeader] sop table subscription status:', status);
    },
  });

  // Real-time updates for sop_assigned table
  useRealTimeSubHook({
    channelName: 'sop-stats-assigned',
    events: ['INSERT', 'UPDATE', 'DELETE'],
    table: 'sop_assigned',
    filter: resolvedClientId ? `client_id=eq.${resolvedClientId}` : undefined,
    enabled: !!resolvedClientId && isSuperAdmin,
    onPayload: (payload) => {
      console.log('[SOPHeader] Real-time update from sop_assigned table:', payload.eventType, payload);
      // Small delay to ensure database transaction is committed
      setTimeout(() => {
        fetchStatistics();
      }, 100);
    },
    onStatusChange: (status) => {
      console.log('[SOPHeader] sop_assigned table subscription status:', status);
    },
  });

  // Real-time updates for sop_signoff_request table
  useRealTimeSubHook({
    channelName: 'sop-stats-signoff',
    events: ['INSERT', 'UPDATE', 'DELETE'],
    table: 'sop_signoff_request',
    filter: resolvedClientId ? `client_id=eq.${resolvedClientId}` : undefined,
    enabled: !!resolvedClientId && isSuperAdmin,
    onPayload: (payload) => {
      console.log('[SOPHeader] Real-time update from sop_signoff_request table:', payload.eventType, payload);
      // Small delay to ensure database transaction is committed
      setTimeout(() => {
        fetchStatistics();
      }, 100);
    },
    onStatusChange: (status) => {
      console.log('[SOPHeader] sop_signoff_request table subscription status:', status);
    },
  });

  // Real-time updates for group_employees table (affects employee count)
  useRealTimeSubHook({
    channelName: 'sop-stats-group-employees',
    events: ['INSERT', 'UPDATE', 'DELETE'],
    table: 'group_employees',
    enabled: !!resolvedClientId && isSuperAdmin,
    onPayload: (payload) => {
      console.log('[SOPHeader] Real-time update from group_employees table:', payload.eventType, payload);
      // Small delay to ensure database transaction is committed
      setTimeout(() => {
        fetchStatistics();
      }, 100);
    },
    onStatusChange: (status) => {
      console.log('[SOPHeader] group_employees table subscription status:', status);
    },
  });

  // Real-time updates for groups table (affects employee count when groups are created/updated)
  useRealTimeSubHook({
    channelName: 'sop-stats-groups',
    events: ['INSERT', 'UPDATE', 'DELETE'],
    table: 'groups',
    filter: resolvedClientId ? `client_id=eq.${resolvedClientId}` : undefined,
    enabled: !!resolvedClientId && isSuperAdmin,
    onPayload: (payload) => {
      console.log('[SOPHeader] Real-time update from groups table:', payload.eventType, payload);
      // Small delay to ensure database transaction is committed
      setTimeout(() => {
        fetchStatistics();
      }, 100);
    },
    onStatusChange: (status) => {
      console.log('[SOPHeader] groups table subscription status:', status);
    },
  });

  // Real-time updates for non-super admin: sop_assigned table
  useRealTimeSubHook({
    channelName: 'sop-stats-employee-assigned',
    events: ['INSERT', 'UPDATE', 'DELETE'],
    table: 'sop_assigned',
    filter: resolvedClientId ? `client_id=eq.${resolvedClientId}` : undefined,
    enabled: !!resolvedClientId && !isSuperAdmin && !!employeeId,
    onPayload: (payload) => {
      console.log('[SOPHeader] Real-time update from sop_assigned table (employee):', payload.eventType, payload);
      setTimeout(() => {
        fetchEmployeeStatistics();
      }, 100);
    },
  });

  // Real-time updates for non-super admin: sop_signoff_request table
  useRealTimeSubHook({
    channelName: 'sop-stats-employee-signoff',
    events: ['INSERT', 'UPDATE', 'DELETE'],
    table: 'sop_signoff_request',
    filter: resolvedClientId ? `client_id=eq.${resolvedClientId}` : undefined,
    enabled: !!resolvedClientId && !isSuperAdmin && !!employeeId,
    onPayload: (payload) => {
      console.log('[SOPHeader] Real-time update from sop_signoff_request table (employee):', payload.eventType, payload);
      setTimeout(() => {
        fetchEmployeeStatistics();
      }, 100);
    },
  });

  // Real-time updates for non-super admin: group_employees table
  useRealTimeSubHook({
    channelName: 'sop-stats-employee-group-employees',
    events: ['INSERT', 'UPDATE', 'DELETE'],
    table: 'group_employees',
    enabled: !!resolvedClientId && !isSuperAdmin && !!employeeId,
    onPayload: (payload) => {
      console.log('[SOPHeader] Real-time update from group_employees table (employee):', payload.eventType, payload);
      setTimeout(() => {
        fetchEmployeeStatistics();
      }, 100);
    },
  });

  const handleCreateSOP = () => {
    console.log("Create SOP button clicked");
    if (onCreateSOP) {
      onCreateSOP();
    }
  };

  const handleAssignedSOP = () => {
    navigate('/sops/assigned');
  };

  if (!isSuperAdmin) {
    // Non-super admin: show employee-specific statistics
  return (
      <div className="mx-6 mb-8 bg-gradient-to-r from-blue-50 to-transparent rounded-xl border border-blue-100 bg-white p-6 shadow-sm">
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
                    {employeeLoading ? '-' : employeeTotalSOPs}
                  </p>
                </div>

                {/* Total SOPs Signed off */}
                <div>
                  <p className="text-sm text-gray-500">Total SOPs Signed off</p>
                  <p className="text-3xl font-semibold text-green-600">
                    {employeeLoading ? '-' : employeeTotalSOPsSignedOff}
                  </p>
                </div>

                {/* To be Done */}
                <div>
                  <p className="text-sm text-gray-500">To be Done</p>
                  <p className="text-3xl font-semibold text-orange-600">
                    {employeeLoading ? '-' : employeeTotalSOPsToBeDone}
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
        </div>
      </div>
    );
  }

  // Super admin: show statistics header
  return (
    <div className="mx-6 mb-8 bg-gradient-to-r from-blue-50 to-transparent rounded-xl border border-blue-100 bg-white p-6 shadow-sm">
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

            {/* Metrics in one row with 4 columns */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Total SOPs */}
              <div>
                <p className="text-sm text-gray-500">Total SOPs</p>
                <p className="text-3xl font-semibold text-gray-900">
                  {loading ? '-' : totalSOPs}
                </p>
              </div>

              {/* Total SOPs Signed off */}
              <div>
                <p className="text-sm text-gray-500">Total SOPs Signed off</p>
                <p className="text-3xl font-semibold text-green-600">
                  {loading ? '-' : totalSOPsSignedOff}
                </p>
              </div>

              {/* Number of Employees Involved */}
              <div>
                <p className="text-sm text-gray-500">Number of Employees Involved</p>
                <p className="text-3xl font-semibold text-gray-900">
                  {loading ? '-' : totalEmployeesInvolved}
                </p>
              </div>

              {/* To be Done */}
              <div>
                <p className="text-sm text-gray-500">To be Done</p>
                <p className="text-3xl font-semibold text-orange-600">
                  {loading ? '-' : totalSOPsToBeDone}
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
          <Button 
            onClick={handleCreateSOP}
            className="flex items-center gap-2"
          >
            <PlusCircle className="h-4 w-4" />
            Add SOP
          </Button>
        </div>
    </div>
  );
};

export default SOPHeader;

