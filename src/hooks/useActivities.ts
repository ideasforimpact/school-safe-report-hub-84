
import { Incident, Activity } from '@/types/incident';

export const useActivities = (
  incidents: Incident[],
  activities: Activity[]
) => {
  // Get recent activities
  const getRecentActivities = () => {
    return activities;
  };
  
  // Get activities for a specific incident
  const getIncidentActivities = (incidentId: string) => {
    return activities.filter(activity => 
      activity.entityId === incidentId || 
      // Also include related action items
      incidents.find(inc => 
        inc.id === incidentId && 
        inc.actionItems?.some(item => item.id === activity.entityId)
      )
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  return {
    getRecentActivities,
    getIncidentActivities
  };
};
