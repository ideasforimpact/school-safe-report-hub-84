
import React from 'react';
import { Incident } from '@/types/incident';
import { Activity } from '@/types/incident';
import { ClipboardList } from 'lucide-react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import AuditTrail from '@/components/AuditTrail';

interface IncidentTabsProps {
  activities: Activity[];
  formatDateTime: (date: Date) => string;
}

const IncidentTabs: React.FC<IncidentTabsProps> = ({
  activities,
  formatDateTime,
}) => {
  return (
    <Tabs defaultValue="audit">
      <TabsList className="w-full">
        <TabsTrigger value="audit" className="w-full">
          <ClipboardList className="h-4 w-4 mr-2" />
          Audit Trail
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="audit" className="mt-4">
        <AuditTrail activities={activities} maxHeight="500px" />
      </TabsContent>
    </Tabs>
  );
};

export default IncidentTabs;
