
import React from 'react';
import { Incident, Comment as IncidentComment, FileItem, Action, IncidentStatus } from '@/types/incident';
import { User } from '@/contexts/IncidentContext';

// Refactored components
import IncidentHeader from '@/components/incident/IncidentHeader';
import IncidentDetailsCard from '@/components/incident/IncidentDetailsCard';
import IncidentTabs from '@/components/incident/IncidentTabs';
import CommentsList from '@/components/incident/CommentsList';
import AddActionForm from '@/components/incident/AddActionForm';
import ActionsList from '@/components/incident/ActionsList';
import InlineCommentForm from '@/components/incident/CommentForm.inline';
import { Activity } from '@/types/incident';

interface IncidentDetailContentProps {
  incident: Incident;
  incidentActivities: Activity[];
  commentText: string;
  setCommentText: (text: string) => void;
  commentFiles: FileItem[];
  setCommentFiles: (files: FileItem[]) => void;
  isSubmitting: boolean;
  handleCommentSubmit: () => void;
  handleActionSubmit: (action: Action) => void;
  handleStatusChange: () => void;
  statusUpdate: IncidentStatus;
  setStatusUpdate: (status: IncidentStatus) => void;
  formatDate: (date: Date) => string;
  formatDateTime: (date: Date) => string;
  getStatusColor: (status: string) => string;
  getCommentStatusColor: (status: string) => string;
  addComment: (incidentId: string, commentData: Omit<IncidentComment, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateComment: (incidentId: string, commentId: string, updates: Partial<IncidentComment>) => void;
  deleteComment: (incidentId: string, commentId: string) => void;
  canEditComment: (comment: IncidentComment) => boolean;
  user: User | null;
  isAdmin: boolean;
}

const IncidentDetailContent: React.FC<IncidentDetailContentProps> = ({
  incident,
  incidentActivities,
  commentText,
  setCommentText,
  commentFiles,
  setCommentFiles,
  isSubmitting,
  handleCommentSubmit,
  handleActionSubmit,
  handleStatusChange,
  statusUpdate,
  setStatusUpdate,
  formatDate,
  formatDateTime,
  getStatusColor,
  getCommentStatusColor,
  addComment,
  updateComment,
  deleteComment,
  canEditComment,
  user,
  isAdmin
}) => {
  return (
    <div className="space-y-6">
      {/* Header with back button, title, and status management */}
      <IncidentHeader 
        incident={incident}
        statusUpdate={statusUpdate}
        setStatusUpdate={setStatusUpdate}
        handleStatusChange={handleStatusChange}
        formatDateTime={formatDateTime}
        getStatusColor={getStatusColor}
        isAdmin={isAdmin}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Incident Details Card - Always visible */}
          <IncidentDetailsCard 
            incident={incident} 
            formatDateTime={formatDateTime} 
          />
          
          {/* Inline Comment Form */}
          <InlineCommentForm
            onSubmit={handleCommentSubmit}
            commentText={commentText}
            setCommentText={setCommentText}
            commentFiles={commentFiles}
            setCommentFiles={setCommentFiles}
            isSubmitting={isSubmitting}
          />
          
          {/* Comments List */}
          <CommentsList
            comments={incident.comments || []}
            incident={incident}
            addComment={addComment}
            updateComment={updateComment}
            deleteComment={deleteComment}
            formatDate={formatDate}
            getCommentStatusColor={getCommentStatusColor}
            canEditComment={canEditComment}
            userId={user?.id || ''}
            userName={user?.name || ''}
          />

          {/* Audit Trail in a collapsible section */}
          <div className="mt-6">
            <IncidentTabs 
              activities={incidentActivities} 
              formatDateTime={formatDateTime} 
            />
          </div>
          
          {/* Add Action Form - only for admins */}
          {isAdmin && (
            <AddActionForm onSubmit={handleActionSubmit} />
          )}
        </div>

        <div>
          {/* Actions Taken List */}
          <ActionsList 
            actions={incident.actions || []}
            formatDate={formatDate}
          />
        </div>
      </div>
    </div>
  );
};

export default IncidentDetailContent;
