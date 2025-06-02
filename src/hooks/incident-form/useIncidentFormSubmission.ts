
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { incidentDocumentService } from '@/services/incident/incidentDocumentService';
import { FileItem } from '@/types/incident';
import { toast } from 'sonner';

export const useIncidentFormSubmission = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleDocumentUpload = async (incidentId: string, files: FileItem[]) => {
    if (files.length === 0) return [];

    try {
      console.log(`Uploading ${files.length} documents for incident ${incidentId}`);
      const uploadedDocs = await incidentDocumentService.uploadDocuments(files, incidentId);
      console.log('Documents uploaded successfully:', uploadedDocs);
      return uploadedDocs;
    } catch (error) {
      console.error('Error uploading documents:', error);
      toast.error('Failed to upload some documents');
      return [];
    }
  };

  const submitIncident = async (incidentData: any, supportingFiles: FileItem[]) => {
    setIsSubmitting(true);
    
    try {
      // First create the incident (this would be your existing incident creation logic)
      console.log('Creating incident with data:', incidentData);
      
      // For now, simulate incident creation - you'll need to replace this with actual API call
      const mockIncidentId = `incident-${Date.now()}`;
      
      // Upload documents if any
      let uploadedDocuments = [];
      if (supportingFiles.length > 0) {
        uploadedDocuments = await handleDocumentUpload(mockIncidentId, supportingFiles);
      }

      toast.success('Incident reported successfully!');
      navigate('/incidents');
      
      return {
        success: true,
        incidentId: mockIncidentId,
        documents: uploadedDocuments
      };
    } catch (error: any) {
      console.error('Error submitting incident:', error);
      toast.error('Failed to submit incident. Please try again.');
      return {
        success: false,
        error: error.message
      };
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    submitIncident,
    handleDocumentUpload
  };
};
