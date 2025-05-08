
import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useTransportSafety } from '@/contexts/transport-safety/TransportSafetyContext';
import DocumentsNotFound from './DocumentsNotFound';
import DocumentsList from './DocumentsList';
import AddDocumentForm from './AddDocumentForm';
import { Plus } from 'lucide-react';

const DocumentsPageContent: React.FC = () => {
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const { getVehicle } = useTransportSafety();
  const [showAddDocument, setShowAddDocument] = useState(false);
  
  const vehicle = getVehicle(vehicleId!);

  if (!vehicle) {
    return <DocumentsNotFound />;
  }

  const { registrationNumber, make, model, documents } = vehicle;

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <Button asChild variant="ghost" className="mr-4">
            <Link to={`/transport-safety/${vehicleId}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Vehicle Details
            </Link>
          </Button>
        </div>
        <Button 
          onClick={() => setShowAddDocument(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Document
        </Button>
      </div>

      <h1 className="text-2xl font-bold mb-2">Documents for {make} {model}</h1>
      <p className="text-gray-500 mb-6">Registration Number: {registrationNumber}</p>

      <DocumentsList documents={documents} vehicleId={vehicleId!} />

      <Dialog open={showAddDocument} onOpenChange={(isOpen) => { if (!isOpen) setShowAddDocument(false); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Document</DialogTitle>
          </DialogHeader>
          <AddDocumentForm vehicleId={vehicleId!} onClose={() => setShowAddDocument(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DocumentsPageContent;
