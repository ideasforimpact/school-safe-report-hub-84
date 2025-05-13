
import { useState, useMemo } from 'react';
import { Vehicle } from '@/types/transportSafety';
import { 
  hasExpiredDocuments, 
  hasExpiringDocuments, 
  hasAllValidDocuments 
} from '@/utils/transport-safety/documentStatusUtils';

interface DocumentStatusFilters {
  valid: boolean;
  expired: boolean;
  expiring_soon: boolean;
}

export const useVehicleFilters = (vehicles: Vehicle[]) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [documentTypeFilter, setDocumentTypeFilter] = useState('all');
  const [documentStatusFilters, setDocumentStatusFilters] = useState<DocumentStatusFilters>({
    valid: false,
    expired: false,
    expiring_soon: false,
  });

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
          // Only valid selected - show vehicles with ALL valid documents
          matchesDocumentStatus = hasAllValidDocuments(vehicle);
        } else if (documentStatusFilters.expired && !documentStatusFilters.valid && !documentStatusFilters.expiring_soon) {
          // Only expired selected - show vehicles with ANY expired documents
          matchesDocumentStatus = hasExpiredDocuments(vehicle);
        } else if (documentStatusFilters.expiring_soon && !documentStatusFilters.valid && !documentStatusFilters.expired) {
          // Only expiring soon selected - show vehicles with ANY expiring soon documents
          matchesDocumentStatus = hasExpiringDocuments(vehicle);
        } else {
          // Multiple filters selected - OR logic between the different statuses
          matchesDocumentStatus = 
            (documentStatusFilters.valid && hasAllValidDocuments(vehicle)) || 
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
