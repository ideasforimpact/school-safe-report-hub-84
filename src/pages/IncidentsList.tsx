
import { useState } from 'react';
import { useIncidents } from '@/contexts/incident';
import Layout from '@/components/layout/Layout';
import { useIncidentFilters } from '@/hooks/useIncidentFilters';
import IncidentsHeader from '@/components/incidents/IncidentsHeader';
import IncidentFilters from '@/components/incidents/IncidentFilters';
import IncidentsTable from '@/components/incidents/IncidentsTable';
import { useIncidentData } from '@/hooks/useIncidentData';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

const IncidentsList = () => {
  console.log('IncidentsList component rendering');
  
  const { incidents } = useIncidents();
  const { loading, error, refetchIncidents } = useIncidentData();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  console.log('Incidents from context:', incidents);
  console.log('Loading state:', loading);

  const {
    filters,
    filteredIncidents,
    availableCategories,
    availableSubcategories,
    availableLocations,
    availableFacilities,
    availableOwners,
    handleFilterChange,
    toggleAdvancedFilters,
    clearFilters
  } = useIncidentFilters(incidents);

  console.log('Filtered incidents:', filteredIncidents);

  // Count active filters
  const activeFilterCount = Object.entries(filters).filter(([key, value]) => {
    // Skip these properties when counting active filters
    if (
      key === 'showAdvancedFilters' || 
      (typeof value === 'boolean' && value === false) ||
      (typeof value === 'string' && value === '')
    ) {
      return false;
    }
    return true;
  }).length;

  // Handle refresh button click
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetchIncidents();
      console.log('Incidents refreshed successfully');
    } catch (error) {
      console.error('Error refreshing incidents:', error);
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
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Show error state
  if (error) {
    return (
      <Layout>
        <div className="space-y-4 md:space-y-6 w-full overflow-x-hidden">
          <IncidentsHeader />
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center py-8">
              <p className="text-red-600 mb-4">Error loading incidents: {error}</p>
              <button 
                onClick={() => refetchIncidents()} 
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Retry
              </button>
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

        <div className="flex gap-4 items-start">
          <div className="flex-1">
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
            />
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 mt-6"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>

        <div className="overflow-x-auto w-full">
          <IncidentsTable incidents={filteredIncidents} />
        </div>
      </div>
    </Layout>
  );
};

export default IncidentsList;
