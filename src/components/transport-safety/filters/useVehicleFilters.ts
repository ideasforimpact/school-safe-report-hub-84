
import { useState, useMemo, useEffect } from 'react';
import { Vehicle } from '@/types/transportSafety';
import {
  hasExpiredDocuments,
  hasExpiringDocuments,
  hasValidVehicle,
} from '@/utils/transport-safety/documentStatusUtils';
import { useSearchParams } from 'react-router-dom';
import { getDocumentStatus } from '@/utils/transport-safety/documentStatusUtils';
import { useVehicleTypes } from '@/hooks/useVehicleTypes';
import { useTransportSafety } from '@/contexts/transport-safety/TransportSafetyContext';

interface DocumentStatusFilters {
  valid: boolean;
  expired: boolean;
  expiring_soon: boolean;
}

export const useVehicleFilters = (vehicles: Vehicle[]) => {
  const {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
  } = useTransportSafety();

  const [searchParams] = useSearchParams();
  const { vehicleTypes } = useVehicleTypes();

  const [documentTypeFilter, setDocumentTypeFilter] = useState('all');
  const [documentStatusFilters, setDocumentStatusFilters] = useState<DocumentStatusFilters>({
    valid: false,
    expired: false,
    expiring_soon: false,
  });

  // Parse URL parameters for document status pre-filter
  useEffect(() => {
    const filterParam = searchParams.get('filter');
    if (filterParam) {
      switch (filterParam) {
        case 'verified':
          setDocumentStatusFilters({ valid: true, expired: false, expiring_soon: false });
          break;
        case 'expired':
          setDocumentStatusFilters({ valid: false, expired: true, expiring_soon: false });
          break;
        case 'expiring_soon':
          setDocumentStatusFilters({ valid: false, expired: false, expiring_soon: true });
          break;
        default:
          break;
      }
    }
  }, [searchParams]);

  const hasActiveDocumentStatusFilters = useMemo(
    () => Object.values(documentStatusFilters).some(Boolean),
    [documentStatusFilters],
  );

  const toggleDocumentStatusFilter = (status: 'valid' | 'expired' | 'expiring_soon') => {
    setDocumentStatusFilters(prev => ({ ...prev, [status]: !prev[status] }));
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (searchQuery.trim() !== '') count++;
    if (statusFilter !== '' && statusFilter !== 'all') count++;
    if (typeFilter !== '' && typeFilter !== 'all') count++;
    if (documentTypeFilter !== 'all') count++;
    if (documentStatusFilters.valid) count++;
    if (documentStatusFilters.expired) count++;
    if (documentStatusFilters.expiring_soon) count++;
    return count;
  };

  const clearAllFilters = () => {
    setStatusFilter('');
    setTypeFilter('');
    setSearchQuery('');
    setDocumentTypeFilter('all');
    setDocumentStatusFilters({ valid: false, expired: false, expiring_soon: false });
  };

  // Client-side filtering: only document status and document type filters
  // (search, status, type are handled server-side)
  const filteredVehicles = useMemo(() => {
    return vehicles.filter(vehicle => {
      // Document type filter
      let matchesDocumentType = true;
      if (documentTypeFilter !== 'all') {
        matchesDocumentType = vehicle.documents.some(doc => doc.type === documentTypeFilter);
      }

      // Document status filters
      let matchesDocumentStatus = true;
      if (hasActiveDocumentStatusFilters) {
        const insuranceStatus = getDocumentStatus(vehicle, 'insurance').status;
        const fcStatus = getDocumentStatus(vehicle, 'fitness').status;
        const pollutionStatus = getDocumentStatus(vehicle, 'pollution').status;
        const isStrictValid =
          insuranceStatus === 'valid' && fcStatus === 'valid' && pollutionStatus === 'valid';

        if (documentStatusFilters.valid && !documentStatusFilters.expired && !documentStatusFilters.expiring_soon) {
          matchesDocumentStatus = isStrictValid;
        } else if (documentStatusFilters.expired && !documentStatusFilters.valid && !documentStatusFilters.expiring_soon) {
          matchesDocumentStatus = hasExpiredDocuments(vehicle);
        } else if (documentStatusFilters.expiring_soon && !documentStatusFilters.valid && !documentStatusFilters.expired) {
          matchesDocumentStatus = hasExpiringDocuments(vehicle);
        } else {
          matchesDocumentStatus =
            (documentStatusFilters.valid && hasValidVehicle(vehicle)) ||
            (documentStatusFilters.expired && hasExpiredDocuments(vehicle)) ||
            (documentStatusFilters.expiring_soon && hasExpiringDocuments(vehicle));
        }
      }

      return matchesDocumentType && (hasActiveDocumentStatusFilters ? matchesDocumentStatus : true);
    });
  }, [vehicles, documentTypeFilter, documentStatusFilters, hasActiveDocumentStatusFilters]);

  const activeFiltersCount = getActiveFiltersCount();

  return {
    // Server-side filter state (from context)
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,

    // Client-side filter state
    documentTypeFilter,
    setDocumentTypeFilter,
    documentStatusFilters,

    // Derived values
    vehicleTypes,
    filteredVehicles,
    activeFiltersCount,
    hasActiveDocumentStatusFilters,

    // Actions
    toggleDocumentStatusFilter,
    clearAllFilters,
  };
};
