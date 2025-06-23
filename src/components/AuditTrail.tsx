
import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Clock, 
  Edit, 
  Plus, 
  CheckCircle, 
  XCircle, 
  Trash2, 
  User,
  AlertCircle,
  FileText,
  MessageSquare
} from 'lucide-react';
import { useIncidentAuditTrail } from '@/hooks/useIncidentAuditTrail';
import { Skeleton } from '@/components/ui/skeleton';

interface AuditTrailProps {
  incidentId?: string;
  maxHeight?: string;
}

const AuditTrail = ({ incidentId, maxHeight = "400px" }: AuditTrailProps) => {
  const { auditEntries, isLoading, error } = useIncidentAuditTrail(incidentId);

  console.log('=== AUDIT TRAIL COMPONENT DEBUG ===');
  console.log('AuditTrail component rendered');
  console.log('Props received - incidentId:', incidentId);
  console.log('Props received - maxHeight:', maxHeight);
  console.log('Hook state - auditEntries length:', auditEntries?.length || 0);
  console.log('Hook state - auditEntries:', auditEntries);
  console.log('Hook state - isLoading:', isLoading);
  console.log('Hook state - error:', error);
  console.log('=== END AUDIT TRAIL COMPONENT DEBUG ===');

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
  const getActivityIcon = (activity: any) => {
    if (activity.activity === 'create') {
      if (activity.type === 'comment') return <MessageSquare className="h-4 w-4" />;
      if (activity.type === 'action') return <FileText className="h-4 w-4" />;
      return <Plus className="h-4 w-4" />;
    }
    if (activity.activity === 'update') return <Edit className="h-4 w-4" />;
    if (activity.activity === 'delete') return <Trash2 className="h-4 w-4" />;
    if (activity.activity === 'close') return <CheckCircle className="h-4 w-4" />;
    if (activity.activity === 'reopen') return <AlertCircle className="h-4 w-4" />;
    return <Clock className="h-4 w-4" />;
  };

  // Get color based on activity type
  const getActivityColor = (activity: any) => {
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
      case 'comment':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Loading state
  if (isLoading) {
    console.log('AuditTrail showing loading state');
    return (
      <div className="border rounded-md p-4">
        <div className="flex items-center mb-4">
          <Clock className="h-5 w-5 mr-2 text-gray-500" />
          <h3 className="font-medium text-lg">Audit Trail</h3>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start space-x-4">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    console.log('AuditTrail showing error state:', error);
    return (
      <div className="border rounded-md p-4">
        <div className="flex items-center mb-4">
          <Clock className="h-5 w-5 mr-2 text-gray-500" />
          <h3 className="font-medium text-lg">Audit Trail</h3>
        </div>
        <div className="text-center py-4">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-600 text-sm">{error}</p>
          <p className="text-gray-500 text-xs mt-1">Check console for detailed error information</p>
        </div>
      </div>
    );
  }

  // Main render
  console.log('AuditTrail rendering main content with', auditEntries.length, 'entries');
  
  return (
    <div className="border rounded-md p-4">
      <div className="flex items-center mb-4">
        <Clock className="h-5 w-5 mr-2 text-gray-500" />
        <h3 className="font-medium text-lg">Audit Trail</h3>
        {auditEntries.length > 0 && (
          <span className="ml-2 text-sm text-gray-500">({auditEntries.length} entries)</span>
        )}
      </div>
      
      {/* Debug information */}
      <div className="mb-4 p-2 bg-gray-50 rounded text-xs text-gray-600">
        <strong>Debug Info:</strong> Incident ID: {incidentId || 'undefined'}, 
        Entries: {auditEntries.length}, 
        Loading: {isLoading ? 'yes' : 'no'}, 
        Error: {error || 'none'}
      </div>
      
      {auditEntries.length === 0 ? (
        <div className="text-center py-4">
          <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">No activity recorded yet</p>
          <p className="text-gray-400 text-sm mt-1">
            Check browser console for debugging information
          </p>
        </div>
      ) : (
        <ScrollArea className={`pr-4 ${maxHeight ? `max-h-[${maxHeight}]` : ''}`}>
          <div className="space-y-4">
            {auditEntries.map((activity, index) => (
              <div key={activity.id || index} className="border-l-2 border-gray-200 pl-4 pb-4 relative">
                <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border-2 border-white bg-gray-300" />
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center justify-center p-1 rounded-full ${getActivityColor(activity)}`}>
                        {getActivityIcon(activity)}
                      </span>
                      <span className="font-medium">{activity.user}</span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">
                      {activity.details || `${activity.activity} ${activity.entityTitle}`}
                    </p>
                  </div>
                  <time className="text-xs text-gray-500">{formatDate(activity.date)}</time>
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
