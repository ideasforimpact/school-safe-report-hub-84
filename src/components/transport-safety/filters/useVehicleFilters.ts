
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
import { useAuth } from '@/contexts/auth';
import { getAllVehicles } from '@/services/transport-safety/vehicleService';

interface DocumentStatusFilters {
  valid: boolean;
  expired: boolean;
  expiring_soon: boolean;
}

export interface VehiclePagination {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export const useVehicleFilters = (vehicles: Vehicle[]) => {
  const {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    currentPage,
    setCurrentPage,
    totalPages,
    totalCount,
    pageSize,
  } = useTransportSafety();

  const { user, employeeData } = useAuth();
  const clientId = employeeData?.clientId || user?.clientId;

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

  // Document status/type filters are computed client-side (they depend on
  // derived verification data, not a plain DB column), so they can't be pushed
  // into the server's paginated `list` query. Whenever one is active we fetch
  // every vehicle matching the server-side filters (search/status/type) and
  // paginate the filtered result ourselves. Without this, filtering only runs
  // over the single page of 10 rows the server already sliced off, so a page
  // can show fewer than pageSize matches even when more exist on later pages.
  const isClientFilterActive = hasActiveDocumentStatusFilters || documentTypeFilter !== 'all';

  const [allMatchingVehicles, setAllMatchingVehicles] = useState<Vehicle[]>([]);
  const [isFetchingAllMatching, setIsFetchingAllMatching] = useState(false);
  const [clientPage, setClientPage] = useState(1);

  useEffect(() => {
    if (!isClientFilterActive || !clientId) return;
    let cancelled = false;

    setIsFetchingAllMatching(true);
    getAllVehicles(clientId, { search: searchQuery, status: statusFilter, typeId: typeFilter })
      .then(result => {
        if (!cancelled) setAllMatchingVehicles(result);
      })
      .catch(() => {
        if (!cancelled) setAllMatchingVehicles([]);
      })
      .finally(() => {
        if (!cancelled) setIsFetchingAllMatching(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isClientFilterActive, clientId, searchQuery, statusFilter, typeFilter]);

  // Reset back to page 1 whenever the active filter set changes
  useEffect(() => {
    setClientPage(1);
  }, [documentTypeFilter, documentStatusFilters, searchQuery, statusFilter, typeFilter]);

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

  // Source data: the server's current page when no client-side filter is
  // active (existing behavior, unchanged), or every server-filtered vehicle
  // once a document status/type filter needs to run over the full dataset.
  const sourceVehicles = isClientFilterActive ? allMatchingVehicles : vehicles;

  // Client-side filtering: document status and document type filters
  // (search, status, type are handled server-side)
  const documentMatchedVehicles = useMemo(() => {
    return sourceVehicles.filter(vehicle => {
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
  }, [sourceVehicles, documentTypeFilter, documentStatusFilters, hasActiveDocumentStatusFilters]);

  // Pagination: server-owned when no client-side filter is active (unchanged
  // behavior), self-owned (slicing the full filtered set) once one is — so
  // "Showing X-Y of Z" and page count always match what's actually rendered.
  const pagination: VehiclePagination = isClientFilterActive
    ? {
        currentPage: clientPage,
        totalPages: Math.max(1, Math.ceil(documentMatchedVehicles.length / pageSize)),
        totalCount: documentMatchedVehicles.length,
        pageSize,
        onPageChange: setClientPage,
      }
    : {
        currentPage,
        totalPages,
        totalCount,
        pageSize,
        onPageChange: setCurrentPage,
      };

  const filteredVehicles = useMemo(() => {
    if (!isClientFilterActive) return documentMatchedVehicles;
    const start = (clientPage - 1) * pageSize;
    return documentMatchedVehicles.slice(start, start + pageSize);
  }, [isClientFilterActive, documentMatchedVehicles, clientPage, pageSize]);

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
    filteredTotalCount: documentMatchedVehicles.length,
    activeFiltersCount,
    hasActiveDocumentStatusFilters,
    isClientFilterActive,
    isFetchingAllMatching,
    pagination,

    // Actions
    toggleDocumentStatusFilter,
    clearAllFilters,
  };
};
