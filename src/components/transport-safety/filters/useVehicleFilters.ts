
import { useState, useMemo, useEffect } from 'react';
import { Vehicle } from '@/types/transportSafety';
import { 
  hasExpiredDocuments, 
  hasExpiringDocuments, 
  hasAllValidDocuments,
  hasValidVehicle
} from '@/utils/transport-safety/documentStatusUtils';
import { useSearchParams } from 'react-router-dom';

interface DocumentStatusFilters {
  valid: boolean;
  expired: boolean;
  expiring_soon: boolean;
}

export const useVehicleFilters = (vehicles: Vehicle[]) => {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [documentTypeFilter, setDocumentTypeFilter] = useState('all');
  const [documentStatusFilters, setDocumentStatusFilters] = useState<DocumentStatusFilters>({
    valid: false,
    expired: false,
    expiring_soon: false,
  });

  // Parse URL parameters and set initial filters
  useEffect(() => {
    const filterParam = searchParams.get('filter');
    if (filterParam) {
      console.log('🔍 Transport Safety - URL filter parameter found:', filterParam);
      
      // Map filter parameter to document status filters
      switch (filterParam) {
        case 'verified':
          // Show only vehicles with all valid documents
          setDocumentStatusFilters({
            valid: true,
            expired: false,
            expiring_soon: false,
          });
          break;
        case 'expired':
          // Show only vehicles with expired documents
          setDocumentStatusFilters({
            valid: false,
            expired: true,
            expiring_soon: false,
          });
          break;
        case 'expiring_soon':
          // Show only vehicles with expiring soon documents
          setDocumentStatusFilters({
            valid: false,
            expired: false,
            expiring_soon: true,
          });
          break;
        default:
          // No specific filter applied
          break;
      }
    }
  }, [searchParams]);

  // Use the exact type values from the Vehicle type
  const vehicleTypes = useMemo(() => {
    return [...new Set(vehicles.map(vehicle => vehicle.type))];
  }, [vehicles]);

  const hasActiveDocumentStatusFilters = useMemo(() => {
    return Object.values(documentStatusFilters).some(value => value);
  }, [documentStatusFilters]);

  const toggleDocumentStatusFilter = (status: 'valid' | 'expired' | 'expiring_soon') => {
    setDocumentStatusFilters(prev => ({
      ...prev,
      [status]: !prev[status]
    }));
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (statusFilter !== 'all') count++;
    if (typeFilter !== 'all') count++;
    if (documentTypeFilter !== 'all') count++;
    if (documentStatusFilters.valid) count++;
    if (documentStatusFilters.expired) count++;
    if (documentStatusFilters.expiring_soon) count++;
    return count;
  };

  const clearAllFilters = () => {
    setStatusFilter('all');
    setTypeFilter('all');
    setDocumentTypeFilter('all');
    setDocumentStatusFilters({
      valid: false,
      expired: false,
      expiring_soon: false,
    });
    setSearchQuery('');
  };

  const filteredVehicles = useMemo(() => {
    return vehicles.filter(vehicle => {
      // Basic filters
      const matchesSearch = searchQuery 
        ? vehicle.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          `${vehicle.make} ${vehicle.model}`.toLowerCase().includes(searchQuery.toLowerCase())
        : true;
      
      const matchesStatus = statusFilter === 'all' ? true : vehicle.status === statusFilter;
      const matchesType = typeFilter === 'all' ? true : vehicle.type === typeFilter;
      
      // Document status filters with enhanced logic
      let matchesDocumentStatus = true;
      
      if (hasActiveDocumentStatusFilters) {
        if (documentStatusFilters.valid && !documentStatusFilters.expired && !documentStatusFilters.expiring_soon) {
          // Only valid selected - show vehicles that are considered valid (at least 2/3 certificates valid or expiring soon)
          matchesDocumentStatus = hasValidVehicle(vehicle);
        } else if (documentStatusFilters.expired && !documentStatusFilters.valid && !documentStatusFilters.expiring_soon) {
          // Only expired selected - show vehicles with ANY expired documents
          matchesDocumentStatus = hasExpiredDocuments(vehicle);
        } else if (documentStatusFilters.expiring_soon && !documentStatusFilters.valid && !documentStatusFilters.expired) {
          // Only expiring soon selected - show vehicles with ANY expiring soon documents
          matchesDocumentStatus = hasExpiringDocuments(vehicle);
        } else {
          // Multiple filters selected - OR logic between the different statuses
          matchesDocumentStatus = 
            (documentStatusFilters.valid && hasValidVehicle(vehicle)) || 
            (documentStatusFilters.expired && hasExpiredDocuments(vehicle)) || 
            (documentStatusFilters.expiring_soon && hasExpiringDocuments(vehicle));
        }
      }
      
      // Document type filter
      let matchesDocumentType = true;
      if (documentTypeFilter !== 'all') {
        const relevantDocuments = vehicle.documents.filter(doc => 
          doc.type === documentTypeFilter
        );
        
        matchesDocumentType = relevantDocuments.length > 0;
      }
      
      return matchesSearch && matchesStatus && matchesType && matchesDocumentType && 
        (hasActiveDocumentStatusFilters ? matchesDocumentStatus : true);
    });
  }, [
    vehicles, 
    searchQuery, 
    statusFilter, 
    typeFilter, 
    documentTypeFilter, 
    documentStatusFilters,
    hasActiveDocumentStatusFilters
  ]);

  const activeFiltersCount = getActiveFiltersCount();

  return {
    // State
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
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
