
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useIncidents, IncidentStatus } from '@/contexts/IncidentContext';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import { Action, Comment } from '@/types/incident';

// Refactored components
import IncidentHeader from '@/components/incident/IncidentHeader';
import IncidentTabs from '@/components/incident/IncidentTabs';
import CommentsList from '@/components/incident/CommentsList';
import AddActionForm from '@/components/incident/AddActionForm';
import ActionsList from '@/components/incident/ActionsList';

const IncidentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getIncident, updateIncident, addComment, updateComment, deleteComment, getIncidentActivities } = useIncidents();
  const { user, isAdmin } = useAuth();

  const incident = getIncident(id || '');
  const incidentActivities = incident ? getIncidentActivities(incident.id) : [];

  const [statusUpdate, setStatusUpdate] = useState<IncidentStatus>(incident?.status || 'Open');

  if (!incident) {
    return (
      <Layout>
        <div className="text-center p-8">
          <h2 className="text-xl font-semibold">Incident not found</h2>
          <p className="text-gray-600 mt-2">The incident you're looking for doesn't exist or has been removed.</p>
          <button 
            className="text-primary-600 hover:underline mt-4"
            onClick={() => navigate('/incidents')}
          >
            Return to Incidents List
          </button>
        </div>
      </Layout>
    );
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: IncidentStatus) => {
    switch(status) {
      case 'Open':
        return 'bg-red-100 text-red-800';
      case 'In Progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'Closed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCommentStatusColor = (status: Comment['status']) => {
    switch(status) {
      case 'Pending':
        return 'bg-orange-100 text-orange-800';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800';
      case 'Completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleStatusChange = () => {
    updateIncident(incident.id, { status: statusUpdate });
  };

  const handleActionSubmit = (action: Action) => {
    const newActions = [...(incident.actions || []), action];
    updateIncident(incident.id, { actions: newActions });
  };

  const canEditComment = (item: Comment) => {
    return isAdmin || item.createdBy.id === user?.id;
  };

  return (
    <Layout>
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
            {/* Tabs for Incident Details and Audit Trail */}
            <IncidentTabs 
              incident={incident} 
              activities={incidentActivities} 
              formatDateTime={formatDateTime} 
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
    </Layout>
  );
};

export default IncidentDetail;
