
import React, { useMemo } from 'react';
import CategoryChart from '@/components/insights/charts/category-chart';
import { useInsightsContext } from '@/contexts/InsightsContext';

const AssigneeChart = () => {
  const { incidents } = useInsightsContext();

  const assigneeData = useMemo(() => {
    const assigneeCounts: Record<string, number> = {};
    
    incidents.forEach(incident => {
      const assignee = incident.owner_id ? 'Assigned' : 'Unassigned';
      assigneeCounts[assignee] = (assigneeCounts[assignee] || 0) + 1;
    });
    
    return Object.entries(assigneeCounts).map(([name, value]) => ({ name, value }));
  }, [incidents]);

  return (
    <div className="mb-6">
      <CategoryChart 
        data={assigneeData}
        colors={['#22c55e', '#f59e0b', '#06b6d4']}
        title="Assignees"
      />
    </div>
  );
};

export default AssigneeChart;
