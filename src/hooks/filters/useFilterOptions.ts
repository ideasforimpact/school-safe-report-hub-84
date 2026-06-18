
import { useState, useEffect, useMemo } from 'react';
import { useIncidents } from '@/contexts/incident';
import { useLocation } from 'react-router-dom';
import { useIncidentFormData } from '@/hooks/useIncidentFormData';

// All config data (categories, priorities, locations, etc.) comes from the
// useIncidentFormData cache (single edge function call), so no extra DB
// requests are made when this hook mounts.
export const useFilterOptions = () => {
  const { incidents, designations, campuses, classes, sections } = useIncidents();
  const location = useLocation();
  const isInsightsPage = location.pathname.includes('/insights');

  const { formData, statuses } = useIncidentFormData();

  const categoryOptions = useMemo(
    () => formData.categories.map(c => c.name),
    [formData.categories]
  );

  const subcategoryOptions = useMemo(
    () => formData.subcategories.map(s => s.name),
    [formData.subcategories]
  );

  const priorityOptions = useMemo(
    () => formData.priorities.map(p => p.name),
    [formData.priorities]
  );

  const statusOptions = useMemo(() => {
    const names = (statuses || []).map((s: any) => s.name);
    return names.includes('Reopen') ? names : [...names, 'Reopen'];
  }, [statuses]);

  const locationOptions = useMemo(
    () => formData.locations.map(l => l.name),
    [formData.locations]
  );

  const facilityOptions = useMemo(
    () => formData.facilities.map(f => f.name),
    [formData.facilities]
  );

  const [assigneeOptions, setAssigneeOptions] = useState<{ id: string; name: string }[]>([]);
  const [reporterOptions, setReporterOptions] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (!incidents?.length) return;

    const seenA = new Set<string>();
    setAssigneeOptions(
      incidents
        .filter(inc => inc.owner)
        .map(inc => ({ id: inc.owner!.id, name: inc.owner!.name }))
        .filter(o => { if (seenA.has(o.id)) return false; seenA.add(o.id); return true; })
    );

    const seenR = new Set<string>();
    setReporterOptions(
      incidents
        .map(inc => ({ id: inc.reportedBy.id, name: inc.reportedBy.name }))
        .filter(r => { if (seenR.has(r.id)) return false; seenR.add(r.id); return true; })
    );
  }, [incidents]);

  return {
    categoryOptions,
    subcategoryOptions,
    priorityOptions,
    statusOptions,
    locationOptions,
    facilityOptions,
    assigneeOptions,
    reporterOptions,
    isInsightsPage,
    campuses,
    classes,
    sections,
    designations,
  };
};
