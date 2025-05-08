
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Bus, ArrowLeft, Edit, FileText, AlertCircle } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TransportSafetyProvider, useTransportSafety } from '@/contexts/transport-safety/TransportSafetyContext';
import VehicleTypeIcon from '@/components/transport-safety/VehicleTypeIcon';
import VehicleStatusBadge from '@/components/transport-safety/VehicleStatusBadge';
import DocumentStatusBadge from '@/components/transport-safety/DocumentStatusBadge';

const VehicleDetailContent = () => {
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const { getVehicle } = useTransportSafety();
  
  const vehicle = getVehicle(vehicleId!);

  if (!vehicle) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-700 mb-2">Vehicle Not Found</h3>
        <p className="text-gray-500 max-w-md mx-auto mb-6">
          The vehicle you're looking for doesn't exist or has been removed.
        </p>
        <Button asChild>
          <Link to="/transport-safety">Return to Vehicles List</Link>
        </Button>
      </div>
    );
  }

  const { registrationNumber, make, model, type, status, year, capacity, documents } = vehicle;
  
  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <div className="flex items-center mb-8">
        <Button asChild variant="ghost" className="mr-4">
          <Link to="/transport-safety">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Vehicles
          </Link>
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-6 mb-6">
        <div className="w-full md:w-2/3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center">
                <div className="bg-gray-100 p-3 rounded-lg mr-4">
                  <VehicleTypeIcon type={type} size={32} />
                </div>
                <div>
                  <CardTitle>{make} {model}</CardTitle>
                  <div className="text-gray-500">{registrationNumber}</div>
                </div>
              </div>
              <VehicleStatusBadge status={status} />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6 text-left">
                <div className="text-left">
                  <div className="text-sm font-medium text-gray-500">Type</div>
                  <div className="text-left">{type.charAt(0).toUpperCase() + type.slice(1)}</div>
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium text-gray-500">Year</div>
                  <div className="text-left">{year}</div>
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium text-gray-500">Capacity</div>
                  <div className="text-left">{capacity} passengers</div>
                </div>
              </div>
              
              <div className="flex justify-start">
                <Button asChild variant="outline">
                  <Link to={`/transport-safety/${vehicleId}/edit`}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Vehicle
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="w-full md:w-1/3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base text-left">Document Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {documents.map(document => (
                  <div key={document.id} className="flex justify-between items-center">
                    <div className="text-left">
                      <div className="font-medium text-left">
                        {document.type.charAt(0).toUpperCase() + document.type.slice(1)}
                      </div>
                      <div className="text-sm text-gray-500 text-left">
                        Expires: {new Date(document.expiryDate).toLocaleDateString()}
                      </div>
                    </div>
                    <DocumentStatusBadge status={document.status} />
                  </div>
                ))}
                
                <Button asChild className="w-full mt-2">
                  <Link to={`/transport-safety/${vehicleId}/documents`}>
                    <FileText className="h-4 w-4 mr-2" />
                    Manage Documents
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

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
    </div>
  );
};

const VehicleDetailPage = () => {
  return (
    <Layout>
      <TransportSafetyProvider>
        <VehicleDetailContent />
      </TransportSafetyProvider>
    </Layout>
  );
};

export default VehicleDetailPage;
