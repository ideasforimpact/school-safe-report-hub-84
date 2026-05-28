import { useTransportSafety } from '@/contexts/transport-safety/TransportSafetyContext';

export function useVehicleTypes() {
  const { vehicleTypes } = useTransportSafety();
  return { vehicleTypes, loading: false, error: null };
}
