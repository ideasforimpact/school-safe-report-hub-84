import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, FileText, FileUp, Plus, AlertCircle, File } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { TransportSafetyProvider, useTransportSafety } from '@/contexts/transport-safety/TransportSafetyContext';
import DocumentStatusBadge from '@/components/transport-safety/DocumentStatusBadge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { VehicleDocument } from '@/types/transportSafety';

interface AddDocumentFormProps {
  vehicleId: string;
  onClose: () => void;
}

const AddDocumentForm: React.FC<AddDocumentFormProps> = ({ vehicleId, onClose }) => {
  const { addDocument } = useTransportSafety();
  const { register, handleSubmit, watch, formState: { errors } } = useForm<Omit<VehicleDocument, 'id'>>({
    defaultValues: {
      type: 'insurance',
      number: '',
      issuedDate: new Date().toISOString().split('T')[0],
      expiryDate: '',
      provider: '',
      status: 'valid'
    }
  });

  const documentType = watch('type');

  const onSubmit = (data: Omit<VehicleDocument, 'id'>) => {
    addDocument(vehicleId, {
      ...data,
      issuedDate: new Date(data.issuedDate).toISOString(),
      expiryDate: new Date(data.expiryDate).toISOString()
    });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="type">Document Type*</Label>
        <Select defaultValue="insurance" onValueChange={(value) => register('type').onChange({ target: { name: 'type', value } })}>
          <SelectTrigger>
            <SelectValue placeholder="Select document type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="insurance">Insurance</SelectItem>
            <SelectItem value="fitness">Fitness Certificate</SelectItem>
            <SelectItem value="pollution">Pollution Certificate</SelectItem>
            <SelectItem value="registration">Registration</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="number">{documentType === 'insurance' ? 'Policy Number' : 'Certificate Number'}*</Label>
        <Input 
          id="number" 
          {...register('number', { required: "Number is required" })}
          placeholder="Enter document number"
        />
        {errors.number && 
          <p className="text-red-500 text-sm">{errors.number.message}</p>
        }
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="issuedDate">Issue Date*</Label>
          <Input 
            id="issuedDate" 
            type="date"
            {...register('issuedDate', { required: "Issue date is required" })}
          />
          {errors.issuedDate && 
            <p className="text-red-500 text-sm">{errors.issuedDate.message}</p>
          }
        </div>

        <div className="space-y-2">
          <Label htmlFor="expiryDate">Expiry Date*</Label>
          <Input 
            id="expiryDate" 
            type="date"
            {...register('expiryDate', { required: "Expiry date is required" })}
          />
          {errors.expiryDate && 
            <p className="text-red-500 text-sm">{errors.expiryDate.message}</p>
          }
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="provider">Provider/Issuer*</Label>
        <Input 
          id="provider" 
          {...register('provider', { required: "Provider is required" })}
          placeholder="Enter provider name"
        />
        {errors.provider && 
          <p className="text-red-500 text-sm">{errors.provider.message}</p>
        }
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">
          Add Document
        </Button>
      </div>
    </form>
  );
};

const DocumentPageContent = () => {
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const { getVehicle } = useTransportSafety();
  const [showAddDocument, setShowAddDocument] = useState(false);
  
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

  const { registrationNumber, make, model, documents } = vehicle;

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <div className="flex items-center mb-8">
        <div className="flex items-center">
          <Button asChild variant="ghost" className="mr-4">
            <Link to={`/transport-safety/${vehicleId}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Vehicle Details
            </Link>
          </Button>
        </div>
      </div>

      <h1 className="text-2xl font-bold mb-2">Documents for {make} {model}</h1>
      <p className="text-gray-500 mb-6">Registration Number: {registrationNumber}</p>

      {documents.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <File className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">No Documents Found</h3>
          <p className="text-gray-500 max-w-md mx-auto mb-6">
            This vehicle doesn't have any documents yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {documents.map(document => (
            <Card key={document.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-center justify-between p-4 border-b">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 mr-3 text-gray-400" />
                    <div>
                      <h3 className="font-medium">
                        {document.type.charAt(0).toUpperCase() + document.type.slice(1)}
                      </h3>
                      <p className="text-sm text-gray-500">{document.number}</p>
                    </div>
                  </div>
                  <DocumentStatusBadge status={document.status} />
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div>
                      <span className="text-gray-500">Provider:</span> {document.provider}
                    </div>
                    <div>
                      <span className="text-gray-500">Verification:</span> {document.verificationStatus || 'Unverified'}
                    </div>
                    <div>
                      <span className="text-gray-500">Issued:</span> {new Date(document.issuedDate).toLocaleDateString()}
                    </div>
                    <div>
                      <span className="text-gray-500">Expires:</span> {new Date(document.expiryDate).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <Button variant="outline" size="sm" className="flex items-center">
                      <FileUp className="h-4 w-4 mr-2" />
                      Upload Copy
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

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

const DocumentsPage = () => {
  return (
    <Layout>
      <TransportSafetyProvider>
        <DocumentPageContent />
      </TransportSafetyProvider>
    </Layout>
  );
};

export default DocumentsPage;
