
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Upload } from 'lucide-react';
import { VerificationDocumentType } from '@/types/employeeVerification';
import DocumentTypeSelector from './DocumentTypeSelector';
import { useToast } from '@/hooks/use-toast';
import { useEmployeeVerification } from '@/contexts/employee-verification';
import { FileItem } from '@/types/fileTypes';
import DocumentFileUploader from './form/DocumentFileUploader';
import DocumentForm from './form/DocumentForm';
import { DocumentFormValues } from './form/documentFormSchema';
import { getDocumentTypeLabel } from './utils/documentUtils';

interface AddDocumentFormProps {
  employeeId: string;
  onSuccess?: () => void;
}

const AddDocumentForm: React.FC<AddDocumentFormProps> = ({ employeeId, onSuccess }) => {
  const [selectedType, setSelectedType] = useState<VerificationDocumentType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [files, setFiles] = useState<FileItem[]>([]);
  const { toast } = useToast();
  const { addDocument } = useEmployeeVerification();

  const handleFileUploaded = (base64: string) => {
    // This function will be called when a file is uploaded in the DocumentFileUploader
    // We set the value to the form
    // Note: In a real app, you might want to validate the file here
  };

  const handleSubmit = (values: DocumentFormValues) => {
    if (!selectedType) {
      toast({
        title: 'Error',
        description: 'Please select a document type',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      addDocument({
        employeeId,
        documentType: selectedType,
        documentNumber: values.documentNumber,
        documentImage: files[0]?.base64 || values.documentImage, // Use the first file's base64 if available
        verificationStatus: 'pending',
      });
      toast({
        title: 'Document Added',
        description: `The ${getDocumentTypeLabel(selectedType)} has been uploaded successfully and is pending verification.`,
      });
      // Reset form
      setSelectedType(null);
      setFiles([]);
      if (onSuccess) onSuccess();
    } catch (error) {
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
            <h4 className="text-sm font-medium mb-3">Select Document Type</h4>
            <div className="w-full">
              <DocumentTypeSelector selectedType={selectedType} onChange={setSelectedType} />
            </div>
            {!selectedType && <p className="text-xs text-red-500 mt-2">Please select a document type</p>}
          </div>

          {selectedType && (
            <DocumentForm
              selectedType={selectedType}
              files={files}
              isSubmitting={isSubmitting}
              onSubmit={handleSubmit}
              onCancel={onSuccess || (() => {})}
              onFileUploaded={handleFileUploaded}
            >
              <DocumentFileUploader 
                files={files}
                setFiles={setFiles}
                onFileUploaded={handleFileUploaded}
              />
            </DocumentForm>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AddDocumentForm;
