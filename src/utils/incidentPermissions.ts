
import { useEmployeeStore } from '@/store/EmployeeContext';
import { isEmployeeSuperAdmin } from '@/store/employeeSelectors';
import React from 'react';

export interface IncidentPermissionContext {
  incidentCreatedBy: string;
  incidentAssignedTo?: string;
  currentEmployeeId?: string;
  hasIncidentAdmin: boolean;
  isSuperAdmin: boolean;
}

/**
 * Check if a user can view an incident
 */
export const canViewIncident = (context: IncidentPermissionContext): boolean => {
  const { incidentCreatedBy, incidentAssignedTo, currentEmployeeId, hasIncidentAdmin, isSuperAdmin } = context;
  
  if (!currentEmployeeId) return false;
  
  // Super admin can view all incidents
  if (isSuperAdmin) return true;
  
  // Incident admin can view all incidents
  if (hasIncidentAdmin) return true;
  
  // Check if user created the incident
  const isCreator = incidentCreatedBy === currentEmployeeId;
  
  // Check if user is assigned to the incident
  const isAssigned = incidentAssignedTo === currentEmployeeId;
  
  // Non-admin can only view their own incidents or assigned incidents
  return isCreator || isAssigned;
};

/**
 * Check if a user can edit an incident
 */
export const canEditIncident = (context: IncidentPermissionContext): boolean => {
  const { incidentCreatedBy, incidentAssignedTo, currentEmployeeId, hasIncidentAdmin, isSuperAdmin } = context;
  
  if (!currentEmployeeId) return false;
  
  // Super admin can edit all incidents
  if (isSuperAdmin) return true;
  
  // Check if user created the incident
  const isCreator = incidentCreatedBy === currentEmployeeId;
  
  // Check if user is assigned to the incident
  const isAssigned = incidentAssignedTo === currentEmployeeId;
  
  // Both incident admin and non-admin can only edit own + assigned incidents
  return isCreator || isAssigned;
};

/**
 * Check if a user can close an incident
 */
export const canCloseIncident = (context: IncidentPermissionContext): boolean => {
  // Same permissions as edit for now
  return canEditIncident(context);
};

/**
 * Check if a user can reopen an incident
 */
export const canReopenIncident = (context: IncidentPermissionContext): boolean => {
  // Same permissions as edit for now
  return canEditIncident(context);
};

/**
 * Hook to get incident permissions for current user
 */
export const useIncidentPermissions = () => {
  const { state } = useEmployeeStore();
  
  const isSuperAdmin = isEmployeeSuperAdmin(state);
  const currentEmployeeId = state.employeeData?.id;
  
  // Check if user has incident admin access
  const hasIncidentAdmin = React.useMemo(() => {
    if (isSuperAdmin) return true;
    
    const incidentsModule = state.configuredModules?.find(
      module => module.name.toLowerCase() === 'incidents'
    );
    
    return incidentsModule?.accessLevel?.is_admin === true;
  }, [isSuperAdmin, state.configuredModules]);
  
  const checkPermissions = React.useCallback((
    incidentCreatedBy: string,
    incidentAssignedTo?: string
  ) => {
    const context: IncidentPermissionContext = {
      incidentCreatedBy,
      incidentAssignedTo,
      currentEmployeeId,
      hasIncidentAdmin,
      isSuperAdmin
    };
    
    return {
      canView: canViewIncident(context),
      canEdit: canEditIncident(context),
      canClose: canCloseIncident(context),
      canReopen: canReopenIncident(context)
    };
  }, [currentEmployeeId, hasIncidentAdmin, isSuperAdmin]);
  
  return {
    checkPermissions,
    hasIncidentAdmin,
    isSuperAdmin,
    currentEmployeeId
  };
};
