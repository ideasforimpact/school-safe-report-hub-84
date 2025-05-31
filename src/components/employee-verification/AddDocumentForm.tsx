
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
  const { 
    addDocument, 
    fetchEmployeeDocuments, 
    documentTypes, 
    fetchDocumentStatuses, 
    documentStatuses 
  } = useEmployeeVerification();

  // Fetch document statuses only once when the component mounts
  useEffect(() => {
    fetchDocumentStatuses();
  }, [fetchDocumentStatuses]);
  
  // Only fetch employee documents once when the component mounts
  useEffect(() => {
    // Only fetch if employeeId is available
    if (employeeId) {
      fetchEmployeeDocuments(employeeId);
    }
  }, [employeeId, fetchEmployeeDocuments]);

  const handleFileUploaded = (base64: string) => {
    // This function will be called when a file is uploaded
    //console.log('File uploaded, size:', base64.length);
  };

  const getDocumentTypeLabel = (typeId: string): string => {
    const docType = documentTypes.find(type => type.id === typeId);
    return docType?.description || docType?.name || 'Document';
  };

  // Check if selected type is driving license
  const isDrivingLicense = (typeId: string): boolean => {
    const docType = documentTypes.find(type => type.id === typeId);
    return docType?.name === 'driving_license' || typeId === '4';
  };

  // Check if selected type is bank account
  const isBankAccount = (typeId: string): boolean => {
    const docType = documentTypes.find(type => type.id === typeId);
    return docType?.name === 'bank_account' || typeId === '3';
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

    // For driving license, validate date of birth
    if (isDrivingLicense(selectedTypeId) && !values.dateOfBirth) {
      toast({
        title: 'Error',
        description: 'Please provide date of birth for driving license',
        variant: 'destructive',
      });
      return;
    }

    // For bank account, validate account number and IFSC code
    if (isBankAccount(selectedTypeId) && (!values.accountNumber || !values.ifscCode)) {
      toast({
        title: 'Error',
        description: 'Please provide account number and IFSC code for bank account',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Find the pending status ID
      const pendingStatus = documentStatuses.find(status => status.name.toLowerCase() === 'pending');

      // Prepare params object based on document type
      let params;
      if (isDrivingLicense(selectedTypeId) && values.dateOfBirth) {
        params = { DOB: values.dateOfBirth };
      } else if (isBankAccount(selectedTypeId)) {
        params = { 
          accountNumber: values.accountNumber,
          ifscCode: values.ifscCode,
          'ifsc-details': true
        };
      }

      const documentData = {
        employeeId,
        documentTypeId: selectedTypeId,
        documentNumber: values.documentNumber,
        documentImage: values.documentImage,
        documentStatusId: pendingStatus?.id,
        verificationStatus: 'pending' as 'pending' | 'verified' | 'failed',
        params: params // Add params object with DOB for driving license or account details for bank
      };

      //console.log('Adding document with data:', {
        employeeId: documentData.employeeId,
        documentTypeId: documentData.documentTypeId,
        documentNumber: documentData.documentNumber ? 'Provided' : 'Not provided',
        documentStatusId: documentData.documentStatusId || 'Not provided',
        verificationStatus: documentData.verificationStatus,
        params: params ? JSON.stringify(params) : 'Not provided',
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
