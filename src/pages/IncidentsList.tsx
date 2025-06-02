
import { useState } from 'react';
import { useIncidents } from '@/contexts/incident';
import Layout from '@/components/layout/Layout';
import { useIncidentFilters } from '@/hooks/useIncidentFilters';
import IncidentsHeader from '@/components/incidents/IncidentsHeader';
import IncidentFilters from '@/components/incidents/IncidentFilters';
import IncidentsTable from '@/components/incidents/IncidentsTable';
import { useIncidentData } from '@/hooks/useIncidentData';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const IncidentsList = () => {
  const { incidents } = useIncidents();
  const { loading, error, refetchIncidents } = useIncidentData();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const {
    filters,
    filteredIncidents,
    availableCategories,
    availableSubcategories,
    availableLocations,
    availableFacilities,
    availableOwners,
    priorityOptions,
    statusOptions,
    locationOptions,
    handleFilterChange,
    toggleAdvancedFilters,
    clearFilters
  } = useIncidentFilters(incidents);

  // Count active filters
  const activeFilterCount = [
    filters.search && filters.search.trim() !== '',
    filters.location && filters.location !== '',
    filters.status && filters.status !== '',
    filters.category && filters.category !== '',
    filters.subcategory && filters.subcategory !== '',
    filters.priority && filters.priority !== '',
    filters.dateFrom && filters.dateFrom !== '',
    filters.dateTo && filters.dateTo !== ''
  ].filter(Boolean).length;

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetchIncidents();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <Layout>
        <div className="space-y-4 md:space-y-6 w-full overflow-x-hidden">
          <IncidentsHeader />
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="space-y-4">
              <Skeleton className="h-8 w-64" />
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Show error state with retry option
  if (error) {
    return (
      <Layout>
        <div className="space-y-4 md:space-y-6 w-full overflow-x-hidden">
          <IncidentsHeader />
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Incidents</h3>
              <p className="text-red-600 mb-4">{error}</p>
              <div className="space-x-2">
                <Button 
                  onClick={handleRefresh} 
                  disabled={isRefreshing}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  {isRefreshing ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Retrying...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Retry
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => window.location.reload()}
                >
                  Refresh Page
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-4 md:space-y-6 w-full overflow-x-hidden">
        <IncidentsHeader />
        
        <div className="flex justify-between items-center">
          {activeFilterCount > 0 && (
            <span className="text-sm font-medium mr-2 text-blue-600">
              {activeFilterCount} filters applied
            </span>
          )}
        </div>

        <div className="space-y-4">
          <IncidentFilters 
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={clearFilters}
            toggleAdvancedFilters={toggleAdvancedFilters}
            availableCategories={availableCategories}
            availableSubcategories={availableSubcategories}
            availableLocations={availableLocations}
            availableFacilities={availableFacilities}
            availableOwners={availableOwners}
            priorityOptions={priorityOptions}
            statusOptions={statusOptions}
            locationOptions={locationOptions}
          />
          
          <div className="flex items-center justify-end">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-md hover:bg-gray-100 transition-colors disabled:opacity-50"
              title={isRefreshing ? 'Refreshing...' : 'Refresh incidents'}
            >
              <RefreshCw className={`h-5 w-5 text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto w-full">
          <IncidentsTable incidents={filteredIncidents} />
        </div>
      </div>
    </Layout>
  );
};

export default IncidentsList;
