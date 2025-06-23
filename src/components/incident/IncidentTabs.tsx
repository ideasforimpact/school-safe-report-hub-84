
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Incident } from '@/types/incident';
import IncidentDetailsCard from './IncidentDetailsCard';
import CommentsList from './CommentsList';
import SupportingDocuments from './SupportingDocuments';
import PeopleInvolved from './PeopleInvolved';
import AuditTrail from '@/components/AuditTrail';

interface IncidentTabsProps {
  incident: Incident;
  onUpdate?: (updates: Partial<Incident>) => void;
}

const IncidentTabs = ({ incident, onUpdate }: IncidentTabsProps) => {
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
          Documents {incident.documents && incident.documents.length > 0 && (
            <span className="ml-1 bg-green-100 text-green-800 text-xs rounded-full px-2 py-1">
              {incident.documents.length}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="people">People Involved</TabsTrigger>
        <TabsTrigger value="history">History</TabsTrigger>
      </TabsList>

      <TabsContent value="details" className="mt-6">
        <IncidentDetailsCard incident={incident} onUpdate={onUpdate} />
      </TabsContent>

      <TabsContent value="comments" className="mt-6">
        <CommentsList incidentId={incident.id} />
      </TabsContent>

      <TabsContent value="documents" className="mt-6">
        <SupportingDocuments 
          documents={incident.documents || []} 
          incidentId={incident.id}
          onUpdate={onUpdate}
        />
      </TabsContent>

      <TabsContent value="people" className="mt-6">
        <PeopleInvolved 
          people={incident.peopleInvolved || []} 
          onUpdate={(people) => onUpdate?.({ peopleInvolved: people })}
        />
      </TabsContent>

      <TabsContent value="history" className="mt-6">
        <AuditTrail incidentId={incident.id} maxHeight="500px" />
      </TabsContent>
    </Tabs>
  );
};

export default IncidentTabs;
