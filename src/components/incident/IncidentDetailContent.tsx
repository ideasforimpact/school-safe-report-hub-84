import React, { useState } from 'react';
import { Incident, Action, Comment as IncidentComment, IncidentStatus, User as IncidentUser } from '@/types/incident';
import IncidentActions from '@/components/incident/IncidentActions';
import IncidentDetails from '@/components/incident/IncidentDetails';
import ActivityList from '@/components/ActivityList';
import CommentsList from '@/components/incident/CommentsList';
import InlineCommentForm from '@/components/incident/CommentForm.inline';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface IncidentDetailContentProps {
  incident: Incident;
  incidentActivities: any[];
  commentText: string;
  setCommentText: (text: string) => void;
  commentFiles: any[];
  setCommentFiles: (files: any[]) => void;
  isSubmitting: boolean;
  handleCommentSubmit: () => Promise<void>;
  handleActionSubmit: (action: Action) => void;
  handleStatusChange: () => void;
  statusUpdate: IncidentStatus | string;
  setStatusUpdate: (status: IncidentStatus) => void;
  formatDate: (date: Date) => string;
  formatDateTime: (date: Date) => string;
  getStatusColor: (status: IncidentStatus) => string;
  getCommentStatusColor: (status: IncidentComment['status']) => string;
  addComment: (incidentId: string, commentData: Omit<IncidentComment, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateComment: (incidentId: string, commentId: string, updates: Partial<IncidentComment>) => void;
  deleteComment: (incidentId: string, commentId: string) => void;
  canEditComment: (comment: IncidentComment) => boolean;
  user: IncidentUser | null;
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
  const [activeTab, setActiveTab] = useState("details");

  return (
    <div className="container mx-auto p-4">
      <div className="bg-white rounded-md shadow-sm p-4 mb-4">
        <h1 className="text-2xl font-semibold">{incident.ticketId}: {incident.type}</h1>
        <p className="text-gray-500">{incident.category} - {incident.subcategory}</p>
      </div>

      <Tabs defaultValue="details" className="w-full">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
          <TabsTrigger value="comments">Comments</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>
        <TabsContent value="details" className="space-y-4">
          <IncidentDetails
            incident={incident}
            formatDate={formatDate}
            formatDateTime={formatDateTime}
            getStatusColor={getStatusColor}
            handleStatusChange={handleStatusChange}
            statusUpdate={statusUpdate}
            setStatusUpdate={setStatusUpdate}
          />
        </TabsContent>
        <TabsContent value="actions" className="space-y-4">
          <IncidentActions incident={incident} handleActionSubmit={handleActionSubmit} />
        </TabsContent>
        <TabsContent value="comments" className="space-y-4">
          {/* Inline Comment Form */}
          <InlineCommentForm 
            onSubmit={handleCommentSubmit} 
            commentText={commentText} 
            setCommentText={setCommentText} 
            commentFiles={commentFiles} 
            setCommentFiles={setCommentFiles} 
            isSubmitting={isSubmitting}
          />
          
          {/* Comments List - now passing formatDateTime */}
          <CommentsList 
            comments={incident.comments || []}
            incident={incident}
            addComment={addComment}
            updateComment={updateComment}
            deleteComment={deleteComment}
            formatDate={formatDate}
            formatDateTime={formatDateTime}
            getCommentStatusColor={getCommentStatusColor}
            canEditComment={canEditComment}
            userId={user?.id || ''}
            userName={user?.name || ''}
          />
        </TabsContent>
        <TabsContent value="activity" className="space-y-4">
          <ActivityList activities={incidentActivities} formatDate={formatDate} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IncidentDetailContent;
