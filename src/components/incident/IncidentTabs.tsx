
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Incident } from '@/types/incident';
import IncidentDetailsCard from './IncidentDetailsCard';
import CommentsList from './CommentsList';
import SupportingDocuments from './SupportingDocuments';
import PeopleInvolved from './PeopleInvolved';
import AuditTrail from '@/components/AuditTrail';
import { incidentDocumentAggregator } from '@/services/incident/incidentDocumentAggregator';

interface IncidentTabsProps {
  incident: Incident;
  onUpdate?: (updates: Partial<Incident>) => void;
}

const IncidentTabs = ({ incident, onUpdate }: IncidentTabsProps) => {
  const [totalDocuments, setTotalDocuments] = useState(0);

  useEffect(() => {
    const loadDocumentCount = async () => {
      if (incident.id) {
        const { totalCount } = await incidentDocumentAggregator.getAllDocuments(incident.id);
        setTotalDocuments(totalCount);
      }
    };
    loadDocumentCount();
  }, [incident.id, incident.documents, incident.comments]);

  // Helper function to format date
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Tabs defaultValue="details" className="w-full">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="details">Details</TabsTrigger>
        <TabsTrigger value="comments">
          Comments {incident.comments && incident.comments.length > 0 && (
            <span className="ml-1 bg-blue-100 text-blue-800 text-xs rounded-full px-2 py-1">
              {incident.comments.length}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="documents">
          Documents {totalDocuments > 0 && (
            <Badge variant="secondary" className="ml-1">
              {totalDocuments}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="people">People Involved</TabsTrigger>
        <TabsTrigger value="history">History</TabsTrigger>
      </TabsList>

      <TabsContent value="details" className="mt-6">
        <IncidentDetailsCard incident={incident} formatDate={formatDate} />
      </TabsContent>

      <TabsContent value="comments" className="mt-6">
        <CommentsList 
          comments={incident.comments || []}
          incident={{ id: incident.id }}
          addComment={() => {}}
          updateComment={() => {}}
          deleteComment={() => {}}
          formatDate={formatDate}
          formatDateTime={formatDate}
          getCommentStatusColor={() => 'bg-gray-100 text-gray-800'}
          canEditComment={() => false}
          userId=""
          userName=""
        />
      </TabsContent>

      <TabsContent value="documents" className="mt-6">
        <SupportingDocuments 
          documents={incident.documents ? incident.documents.map(doc => ({
            id: doc.name || 'unknown',
            name: doc.name || 'Unknown Document',
            type: doc.type || 'application/octet-stream',
            size: 0,
            url: doc.data || '',
            path: '',
            uploadedAt: new Date().toISOString()
          })) : []} 
          incidentId={incident.id}
          onDocumentDeleted={() => {
            if (onUpdate) {
              onUpdate({});
            }
          }}
        />
      </TabsContent>

      <TabsContent value="people" className="mt-6">
        <PeopleInvolved people={incident.peopleInvolved || []} />
      </TabsContent>

      <TabsContent value="history" className="mt-6">
        <div className="space-y-4">
          <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
            <strong>Debug:</strong> Rendering AuditTrail with incident ID: {incident.id}
          </div>
          <AuditTrail incidentId={incident.id} maxHeight="500px" />
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default IncidentTabs;
