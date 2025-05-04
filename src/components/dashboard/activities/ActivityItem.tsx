
import React from 'react';
import { Clock, ChevronRight } from 'lucide-react';
import { formatDistance } from 'date-fns';
import { Activity } from '@/types/incident';

interface ActivityItemProps {
  activity: Activity;
  onActivityClick: (activity: Activity) => void;
}

const ActivityItem: React.FC<ActivityItemProps> = ({ activity, onActivityClick }) => {
  return (
    <div 
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
  );
};

export default ActivityItem;
