
import React from 'react';
import { Activity } from '@/contexts/IncidentContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Clock, 
  Edit, 
  Plus, 
  CheckCircle, 
  XCircle, 
  Trash2, 
  User,
  AlertCircle
} from 'lucide-react';

interface AuditTrailProps {
  activities: Activity[];
  maxHeight?: string;
}

const AuditTrail = ({ activities, maxHeight = "400px" }: AuditTrailProps) => {
  // Format date to readable format
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get icon based on activity type and action
  const getActivityIcon = (activity: Activity) => {
    if (activity.activity === 'create') return <Plus className="h-4 w-4" />;
    if (activity.activity === 'update') return <Edit className="h-4 w-4" />;
    if (activity.activity === 'delete') return <Trash2 className="h-4 w-4" />;
    if (activity.activity === 'close') return <CheckCircle className="h-4 w-4" />;
    if (activity.activity === 'reopen') return <AlertCircle className="h-4 w-4" />;
    return <Clock className="h-4 w-4" />;
  };

  // Get color based on activity type
  const getActivityColor = (activity: Activity) => {
    switch (activity.type) {
      case 'incident':
        return activity.activity === 'create' 
          ? 'bg-blue-100 text-blue-800' 
          : 'bg-blue-100 text-blue-800';
      case 'status':
        return activity.activity === 'close' 
          ? 'bg-green-100 text-green-800' 
          : 'bg-yellow-100 text-yellow-800';
      case 'action':
        return 'bg-purple-100 text-purple-800';
      case 'actionItem':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Format activity details to include creator information
  const formatActivityDetails = (activity: Activity) => {
    if (activity.activity === 'create' && activity.type === 'incident') {
      return `Incident created by ${activity.user}`;
    }
    return activity.details;
  };

  return (
    <div className="border rounded-md p-4">
      <div className="flex items-center mb-4">
        <Clock className="h-5 w-5 mr-2 text-gray-500" />
        <h3 className="font-medium text-lg">Audit Trail</h3>
      </div>
      
      {activities.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No activity recorded yet</p>
      ) : (
        <ScrollArea className={`pr-4 ${maxHeight ? `max-h-[${maxHeight}]` : ''}`}>
          <div className="space-y-4">
            {activities.map((activity, index) => (
              <div key={index} className="border-l-2 border-gray-200 pl-4 pb-4 relative">
                <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border-2 border-white bg-gray-300" />
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center justify-center p-1 rounded-full ${getActivityColor(activity)}`}>
                        {getActivityIcon(activity)}
                      </span>
                      <span className="font-medium">{activity.user}</span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">{formatActivityDetails(activity)}</p>
                  </div>
                  <time className="text-xs text-gray-500">{formatDate(new Date(activity.date))}</time>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

export default AuditTrail;
