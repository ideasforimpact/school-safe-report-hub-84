
import { useState } from 'react';
import { useIncidents } from '@/contexts/IncidentContext';
import Layout from '@/components/layout/Layout';
import { useIncidentFilters } from '@/hooks/useIncidentFilters';
import IncidentsHeader from '@/components/incidents/IncidentsHeader';
import IncidentFilters from '@/components/incidents/IncidentFilters';
import IncidentsTable from '@/components/incidents/IncidentsTable';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

const IncidentsList = () => {
  const { incidents } = useIncidents();
  const [isLoading, setIsLoading] = useState(false);
  
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

  return (
    <Layout>
      <div className="space-y-6 md:space-y-8 w-full">
        <IncidentsHeader />
        
        <Card>
          <CardContent className="p-0">
            <div className="px-6 py-4 border-b border-gray-100">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Incident Management</h2>
                {activeFilterCount > 0 && (
                  <span className="text-sm font-medium py-1 px-3 rounded-full bg-blue-100 text-blue-700">
                    {activeFilterCount} filters applied
                  </span>
                )}
              </div>
            </div>

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

            {isLoading ? (
              <div className="flex justify-center items-center py-20 px-6">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-500">Loading incidents...</span>
              </div>
            ) : (
              <div className="px-6 pt-4 pb-6">
                <IncidentsTable incidents={filteredIncidents} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default IncidentsList;
