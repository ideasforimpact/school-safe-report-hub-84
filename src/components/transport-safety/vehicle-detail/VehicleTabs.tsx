
import React from 'react';
import { Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface VehicleTabsProps {
  vehicleId: string;
}

const VehicleTabs: React.FC<VehicleTabsProps> = ({ vehicleId }) => {
  return (
    <Tabs defaultValue="documents">
      <TabsList className="mb-4">
        <TabsTrigger value="documents">Documents</TabsTrigger>
        <TabsTrigger value="history">History</TabsTrigger>
      </TabsList>
      
      <TabsContent value="documents" className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
        <h2 className="text-lg font-medium mb-4 text-left">Vehicle Documents</h2>
        <p className="text-gray-500 text-left">
          For detailed document management, including verification and updates, please visit the 
          <Link to={`/transport-safety/${vehicleId}/documents`} className="text-primary ml-1">Document Management</Link> page.
        </p>
      </TabsContent>
      
      <TabsContent value="history" className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
        <h2 className="text-lg font-medium mb-4 text-left">History</h2>
        <p className="text-gray-500 text-left">Vehicle history records will be available in future updates.</p>
      </TabsContent>
    </Tabs>
  );
};

export default VehicleTabs;
