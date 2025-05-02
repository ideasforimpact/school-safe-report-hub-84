
import React from 'react';
import { Incident } from '@/types/incident';
import { Activity } from '@/types/incident';
import { LayoutList, ClipboardList } from 'lucide-react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import AuditTrail from '@/components/AuditTrail';
import IncidentDetailsCard from './IncidentDetailsCard';

interface IncidentTabsProps {
  incident: Incident;
  activities: Activity[];
  formatDateTime: (date: Date) => string;
}

const IncidentTabs: React.FC<IncidentTabsProps> = ({
  incident,
  activities,
  formatDateTime,
}) => {
  return (
    <Tabs defaultValue="details">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="details">
          <LayoutList className="h-4 w-4 mr-2" />
          Incident Details
        </TabsTrigger>
        <TabsTrigger value="audit">
          <ClipboardList className="h-4 w-4 mr-2" />
          Audit Trail
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="details" className="mt-4">
        <IncidentDetailsCard incident={incident} formatDateTime={formatDateTime} />
      </TabsContent>
      
      <TabsContent value="audit" className="mt-4">
        <AuditTrail activities={activities} maxHeight="500px" />
      </TabsContent>
    </Tabs>
  );
};

export default IncidentTabs;
