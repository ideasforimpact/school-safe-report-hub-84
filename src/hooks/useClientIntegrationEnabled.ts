import { useMemo } from 'react';
import { useAuth } from '@/contexts/auth';

/**
 * Custom hook to check if the logged-in client has integration data enabled
 * @returns {object} - Object containing isIntegrationEnabled boolean and integration data
 */
export const useClientIntegrationEnabled = () => {
  const { employeeData } = useAuth();

  const isIntegrationEnabled = useMemo(() => {
    // Check if employeeData and client_integration exist
    if (!employeeData?.client_integration || !Array.isArray(employeeData.client_integration)) {
      return false;
    }

    // Get current client ID
    const currentClientId = employeeData.clientId;

    if (!currentClientId) {
      return false;
    }

    // Find integration record where client_id matches current client and active is true
    const enabledIntegration = employeeData.client_integration.find(
      (integration) => 
        integration.client_id === currentClientId && 
        integration.active === true
    );

    return !!enabledIntegration;
  }, [employeeData?.client_integration, employeeData?.clientId]);

  // Get the enabled integration data for the current client
  const enabledIntegrationData = useMemo(() => {
    if (!employeeData?.client_integration || !Array.isArray(employeeData.client_integration)) {
      return null;
    }

    const currentClientId = employeeData.clientId;
    if (!currentClientId) {
      return null;
    }

    return employeeData.client_integration.find(
      (integration) => 
        integration.client_id === currentClientId && 
        integration.active === true
    ) || null;
  }, [employeeData?.client_integration, employeeData?.clientId]);

  return {
    isIntegrationEnabled,
    enabledIntegrationData,
    clientIntegration: employeeData?.client_integration || null
  };
};

