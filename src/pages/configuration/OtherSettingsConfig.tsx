
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DesignationTab } from '@/components/configuration/DesignationTab';
import { ConfigItem } from '@/contexts/types';
import { UserCircle } from 'lucide-react';

interface OtherSettingsConfigProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  designations: ConfigItem[];
  addDesignation: (name: string) => void;
  updateDesignation: (id: string, name: string) => void;
  deleteDesignation: (id: string) => void;
}

export const OtherSettingsConfig: React.FC<OtherSettingsConfigProps> = ({
  activeTab,
  setActiveTab,
  designations,
  addDesignation,
  updateDesignation,
  deleteDesignation
}) => {
  return (
    <Card>
      <CardContent className="pt-6">
        <Tabs defaultValue="designations" value={activeTab || 'designations'} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="designations" className="flex items-center gap-2">
              <UserCircle className="h-4 w-4" />
              <span>Designations</span>
            </TabsTrigger>
            {/* Additional configuration tabs can be added here in the future */}
          </TabsList>
          
          <TabsContent value="designations">
            <DesignationTab 
              designations={designations}
              addDesignation={addDesignation}
              updateDesignation={updateDesignation}
              deleteDesignation={deleteDesignation}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
