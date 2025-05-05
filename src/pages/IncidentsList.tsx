
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
    handleFilterChange,
    clearFilters
  } = useIncidentFilters(incidents);

  return (
    <Layout>
      <div className="space-y-4 md:space-y-6 w-full overflow-x-hidden">
        <IncidentsHeader />
        
        <div className="flex justify-between items-center">
          <IncidentFilters 
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={clearFilters}
            availableCategories={availableCategories}
            availableSubcategories={availableSubcategories}
          />
          
          <ViewToggle 
            viewType={viewType} 
            onViewChange={setViewType} 
          />
        </div>

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
