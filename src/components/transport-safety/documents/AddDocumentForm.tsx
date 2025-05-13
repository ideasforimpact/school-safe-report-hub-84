
import React from 'react';
import DocumentUploader from './DocumentUploader';
import { useTransportSafety } from '@/contexts/transport-safety/TransportSafetyContext';

interface AddDocumentFormProps {
  vehicleId: string;
  onClose: () => void;
}

const AddDocumentForm: React.FC<AddDocumentFormProps> = ({ vehicleId, onClose }) => {
  const { fetchVehicles } = useTransportSafety();
  
  const handleUploadSuccess = () => {
    // Refresh the vehicles data to show the new documents
    fetchVehicles();
  };
  
  return (
    <DocumentUploader
      vehicleId={vehicleId}
      onClose={onClose}
      onSuccess={handleUploadSuccess}
    />
  );
};

export default AddDocumentForm;
