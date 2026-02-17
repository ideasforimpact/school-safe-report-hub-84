import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Clock, User, FileText, CheckCircle, AlertCircle, RefreshCw, Edit, Calendar } from 'lucide-react';
import { AssessmentAuditLogEntryWithUser } from '@/types/assessmentAudit';
import { assessmentAuditLogService } from '@/services/assessment/auditLogService';
import { formatDistanceToNow } from 'date-fns';

interface AssessmentAuditTimelineProps {
  assessmentId: string;
}

const getChangeTypeIcon = (changeType: string) => {
  switch (changeType) {
    case 'creation':
      return <FileText className="h-4 w-4" />;
    case 'assignment':
      return <User className="h-4 w-4" />;
    case 'status_change':
      return <RefreshCw className="h-4 w-4" />;
    case 'completion':
      return <CheckCircle className="h-4 w-4" />;
    case 'rework':
      return <AlertCircle className="h-4 w-4" />;
    case 'score_update':
      return <CheckCircle className="h-4 w-4" />;
    case 'date_update':
      return <Calendar className="h-4 w-4" />;
    default:
      return <Edit className="h-4 w-4" />;
  }
};

const getChangeTypeBadge = (changeType: string) => {
  switch (changeType) {
    case 'creation':
      return <Badge variant="secondary">Created</Badge>;
    case 'assignment':
      return <Badge variant="outline">Assigned</Badge>;
    case 'status_change':
      return <Badge variant="default">Status Changed</Badge>;
    case 'completion':
      return <Badge variant="success">Completed</Badge>;
    case 'rework':
      return <Badge variant="destructive">Rework</Badge>;
    case 'score_update':
      return <Badge variant="secondary">Score Updated</Badge>;
    case 'date_update':
      return <Badge variant="outline">Date Updated</Badge>;
    default:
      return <Badge variant="outline">Updated</Badge>;
  }
};

const AssessmentAuditTimeline = ({ assessmentId }: AssessmentAuditTimelineProps) => {
  const [auditLogs, setAuditLogs] = useState<AssessmentAuditLogEntryWithUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAuditLogs = async () => {
      try {
        const logs = await assessmentAuditLogService.getAuditLogs(assessmentId);
        setAuditLogs(logs);
      } catch (error) {
        console.error('Failed to fetch audit logs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAuditLogs();
  }, [assessmentId]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Activity Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-3 animate-pulse">
                <div className="w-8 h-8 bg-muted rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (auditLogs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Activity Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            No activity recorded for this assessment yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Activity Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {auditLogs.map((log, index) => {
            const isLast = index === auditLogs.length - 1;
            const user = log.changed_by_user;
            const userInitials = user ? `${user.first_name.charAt(0)}${user.last_name.charAt(0)}` : '?';
            const userName = user ? `${user.first_name} ${user.last_name}` : 'System';

            return (
              <div key={log.id} className="relative">
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -top-1 -right-1 bg-background border rounded-full p-0.5">
                      {getChangeTypeIcon(log.change_type)}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {getChangeTypeBadge(log.change_type)}
                      <span className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(log.changed_at), { addSuffix: true })}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        {log.description || `${log.field_changed} updated`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        by {userName}
                      </p>

                      {(log.old_value || log.new_value) && (
                        <div className="text-xs text-muted-foreground space-y-1">
                          {log.old_value && (
                            <div>
                              <span className="font-medium">From:</span> {log.old_value}
                            </div>
                          )}
                          {log.new_value && (
                            <div>
                              <span className="font-medium">To:</span> {log.new_value}
                            </div>
                          )}
                        </div>
                      )}

                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <div className="text-xs text-muted-foreground">
                          {log.metadata.closure_comments && (
                            <div>
                              <span className="font-medium">Comments:</span> {log.metadata.closure_comments}
                            </div>
                          )}
                          {log.metadata.rework_comments && (
                            <div>
                              <span className="font-medium">Rework Comments:</span> {log.metadata.rework_comments}
                            </div>
                          )}
                          {log.metadata.score !== undefined && (
                            <div>
                              <span className="font-medium">Score:</span> {log.metadata.score}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {!isLast && (
                  <div className="absolute left-4 top-10 w-px h-6 bg-border" />
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default AssessmentAuditTimeline;