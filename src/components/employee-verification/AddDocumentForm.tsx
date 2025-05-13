import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useEmployeeVerification } from '@/contexts/employee-verification';
import { FileItem } from '@/types/fileTypes';
import DocumentForm from './form/DocumentForm';
import DocumentTypeSelector from './DocumentTypeSelector';

interface AddDocumentFormProps {
  employeeId: string;
  onSuccess?: () => void;
}

const AddDocumentForm: React.FC<AddDocumentFormProps> = ({ employeeId, onSuccess }) => {
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [files, setFiles] = useState<FileItem[]>([]);
  const { toast } = useToast();
  const { addDocument, fetchEmployeeDocuments, documentTypes } = useEmployeeVerification();

  // Only fetch employee documents once when the component mounts
  useEffect(() => {
    fetchEmployeeDocuments(employeeId);
  }, [employeeId, fetchEmployeeDocuments]);

  const handleFileUploaded = (base64: string) => {
    // This function will be called when a file is uploaded
    console.log('File uploaded, size:', base64.length);
  };

  const getDocumentTypeLabel = (typeId: string): string => {
    const docType = documentTypes.find(type => type.id === typeId);
    return docType?.description || docType?.name || 'Document';
  };

  const handleSubmit = async (values: any) => {
    if (!selectedTypeId) {
      toast({
        title: 'Error',
        description: 'Please select a document type',
        variant: 'destructive',
      });
      return;
    }

    if (!values.documentImage) {
      toast({
        title: 'Error',
        description: 'Please upload a document image',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const documentData = {
        employeeId,
        documentTypeId: selectedTypeId,
        documentNumber: values.documentNumber,
        documentImage: values.documentImage,
        verificationStatus: 'pending' as 'pending' | 'verified' | 'failed'
      };

      console.log('Adding document with data:', {
        employeeId: documentData.employeeId,
        documentTypeId: documentData.documentTypeId,
        documentNumber: documentData.documentNumber,
        verificationStatus: documentData.verificationStatus,
        // Don't log entire base64 string
        documentImageSize: documentData.documentImage ? documentData.documentImage.length : 0,
      });

      await addDocument(documentData);
      
      toast({
        title: 'Document Added',
        description: `The ${getDocumentTypeLabel(selectedTypeId)} has been uploaded successfully and is pending verification.`,
      });
      
      // Reset form
      setSelectedTypeId(null);
      setFiles([]);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error adding document:', error);
      toast({
        title: 'Error',
        description: 'Failed to add document. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border border-blue-100 bg-gradient-to-br from-white to-blue-50">
      <CardContent className="pt-6">
        <div className="flex items-center mb-4">
          <Upload className="h-5 w-5 mr-2 text-primary" />
          <h3 className="text-lg font-medium">Upload Document for Verification</h3>
        </div>
        
        <div className="space-y-6 w-full">
          <div>
            <h4 className="text-sm font-medium mb-3">Select Document Type <span className="text-red-500">*</span></h4>
            <div className="w-full">
              <DocumentTypeSelector 
                selectedTypeId={selectedTypeId} 
                onChange={setSelectedTypeId} 
              />
            </div>
            {!selectedTypeId && <p className="text-xs text-red-500 mt-2">Please select a document type</p>}
          </div>

          {selectedTypeId && (
            <DocumentForm
              employeeId={employeeId}
              selectedTypeId={selectedTypeId}
              files={files}
              isSubmitting={isSubmitting}
              onSubmit={handleSubmit}
              onCancel={onSuccess || (() => {})}
              onFileUploaded={handleFileUploaded}
            />
          )}

          {isSubmitting && (
            <div className="flex justify-center items-center py-4">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <p className="ml-2 text-gray-600">Uploading document...</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AddDocumentForm;
