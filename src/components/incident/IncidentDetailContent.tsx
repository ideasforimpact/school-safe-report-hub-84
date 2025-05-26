
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import IncidentHeader from './IncidentHeader';
import IncidentDetailsCard from './IncidentDetailsCard';
import PeopleInvolved from './PeopleInvolved';
import CommentsList from './CommentsList';
import InlineCommentForm from './CommentForm.inline';
import AuditTrail from '@/components/AuditTrail';
import IncidentDetails from './IncidentDetails';
import ActionsList from './ActionsList';
import { FileItem } from '@/types/incident';
import { useIncidentData } from '@/hooks/useIncidentData';
import SupportingDocuments from './SupportingDocuments';

const IncidentDetailContent = ({ 
  incident, 
  incidentActivities,
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
  updateIncident,
  handleStatusChange,
  statusUpdate,
  setStatusUpdate,
  handleCommentSubmit
}) => {
  const { refetchIncidents } = useIncidentData();
  
  // State for controlling the incident closure form
  const [isClosureFormOpen, setIsClosureFormOpen] = useState(false);
  
  // State for inline comment form
  const [commentText, setCommentText] = useState('');
  const [commentFiles, setCommentFiles] = useState<FileItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handler to open the closure form
  const handleOpenClosureForm = () => {
    setIsClosureFormOpen(true);
  };

  // Handler for closure form submission
  const handleClosureFormSubmit = async (data) => {
    await updateIncident(incident.id, {
      status: 'Closed',
      rootCause: data.rootCause,
      contributingFactors: data.contributingFactors,
      actions: data.actions
    });
    setIsClosureFormOpen(false);
    // Refetch incidents to ensure latest data
    await refetchIncidents();
  };

  // Handler for when comment is successfully added
  const handleCommentAdded = async () => {
    // Refresh the incident data
    if (handleCommentSubmit) {
      handleCommentSubmit();
    }
    // Also refetch incidents to ensure consistency
    await refetchIncidents();
  };

  return (
    <div className="container max-w-6xl py-6 space-y-6">
      <IncidentHeader 
        incident={incident} 
        statusUpdate={statusUpdate} 
        setStatusUpdate={setStatusUpdate} 
        onStatusChange={handleStatusChange}
        formatDate={formatDateTime}
        getStatusColor={getStatusColor}
        onCloseButtonClick={handleOpenClosureForm}
      />
      
      <Tabs defaultValue="details" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 mb-4">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="comments">Comments</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <IncidentDetails 
                incident={incident} 
                formatDate={formatDate} 
                formatDateTime={formatDateTime}
                getStatusColor={getStatusColor}
                handleStatusChange={handleStatusChange}
                statusUpdate={statusUpdate}
                setStatusUpdate={setStatusUpdate}
                updateIncident={updateIncident}
                isClosureFormOpen={isClosureFormOpen}
                setIsClosureFormOpen={setIsClosureFormOpen}
                onClosureFormSubmit={handleClosureFormSubmit}
              />
            </div>
            <div className="lg:col-span-1">
              <PeopleInvolved 
                people={incident.peopleInvolved} 
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <SupportingDocuments documents={incident.documents || []} />
        </TabsContent>
        
        <TabsContent value="comments" className="space-y-6">
          <InlineCommentForm 
            incidentId={incident.id}
            commentText={commentText}
            setCommentText={setCommentText}
            commentFiles={commentFiles}
            setCommentFiles={setCommentFiles}
            isSubmitting={isSubmitting}
            setIsSubmitting={setIsSubmitting}
            onCommentAdded={handleCommentAdded}
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
