
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import IncidentHeader from './IncidentHeader';
import IncidentDetailsCard from './IncidentDetailsCard';
import PeopleInvolved from './PeopleInvolved';
import ActionsManager from './ActionsManager';
import CommentsList from './CommentsList';
import InlineCommentForm from './CommentForm.inline';
import AuditTrail from '@/components/AuditTrail';

const IncidentDetailContent = ({ 
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
  isAdmin,
  updateIncident
}) => {
  return (
    <div className="container max-w-6xl py-6 space-y-6">
      <IncidentHeader 
        incident={incident} 
        statusUpdate={statusUpdate} 
        setStatusUpdate={setStatusUpdate} 
        onStatusChange={handleStatusChange}
        formatDate={formatDateTime}
        getStatusColor={getStatusColor}
      />
      
      <Tabs defaultValue="details" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
          <TabsTrigger value="comments">Comments</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <IncidentDetailsCard 
                incident={incident} 
                formatDate={formatDate} 
              />
            </div>
            <div className="lg:col-span-1">
              <PeopleInvolved 
                people={incident.peopleInvolved} 
              />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="actions" className="space-y-6">
          <ActionsManager 
            incidentId={incident.id}
            actions={incident.actions || []}
            handleActionSubmit={handleActionSubmit}
          />
        </TabsContent>
        
        <TabsContent value="comments" className="space-y-6">
          <InlineCommentForm 
            commentText={commentText}
            setCommentText={setCommentText}
            commentFiles={commentFiles}
            setCommentFiles={setCommentFiles}
            isSubmitting={isSubmitting}
            onSubmit={handleCommentSubmit}
          />
          
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
        
        <TabsContent value="history" className="space-y-4">
          <AuditTrail 
            activities={incidentActivities}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IncidentDetailContent;
