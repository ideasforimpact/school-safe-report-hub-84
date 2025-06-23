
import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
  MessageSquare,
  ChevronRight
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
          ? 'bg-blue-50 text-blue-700 border-blue-200' 
          : 'bg-blue-50 text-blue-700 border-blue-200';
      case 'status':
        return activity.activity === 'close' 
          ? 'bg-green-50 text-green-700 border-green-200' 
          : 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'action':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'actionItem':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'comment':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  // Parse changes from details to show in a cleaner format
  const parseChanges = (details: string) => {
    if (!details || !details.includes(':')) return null;
    
    const changes = [];
    const parts = details.split(', ');
    
    for (const part of parts) {
      if (part.includes('→') || part.includes(' from ') || part.includes(' to ')) {
        const cleanPart = part.replace(/"/g, '').trim();
        changes.push(cleanPart);
      }
    }
    
    return changes.length > 0 ? changes : null;
  };

  // Loading state
  if (isLoading) {
    console.log('AuditTrail showing loading state');
    return (
      <div className="border rounded-lg p-6 bg-white">
        <div className="flex items-center mb-6">
          <Clock className="h-5 w-5 mr-3 text-gray-500" />
          <h3 className="font-semibold text-lg text-gray-900">Audit Trail</h3>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start space-x-4">
              <Skeleton className="h-10 w-10 rounded-full" />
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
      <div className="border rounded-lg p-6 bg-white">
        <div className="flex items-center mb-6">
          <Clock className="h-5 w-5 mr-3 text-gray-500" />
          <h3 className="font-semibold text-lg text-gray-900">Audit Trail</h3>
        </div>
        <div className="text-center py-8">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
          <p className="text-red-600 text-sm font-medium">{error}</p>
          <p className="text-gray-500 text-xs mt-1">Check console for detailed error information</p>
        </div>
      </div>
    );
  }

  // Main render
  console.log('AuditTrail rendering main content with', auditEntries.length, 'entries');
  
  return (
    <div className="border rounded-lg bg-white">
      <div className="p-6 border-b bg-gray-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Clock className="h-5 w-5 mr-3 text-gray-600" />
            <h3 className="font-semibold text-lg text-gray-900">Audit Trail</h3>
          </div>
          {auditEntries.length > 0 && (
            <Badge variant="secondary" className="bg-gray-100 text-gray-600">
              {auditEntries.length} {auditEntries.length === 1 ? 'entry' : 'entries'}
            </Badge>
          )}
        </div>
      </div>
      
      <div className="p-6">
        {auditEntries.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No Activity Yet</h4>
            <p className="text-gray-500 text-sm">
              Activity and changes will appear here as they happen
            </p>
          </div>
        ) : (
          <ScrollArea className={`${maxHeight ? `max-h-[${maxHeight}]` : ''}`}>
            <div className="space-y-6">
              {auditEntries.map((activity, index) => {
                const changes = parseChanges(activity.details || '');
                
                return (
                  <div key={activity.id || index} className="relative">
                    {/* Timeline line */}
                    {index < auditEntries.length - 1 && (
                      <div className="absolute left-5 top-12 bottom-0 w-px bg-gray-200" />
                    )}
                    
                    <div className="flex items-start space-x-4">
                      {/* Activity icon */}
                      <div className={`flex-shrink-0 w-10 h-10 rounded-full border-2 flex items-center justify-center ${getActivityColor(activity)}`}>
                        {getActivityIcon(activity)}
                      </div>
                      
                      {/* Activity content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-gray-900">{activity.user}</span>
                            <ChevronRight className="h-3 w-3 text-gray-400" />
                            <Badge variant="outline" className="text-xs">
                              {activity.activity}
                            </Badge>
                          </div>
                          <time className="text-xs text-gray-500 font-medium">
                            {formatDate(activity.date)}
                          </time>
                        </div>
                        
                        {/* Activity description */}
                        <div className="space-y-2">
                          {changes && changes.length > 0 ? (
                            <div className="bg-gray-50 rounded-lg p-3 border">
                              <h5 className="text-sm font-medium text-gray-900 mb-2">Changes Made:</h5>
                              <div className="space-y-1">
                                {changes.map((change, changeIndex) => (
                                  <div key={changeIndex} className="flex items-center text-sm text-gray-700">
                                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2 flex-shrink-0" />
                                    <span>{change}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 border">
                              {activity.details || `${activity.activity} ${activity.entityTitle}`}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
};

export default AuditTrail;
