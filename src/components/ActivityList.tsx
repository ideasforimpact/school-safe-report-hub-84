
import React from 'react';
import { Activity } from '@/types/incident';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';

interface ActivityListProps {
  activities: Activity[];
  formatDate: (date: Date) => string;
}

const ActivityList: React.FC<ActivityListProps> = ({
  activities,
  formatDate
}) => {
  // Function to get the activity description
  const getActivityDescription = (activity: Activity): string => {
    const activityType = {
      incident: 'incident',
      action: 'action',
      status: 'status',
      comment: 'comment',
      actionItem: 'action item'
    }[activity.type] || 'item';

    const activityVerb = {
      create: 'created',
      update: 'updated',
      delete: 'deleted',
      close: 'closed',
      reopen: 'reopened'
    }[activity.activity] || 'modified';

    return `${activity.user} ${activityVerb} ${activityType} "${activity.entityTitle}"`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity History</CardTitle>
        <CardDescription>
          Recent changes and updates
        </CardDescription>
      </CardHeader>
      <CardContent>
        {activities && activities.length > 0 ? (
          <div className="space-y-4">
            {activities.map((activity, index) => (
              <div key={index} className="border-b pb-3 last:border-0">
                <p className="font-medium text-sm text-gray-600">
                  {formatDate(activity.date)}
                </p>
                <p className="mt-1">
                  {getActivityDescription(activity)}
                </p>
                {activity.details && (
                  <p className="text-sm text-gray-500 mt-1">
                    {activity.details}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No recent activity recorded</p>
        )}
      </CardContent>
    </Card>
  );
};

export default ActivityList;
