import { useMemo } from 'react';
import { useAuth } from '@/contexts/auth';

/**
 * Custom hook to check if the current client has an active linked integration
 * @returns {boolean} - true if client has an active linked integration, false otherwise
 */
export const useClientIntegration = () => {
  const { employeeData } = useAuth();

  const isClientLinked = useMemo(() => {
    // Check if employeeData and client_integration exist
    if (!employeeData?.client_integration || !Array.isArray(employeeData.client_integration)) {
      return false;
    }

    // Get current client ID
    const currentClientId = employeeData.clientId;

    if (!currentClientId) {
      return false;
    }

    // Find integration record where client_id matches current client and is_linked is true
    const linkedIntegration = employeeData.client_integration.find(
      (integration) => 
        integration.client_id === currentClientId && 
        integration.is_linked === true &&
        integration.active === true
    );

    return !!linkedIntegration;
  }, [employeeData?.client_integration, employeeData?.clientId]);

  return {
    isClientLinked,
    clientIntegration: employeeData?.client_integration || null
  };
};






