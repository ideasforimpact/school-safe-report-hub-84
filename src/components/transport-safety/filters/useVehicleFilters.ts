
import { useState, useMemo } from 'react';
import { Vehicle } from '@/types/transportSafety';

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
      
      // Document filters
      let matchesDocumentType = true;
      let matchesDocumentStatus = !hasActiveDocumentStatusFilters;

      if (documentTypeFilter !== 'all' || hasActiveDocumentStatusFilters) {
        const relevantDocuments = vehicle.documents.filter(doc => 
          documentTypeFilter === 'all' ? true : doc.type === documentTypeFilter
        );
        
        // If we're filtering by document type and there are no matching documents
        if (documentTypeFilter !== 'all' && relevantDocuments.length === 0) {
          matchesDocumentType = false;
        }
        
        // Check document statuses if any status filters are active
        if (hasActiveDocumentStatusFilters) {
          matchesDocumentStatus = relevantDocuments.some(doc => {
            // Type safe check
            if (doc.status === 'valid' && documentStatusFilters.valid) return true;
            if (doc.status === 'expired' && documentStatusFilters.expired) return true;
            if (doc.status === 'expiring_soon' && documentStatusFilters.expiring_soon) return true;
            return false;
          });
        }
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
