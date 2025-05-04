
import React from 'react';
import { Card } from '@/components/ui/card';
import { Activity } from '@/types/incident';
import ActivityItem from './activities/ActivityItem';
import EmptyActivities from './activities/EmptyActivities';

interface RecentActivitiesProps {
  activities: Activity[];
  onActivityClick: (activity: Activity) => void;
}

const RecentActivities: React.FC<RecentActivitiesProps> = ({ activities, onActivityClick }) => {
  return (
    <div className="space-y-4 md:space-y-6">
      <h2 className="text-lg md:text-xl font-medium text-gray-900">Recent Activities</h2>
      <Card className="border-none shadow-card">
        {activities.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {activities.map((activity, index) => (
              <ActivityItem 
                key={index} 
                activity={activity} 
                onActivityClick={onActivityClick} 
              />
            ))}
          </div>
        ) : (
          <EmptyActivities />
        )}
      </Card>
    </div>
  );
};

export default RecentActivities;
