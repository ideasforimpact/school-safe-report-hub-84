
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useEmployeeVerification } from '@/contexts/employee-verification';
import { FileItem } from '@/types/fileTypes';
import { documentFormSchema, DocumentFormData } from './documentFormSchema';
import DocumentFileUploader from './DocumentFileUploader';
import BankStatementUploader from './BankStatementUploader';
import BankStatementAnalysisTab from './tabs/BankStatementAnalysisTab';
import CourtCaseCheckTab from './tabs/CourtCaseCheckTab';
import DrugTestTab from './tabs/DrugTestTab';
import PoliceVerificationTab from './tabs/PoliceVerificationTab';

interface DocumentFormProps {
  employeeId: string;
  selectedTypeId: string;
  files: FileItem[];
  isSubmitting: boolean;
  onSubmit: (values: any) => void;
  onCancel: () => void;
  onFileUploaded: (base64: string) => void;
}

const DocumentForm: React.FC<DocumentFormProps> = ({
  employeeId,
  selectedTypeId,
  files,
  isSubmitting,
  onSubmit,
  onCancel,
  onFileUploaded
}) => {
  const { documentTypes } = useEmployeeVerification();
  const { toast } = useToast();
  const [localFiles, setLocalFiles] = useState<FileItem[]>(files);
  
  const form = useForm<DocumentFormData>({
    resolver: zodResolver(documentFormSchema),
    defaultValues: {
      documentNumber: '',
      documentImage: '',
      dateOfBirth: '',
      accountNumber: '',
      ifscCode: ''
    }
  });

  // Get the selected document type
  const selectedDocumentType = documentTypes.find(type => type.id === selectedTypeId);
  const documentTypeName = selectedDocumentType?.name || '';

  // Check if this is one of the new verification types
  const isNewVerificationType = ['bank_analysis', 'court_case', 'drug_test', 'police_verification'].includes(documentTypeName);

  // Render special components for new verification types
  if (isNewVerificationType) {
    switch (documentTypeName) {
      case 'bank_analysis':
        return (
          <BankStatementAnalysisTab 
            employeeId={employeeId} 
            onSubmit={() => {
              toast({
                title: 'Bank Analysis Submitted',
                description: 'Bank statement analysis has been submitted successfully.',
              });
            }}
          />
        );
      case 'court_case':
        return (
          <CourtCaseCheckTab 
            employeeId={employeeId} 
            onSubmit={() => {
              toast({
                title: 'Court Case Check Initiated',
                description: 'Court case verification has been initiated.',
              });
            }}
          />
        );
      case 'drug_test':
        return (
          <DrugTestTab 
            employeeId={employeeId} 
            onSubmit={() => {
              toast({
                title: 'Drug Test Requested',
                description: 'Drug test request has been submitted.',
              });
            }}
          />
        );
      case 'police_verification':
        return (
          <PoliceVerificationTab 
            employeeId={employeeId} 
            onSubmit={() => {
              toast({
                title: 'Police Verification Requested',
                description: 'Police verification request has been submitted.',
              });
            }}
          />
        );
      default:
        return null;
    }
  }

  const handleFormSubmit = (values: DocumentFormData) => {
    onSubmit(values);
  };

  const handleFileUpload = (base64: string, file?: File) => {
    onFileUploaded(base64);
  };

  // Check if selected type is driving license
  const isDrivingLicense = documentTypeName === 'driving_license' || selectedTypeId === '4';
  
  // Check if selected type is bank account
  const isBankAccount = documentTypeName === 'bank_account' || selectedTypeId === '3';

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        {isBankAccount ? (
          <BankStatementUploader
            files={localFiles}
            setFiles={setLocalFiles}
            onFileUploaded={handleFileUpload}
          />
        ) : (
          <DocumentFileUploader
            files={localFiles}
            setFiles={setLocalFiles}
            onFileUploaded={handleFileUpload}
            documentType={documentTypeName}
            acceptedFileTypes={isDrivingLicense ? 'image/*,.pdf' : 'image/*,.pdf'}
          />
        )}

        <div className="flex justify-end space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Document'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default DocumentForm;
