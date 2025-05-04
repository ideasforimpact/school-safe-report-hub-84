
import React from 'react';
import { Card } from '@/components/ui/card';
import { formatDistance } from 'date-fns';
import { Clock, ChevronRight } from 'lucide-react';
import { Activity } from '@/types/incident';
import { useNavigate } from 'react-router-dom';

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
              <div 
                key={index} 
                className="p-3 md:p-4 hover:bg-gray-50 transition-colors cursor-pointer flex items-center justify-between"
                onClick={() => onActivityClick(activity)}
              >
                <div className="flex items-start gap-2 md:gap-3">
                  <div className={`p-1.5 md:p-2 rounded-full ${
                    activity.type === 'incident' 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'bg-purple-100 text-purple-600'
                  }`}>
                    <Clock className="h-3 w-3 md:h-4 md:w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 text-sm md:text-base">
                      {activity.activity === 'create' ? 'Created' : 'Updated'} {' '}
                      {activity.type === 'incident' ? 'incident' : 'action item'}
                    </p>
                    <p className="text-xs md:text-sm text-gray-600 truncate max-w-xs md:max-w-md mt-0.5 md:mt-1">
                      {activity.entityTitle}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 md:mt-1">
                      by {activity.user} • {formatDistance(new Date(activity.date), new Date(), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                <div className="text-gray-400 ml-1 md:ml-2 shrink-0">
                  <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 md:p-6 text-center text-gray-500 text-sm md:text-base">
            No recent activity
          </div>
        )}
      </Card>
    </div>
  );
};

export default RecentActivities;
