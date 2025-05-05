
import { useState } from 'react';
import { useIncidents } from '@/contexts/IncidentContext';
import Layout from '@/components/layout/Layout';
import { useIncidentFilters } from '@/hooks/useIncidentFilters';
import IncidentsHeader from '@/components/incidents/IncidentsHeader';
import IncidentFilters from '@/components/incidents/IncidentFilters';
import IncidentsTable from '@/components/incidents/IncidentsTable';
import IncidentsCardView from '@/components/incidents/IncidentsCardView';
import ViewToggle from '@/components/incidents/ViewToggle';

const IncidentsList = () => {
  const { incidents } = useIncidents();
  const [viewType, setViewType] = useState<'table' | 'card'>('table');
  
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
      <div className="space-y-4 md:space-y-6 w-full overflow-x-hidden">
        <IncidentsHeader />
        
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            {activeFilterCount > 0 && (
              <span className="text-sm font-medium mr-2 text-blue-600">
                {activeFilterCount} filters applied
              </span>
            )}
          </div>
          
          <ViewToggle 
            viewType={viewType} 
            onViewChange={setViewType} 
          />
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

        <div className="overflow-x-auto w-full">
          {viewType === 'table' ? (
            <IncidentsTable incidents={filteredIncidents} />
          ) : (
            <IncidentsCardView incidents={filteredIncidents} />
          )}
        </div>
      </div>
    </Layout>
  );
};

export default IncidentsList;
