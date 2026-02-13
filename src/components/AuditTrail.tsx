
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
import {formatDate} from '@/lib/Dateformat';
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

  // Parse and highlight text for better readability
  const parseAndHighlightText = (text: string) => {
    if (!text) return null;

    // Check for reopen reason pattern
    const reopenMatch = text.match(/Reason:\s*(.+)/);
    if (reopenMatch) {
      const beforeReason = text.substring(0, text.indexOf('Reason:'));
      const reason = reopenMatch[1].trim();
      return {
        type: 'reopen',
        beforeReason: beforeReason.trim(),
        reason: reason
      };
    }

    // Check for field change patterns
    const changeMatch = text.match(/(.+?)\s+changed\s+from\s+"([^"]+)"\s+to\s+"([^"]+)"/);
    if (changeMatch) {
      return {
        type: 'change',
        field: changeMatch[1].trim(),
        oldValue: changeMatch[2],
        newValue: changeMatch[3]
      };
    }

    // Check for set pattern
    const setMatch = text.match(/(.+?)\s+set\s+to\s+"([^"]+)"/);
    if (setMatch) {
      return {
        type: 'set',
        field: setMatch[1].trim(),
        value: setMatch[2]
      };
    }

    // Check for cleared pattern
    const clearMatch = text.match(/(.+?)\s+cleared\s+\(was\s+"([^"]+)"\)/);
    if (clearMatch) {
      return {
        type: 'clear',
        field: clearMatch[1].trim(),
        oldValue: clearMatch[2]
      };
    }

    // Check for added/removed pattern (People Involved, Supporting Documents)
    const addedMatch = text.match(/(.+?):\s+Added\s+"([^"]+)"/);
    if (addedMatch) {
      return {
        type: 'added',
        field: addedMatch[1].trim(),
        value: addedMatch[2]
      };
    }

    const removedMatch = text.match(/(.+?):\s+Removed\s+"([^"]+)"/);
    if (removedMatch) {
      return {
        type: 'removed',
        field: removedMatch[1].trim(),
        value: removedMatch[2]
      };
    }

    // Check for combined added/removed pattern
    const combinedMatch = text.match(/(.+?):\s+Removed\s+"([^"]+)",\s+Added\s+"([^"]+)"/);
    if (combinedMatch) {
      return {
        type: 'combined',
        field: combinedMatch[1].trim(),
        removedValue: combinedMatch[2],
        addedValue: combinedMatch[3]
      };
    }

    return { type: 'plain', text };
  };

  // Render highlighted change based on parsed content
  const renderHighlightedChange = (parsed: any) => {
    if (!parsed) return null;

    switch (parsed.type) {
      case 'reopen':
        return (
          <div className="space-y-2">
            {parsed.beforeReason && (
              <p className="text-sm text-gray-700">{parsed.beforeReason}</p>
            )}
            <div className="flex items-start gap-2">
              <span className="text-sm font-medium text-gray-900 shrink-0">Reason:</span>
              <Badge
                variant="outline"
                  className="
                    bg-blue-50
                    text-blue-700
                    border-blue-200
                    break-words 
                    max-w-full block whitespace-normal break-all px-3 py-2 rounded-lg">
                    {parsed.reason}
              </Badge>
            </div>
          </div>
        );

      case 'change':
        return (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-medium text-gray-900">{parsed.field}</span>
            <span className="text-gray-600">changed from</span>
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 break-words max-w-full">
              <span className="break-words whitespace-normal">{parsed.oldValue}</span>
            </Badge>
            <span className="text-gray-600">to</span>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 break-words max-w-full">
              <span className="break-words whitespace-normal">{parsed.newValue}</span>
            </Badge>
          </div>
        );

      case 'set':
        return (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-medium text-gray-900">{parsed.field}</span>
            <span className="text-gray-600">set to</span>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 break-words max-w-full">
              <span className="break-words whitespace-normal">{parsed.value}</span>
            </Badge>
          </div>
        );

      case 'clear':
        return (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-medium text-gray-900">{parsed.field}</span>
            <span className="text-gray-600">cleared (was</span>
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 break-words max-w-full">
              <span className="break-words whitespace-normal">{parsed.oldValue}</span>
            </Badge>
            <span className="text-gray-600">)</span>
          </div>
        );

      case 'added':
        return (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-medium text-gray-900">{parsed.field}:</span>
            <span className="text-gray-600">Added</span>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 break-words max-w-full">
              <span className="break-words whitespace-normal">{parsed.value}</span>
            </Badge>
          </div>
        );

      case 'removed':
        return (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-medium text-gray-900">{parsed.field}:</span>
            <span className="text-gray-600">Removed</span>
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 break-words max-w-full">
              <span className="break-words whitespace-normal">{parsed.value}</span>
            </Badge>
          </div>
        );

      case 'combined':
        return (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-medium text-gray-900">{parsed.field}:</span>
            <span className="text-gray-600">Removed</span>
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 break-words max-w-full">
              <span className="break-words whitespace-normal">{parsed.removedValue}</span>
            </Badge>
            <span className="text-gray-600">, Added</span>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 break-words max-w-full">
              <span className="break-words whitespace-normal">{parsed.addedValue}</span>
            </Badge>
          </div>
        );

      case 'plain':
      default:
        return <span className="text-sm text-gray-700">{parsed.text}</span>;
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
                          {(() => {
                            const activityText = activity.details || `${activity.activity} ${activity.entityTitle}`;
                            const parsed = parseAndHighlightText(activityText);
                            const changes = parseChanges(activityText);
                            
                            // If we have a parsed structured change, show it highlighted
                            if (parsed && parsed.type !== 'plain') {
                              return (
                                <div className="bg-gray-50 rounded-lg p-3 border">
                                  {renderHighlightedChange(parsed)}
                                </div>
                              );
                            }
                            
                            // If we have legacy changes, show them
                            if (changes && changes.length > 0) {
                              return (
                                <div className="bg-gray-50 rounded-lg p-3 border">
                                  <h5 className="text-sm font-medium text-gray-900 mb-2">Changes Made:</h5>
                                  <div className="space-y-1">
                                    {changes.map((change, changeIndex) => (
                                      <div key={changeIndex} className="flex items-start text-sm text-gray-700">
                                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2 flex-shrink-0 mt-1.5" />
                                        <span className="break-words whitespace-normal">{change}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            }
                            
                            // Default plain text display
                            return (
                              <div className="bg-gray-50 rounded-lg p-3 border">
                                <span className="text-sm text-gray-700 break-words whitespace-normal">{activityText}</span>
                              </div>
                            );
                          })()}
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
