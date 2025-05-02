
import { useIncidents } from '@/contexts/IncidentContext';
import Layout from '@/components/layout/Layout';
import { useIncidentFilters } from '@/hooks/useIncidentFilters';
import IncidentsHeader from '@/components/incidents/IncidentsHeader';
import IncidentFilters from '@/components/incidents/IncidentFilters';
import IncidentsTable from '@/components/incidents/IncidentsTable';

const IncidentsList = () => {
  const { incidents } = useIncidents();
  
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
      <div className="space-y-6">
        <IncidentsHeader />
        
        <IncidentFilters 
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={clearFilters}
          availableCategories={availableCategories}
          availableSubcategories={availableSubcategories}
        />

        <IncidentsTable incidents={filteredIncidents} />
      </div>
    </Layout>
  );
};

export default IncidentsList;
