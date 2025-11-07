
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { CalendarIcon, Upload, Loader2 } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { DatePickerWithYearMonth } from '@/components/ui/date-picker-with-year-month';
import { useToast } from '@/hooks/use-toast';
import { useEmployeeVerification } from '@/contexts/employee-verification';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployeeStore } from '@/store/EmployeeContext';
import { getEmployeeData } from '@/store/employeeSelectors';
import ImageUpload from '@/components/ImageUpload';
import DocumentFileUploader from './DocumentFileUploader';
import BankStatementUploader from './BankStatementUploader';
import DocumentNumberInput from './DocumentNumberInput';
import DocumentDisplay from './DocumentDisplay';
import CustomDocumentUploader from './CustomDocumentUploader';
import PoliceVerificationUploader from './PoliceVerificationUploader';
import { FileItem } from '@/types/fileTypes';
import { enqueueEmployeeDocumentUpload } from '@/services/employee/employeeDocumentUploadService';

interface DocumentFormProps {
  employeeId: string;
  selectedTypeId: string;
  files: any[];
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
  const [documentNumber, setDocumentNumber] = useState('');
  const [documentImage, setDocumentImage] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState<Date>();
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [otherType, setOtherType] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [bankStatementFiles, setBankStatementFiles] = useState<FileItem[]>([]);
  const [genericFiles, setGenericFiles] = useState<FileItem[]>([]);
  const [policeVerificationFiles, setPoliceVerificationFiles] = useState<FileItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadItems, setUploadItems] = useState<{ id: string; name: string; progress: number; status: 'uploading' | 'done' | 'error'; error?: string }[]>([]);
  
  // Custom document fields
  const [customDocumentName, setCustomDocumentName] = useState('');
  const [customDocumentFiles, setCustomDocumentFiles] = useState<FileItem[]>([]);
  
  const { toast } = useToast();
  const { user } = useAuth();
  const { state } = useEmployeeStore();
  const employeeData = getEmployeeData(state);
  const { documentTypes, fetchEmployeeDocuments, getEmployeeDocuments } = useEmployeeVerification();

  // Aggregate progress for the overlay widget
  const totalProgress = React.useMemo(() => {
    if (!uploading || uploadItems.length === 0) return 0;
    const sum = uploadItems.reduce((acc, it) => acc + (isFinite(it.progress) ? it.progress : 0), 0);
    return Math.floor(sum / uploadItems.length);
  }, [uploading, uploadItems]);

  // Get document type details
  const documentType = documentTypes.find(type => type.id === selectedTypeId);
  const isDrivingLicense = documentType?.name === 'driving_license';
  const isPassport = documentType?.name === 'passport';
  const isBankAccount = documentType?.name === 'bank_account';
  const isManualType = documentType?.name === 'manual';
  const isOtherDocuments = documentType?.name === 'other_documents';

  // Check if document already exists
  const existingDocuments = getEmployeeDocuments(employeeId);
  const existingDocument = existingDocuments.find(doc => doc.documentTypeId === selectedTypeId);
  
  // Helper function to check if document type should show existing document restriction
  const shouldShowExistingDocumentRestriction = (typeName: string) => {
    // Don't show restriction for types that allow multiple uploads
    return !['manual', 'other_documents'].includes(typeName);
  };
  
  const hasExistingDocument = !!existingDocument && shouldShowExistingDocumentRestriction(documentType?.name || '');

  // Pre-populate with existing document data if available (only if we're showing the form)
  useEffect(() => {
    if (selectedTypeId && employeeId && !hasExistingDocument) {
      // Clear form for new documents
      setDocumentNumber('');
      setAccountNumber('');
      setIfscCode('');
      setDateOfBirth(undefined);
      setOtherType('');
      setCustomDocumentName('');
      setCustomDocumentFiles([]);
    }
  }, [selectedTypeId, employeeId, hasExistingDocument]);

  // Handle Police Verification file upload with queue
  const handlePoliceVerificationUpload = async (files: FileItem[]) => {
    const clientId = employeeData?.clientId || state.clientId;
    if (!clientId) {
      toast({
        title: 'Error',
        description: 'Client ID not found. Please ensure you are logged in properly.',
        variant: 'destructive',
      });
      return;
    }

    if (files.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one file to upload.',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    setUploading(true);
    // Initialize progress tracking
    setUploadItems(files.map((f) => ({ id: f.id, name: f.name, progress: 0, status: 'uploading' as const })));

    let createdDocumentId: string | null = null;
    try {
      // First, create the document record via the existing edge function
      const { data: docData, error: docError } = await supabase.functions.invoke('other-document-verification', {
        body: {
          action: 'processPoliceVerification',
          employeeId,
          clientId,
          documentTypeId: selectedTypeId,
          params: { selected: 'police_verification' }
        }
      });

      if (docError || !docData?.success || !docData?.document?.id) {
        // Surface edge-function error (e.g., Duplicate / resource already exists)
        const serverMsg = (docData && (docData.message || docData.error)) || docError?.message;
        toast({
          title: 'Request failed',
          description: serverMsg || 'Failed to create document record',
          variant: 'destructive',
        });
        throw new Error(serverMsg || 'Failed to create document record');
      }

      createdDocumentId = docData.document.id as string;
      const bucketName = 'employee_other_documents';
      const verificationType = 'police'; // Can be extracted from params if needed
      const baseFolderPath = `${clientId}/${employeeId}/${createdDocumentId}/${verificationType}`;

      // Upload files to storage and get their paths with progress tracking
      const uploadPromises = files.map(async (fileItem, idx) => {
        try {
          // Convert base64 to File object for upload
          // Base64 string format: data:image/jpeg;base64,/9j/4AAQSkZJRg...
          const base64Data = fileItem.base64.includes(',') 
            ? fileItem.base64.split(',')[1] 
            : fileItem.base64;
          const byteCharacters = atob(base64Data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: fileItem.type || 'application/octet-stream' });
          const file = new File([blob], fileItem.name, { type: fileItem.type || 'application/octet-stream' });

          const objectPath = `${baseFolderPath}/${fileItem.name}`;
          
          // Create signed upload URL
          const signed = await supabase.storage.from(bucketName).createSignedUploadUrl(objectPath);
          
          if (signed.error || !signed.data?.signedUrl) {
            // Surface storage error via toast for immediate feedback
            const errorMsg = signed.error?.message || 'Failed to create signed upload URL';
            // Use setTimeout to ensure toast is shown even if promise is rejected immediately
            setTimeout(() => {
              toast({
                title: 'Upload error',
                description: `${fileItem.name}: ${errorMsg}`,
                variant: 'destructive',
              });
            }, 0);
            // Best-effort rollback: delete the created document immediately
            try {
              if (createdDocumentId) {
                const { error: rollbackErr } = await supabase
                  .from('employee_documents')
                  .delete()
                  .eq('id', createdDocumentId);
                if (rollbackErr) {
                  console.error('Immediate rollback failed (createSignedUploadUrl error)', rollbackErr);
                }
              }
            } catch (rbErr) {
              console.error('Immediate rollback exception', rbErr);
            }
            throw new Error(errorMsg);
          }

          // Upload file using XHR for progress tracking
          await xhrPut(signed.data.signedUrl, file, (pct) => {
            setUploadItems((prev) => prev.map((it, i) => i === idx ? { ...it, progress: pct } : it));
          });

          setUploadItems((prev) => prev.map((it, i) => i === idx ? { ...it, progress: 100, status: 'done' } : it));

          return {
            objectPath,
            fileName: fileItem.name,
            contentType: fileItem.type || 'application/octet-stream',
            size: fileItem.size,
          };
        } catch (err: any) {
          // Show per-file error toast with specific reason if available
          const errorMsg = err?.message || 'Unknown storage error';
          setTimeout(() => {
            toast({
              title: 'Upload failed',
              description: `${fileItem.name}: ${errorMsg}`,
              variant: 'destructive',
            });
          }, 0);
          setUploadItems((prev) => prev.map((it, i) => i === idx ? { ...it, status: 'error' as const, error: errorMsg } : it));
          throw err;
        }
      });

      const uploadedFiles = await Promise.allSettled(uploadPromises);
      const successfulFiles = uploadedFiles
        .filter((r) => r.status === 'fulfilled')
        .map((r) => (r as PromiseFulfilledResult<any>).value);

      console.log(uploadedFiles,"uploadedFiles");
      

      const failures = uploadedFiles
        .map((r, i) => ({ r, i }))
        .filter((x) => x.r.status === 'rejected');

      if (failures.length > 0) {
        toast({ 
          title: 'Some uploads failed', 
          description: `${failures.length} file(s) failed to upload`,
          variant: 'destructive',
        });
      }

      if (successfulFiles.length === 0) {
        throw new Error('All file uploads failed');
      }

      // Enqueue metadata update job
      await enqueueEmployeeDocumentUpload({
        clientId,
        employeeId,
        documentId: createdDocumentId as string,
        files: successfulFiles,
      });

      toast({
        title: 'Police Verification Initiated',
        description: `${successfulFiles.length} file(s) uploaded successfully. Processing...`,
      });

      // Wait a moment for queue processing
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Refresh employee documents
      if (employeeId) {
        await fetchEmployeeDocuments(employeeId);
      }

      // Reset form and redirect
      setPoliceVerificationFiles([]);
      setOtherType('');
      setUploading(false);
      setTimeout(() => setUploadItems([]), 500);
      
      // Redirect to employee detail page
      if (onCancel) {
        onCancel();
      }
    } catch (error: any) {
      console.error('Error uploading police verification files:', error);
      // Best-effort rollback: delete the document record if it was created
      try {
        const toDeleteId = createdDocumentId || undefined;
        if (toDeleteId) {
          const { error: rollbackErr } = await supabase
            .from('employee_documents')
            .delete()
            .eq('id', toDeleteId);
          if (rollbackErr) {
            console.error('Rollback failed: could not delete document record', rollbackErr);
          }
        }
      } catch (rbErr) {
        console.error('Rollback exception', rbErr);
      }
      toast({
        title: 'Error',
        description: error?.message || 'Failed to upload files. Please try again.',
        variant: 'destructive',
      });
      setUploading(false);
    } finally {
      setIsProcessing(false);
    }
  };

  // XHR upload helper for progress tracking
  const xhrPut = (url: string, file: File, onProgress?: (pct: number) => void): Promise<void> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', url, true);
      xhr.upload.onprogress = (evt) => {
        if (!evt.lengthComputable) return;
        const pct = (evt.loaded / evt.total) * 100;
        onProgress?.(pct);
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          const msg = xhr.responseText ? `${xhr.status}: ${xhr.responseText}` : `Upload failed with status ${xhr.status}`;
          reject(new Error(msg));
        }
      };
      xhr.onerror = () => reject(new Error('Network error during upload'));
      if (file.type) xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);
    });
  };

  // Handle direct edge function calls for Court Case Check, Digital Credibility and Social Persona
  const handleDirectSubmission = async (verificationType: 'court_case_check' | 'digital_credibility_check' | 'social_persona_check' | 'drug_check') => {
    const clientId = employeeData?.clientId || state.clientId;
    if (!clientId) {
      toast({
        title: 'Error',
        description: 'Client ID not found. Please ensure you are logged in properly.',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    try {
      console.log(`Calling other-document-verification edge function for ${verificationType}`);
      
    const action =
      verificationType === 'court_case_check'
        ? 'processCourtCaseCheck'
        : verificationType === 'digital_credibility_check'
        ? 'processDigitalCredibilityCheck'
        : verificationType === 'social_persona_check'
        ? 'processSocialPersonaCheck'
        : 'processDrugCheck';
      
      const { data, error } = await supabase.functions.invoke('other-document-verification', {
        body: {
          action,
          employeeId,
          clientId,
          documentTypeId: selectedTypeId,
          params: { selected: verificationType }
        }
      });

      if (error) {
        console.error(`Error calling other-document-verification function for ${verificationType}:`, error);
        throw error;
      }

      console.log(`${verificationType} response:`, data);

      if (data?.success) {
        const successTitleMap: Record<string, string> = {
          court_case_check: 'Court Case Check Initiated',
          police_verification: 'Police Verification Initiated',
          digital_credibility_check: 'Digital Credibility Check Initiated',
          social_persona_check: 'Social Persona Check Initiated',
          drug_check: 'Drug Check Initiated',
        };
        toast({
          title: successTitleMap[verificationType],
          description: data.message || 'Request has been started successfully.',
        });
        
        // Refresh employee documents to show the new document
        if (employeeId) {
          fetchEmployeeDocuments(employeeId);
        }
        
        // Reset form and close
        setDocumentNumber('');
        setDocumentImage('');
        setOtherType('');
        onCancel();
      } else {
        throw new Error(data?.error || `Failed to initiate ${verificationType}`);
      }
    } catch (error) {
      console.error(`Error submitting ${verificationType}:`, error);
      const errorTitleMap: Record<string, string> = {
        court_case_check: 'court case check',
        police_verification: 'police verification',
        digital_credibility_check: 'digital credibility check',
        social_persona_check: 'social persona check',
        drug_check: 'drug check',
      };
      toast({
        title: 'Error',
        description: `Failed to initiate ${errorTitleMap[verificationType]}. Please try again.`,
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle custom document submission
  const handleCustomDocumentSubmit = async (documentName: string, files: FileItem[]) => {
    const clientId = employeeData?.clientId || state.clientId;
    if (!clientId) {
      toast({
        title: 'Error',
        description: 'Client ID not found. Please ensure you are logged in properly.',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    try {
      console.log('Calling custom-document-verification edge function');
      
      const { data, error } = await supabase.functions.invoke('custom-document-verification', {
        body: {
          action: 'uploadCustomDocument',
          employeeId,
          clientId,
          documentTypeId: selectedTypeId,
          documentName,
          documentFiles: files.map(file => ({
            name: file.name,
            base64: file.base64,
            type: file.type,
            size: file.size
          }))
        }
      });

      if (error) {
        console.error('Error calling custom-document-verification function:', error);
        throw error;
      }

      console.log('Custom document upload response:', data);

      if (data?.success) {
        toast({
          title: 'Document Uploaded Successfully',
          description: data.message || 'Your custom document has been uploaded successfully.',
        });
        
        // Refresh employee documents to show the new document
        if (employeeId) {
          fetchEmployeeDocuments(employeeId);
        }
        
        // Reset form and close
        setCustomDocumentName('');
        setCustomDocumentFiles([]);
        onCancel();
      } else {
        throw new Error(data?.error || 'Failed to upload custom document');
      }
    } catch (error) {
      console.error('Error submitting custom document:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload custom document. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const values = {
      documentNumber,
      documentImage,
      dateOfBirth: dateOfBirth ? format(dateOfBirth, 'yyyy-MM-dd') : undefined,
      accountNumber,
      ifscCode,
      otherType
    };
    
    onSubmit(values);
  };

  const renderManualTypeOptions = () => {
    if (!isManualType) return null;

    return (
      <div className="space-y-4">
        <div>
          <Label htmlFor="otherType" className="text-sm font-medium">
            Select Verification Type <span className="text-red-500">*</span>
          </Label>
          <select
            id="otherType"
            value={otherType}
            onChange={(e) => setOtherType(e.target.value)}
            className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">Select verification type</option>
            <option value="bank_statement_analysis">Bank Statement Analysis</option>
            <option value="court_case_check">Court Case Check</option>
            <option value="police_verification">Police Verification</option>
            <option value="digital_credibility_check">Digital Credibility Check</option>
            <option value="social_persona_check">Social Persona Check</option>
            <option value="drug_check">Drug Check</option>
          </select>
        </div>

        {otherType === 'bank_statement_analysis' && (
          <BankStatementUploader
            files={bankStatementFiles}
            setFiles={setBankStatementFiles}
            onFileUploaded={(base64) => {
              setDocumentImage(base64);
              onFileUploaded(base64);
            }}
          />
        )}

        {otherType === 'court_case_check' && (
          <Card className="border-2 border-dashed border-gray-300">
            <CardContent className="p-6 text-center">
              <h3 className="text-lg font-medium mb-2">Court Case Verification</h3>
              <p className="text-gray-600 mb-4">Click the button below to check for court cases through E Court</p>
              <Button
                type="button"
                onClick={() => handleDirectSubmission('court_case_check')}
                disabled={isProcessing}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Check for Court Cases through E Court'
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {otherType === 'police_verification' && (
          <PoliceVerificationUploader
            files={policeVerificationFiles}
            setFiles={setPoliceVerificationFiles}
            onUpload={handlePoliceVerificationUpload}
            isUploading={isProcessing}
            onCancel={onCancel}
          />
        )}

        {otherType === 'digital_credibility_check' && (
          <Card className="border-2 border-dashed border-gray-300">
            <CardContent className="p-6 text-center">
              <h3 className="text-lg font-medium mb-2">Digital Credibility Check</h3>
              <p className="text-gray-600 mb-4">Submit a request for digital credibility screening</p>
              <Button
                type="button"
                onClick={() => handleDirectSubmission('digital_credibility_check')}
                disabled={isProcessing}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Submit for Digital Credibility Check'
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {otherType === 'social_persona_check' && (
          <Card className="border-2 border-dashed border-gray-300">
            <CardContent className="p-6 text-center">
              <h3 className="text-lg font-medium mb-2">Social Persona Check</h3>
              <p className="text-gray-600 mb-4">Submit a request for social persona/background screening</p>
              <Button
                type="button"
                onClick={() => handleDirectSubmission('social_persona_check')}
                disabled={isProcessing}
                className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Submit for Social Persona Check'
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {otherType === 'drug_check' && (
          <Card className="border-2 border-dashed border-gray-300">
            <CardContent className="p-6 text-center">
              <h3 className="text-lg font-medium mb-2">Drug Check</h3>
              <p className="text-gray-600 mb-4">Submit a request for drug/background screening</p>
              <Button
                type="button"
                onClick={() => handleDirectSubmission('drug_check')}
                disabled={isProcessing}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Submit for Drug Check'
                )}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  // Don't show the submit button for court case check, police verification, and custom documents
  // Police verification now uses its own uploader component with built-in submit button
  const shouldShowSubmitButton = !isManualType || (otherType !== 'court_case_check' && otherType !== 'police_verification' && otherType !== 'drug_check' && otherType !== 'digital_credibility_check' && otherType !== 'social_persona_check');
  const shouldShowForm = !isOtherDocuments; // Hide the default form for custom documents

  // If document already exists, show display mode instead of form
  if (hasExistingDocument && existingDocument) {
    return (
      <div className="space-y-4">
        <DocumentDisplay
          documentType={documentType?.name || ''}
          documentNumber={existingDocument.documentNumber}
          documentImage={existingDocument.documentImage}
          fileName={existingDocument.documentImage}
          params={existingDocument.params}
        />
        <div className="flex justify-center pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            Back
          </Button>
        </div>
      </div>
    );
  }

  // For custom documents, show only the custom uploader
  if (isOtherDocuments) {
    return (
      <div className="space-y-4">
        <CustomDocumentUploader
          documentName={customDocumentName}
          setDocumentName={setCustomDocumentName}
          files={customDocumentFiles}
          setFiles={setCustomDocumentFiles}
          onSubmit={handleCustomDocumentSubmit}
          isProcessing={isProcessing}
          onCancel={onCancel}
        />
      </div>
    );
  }

  return (
    <>
      {/* Progress overlay */}
      {uploading && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[1px]">
          <div className="absolute top-4 right-4 w-[min(92vw,320px)] rounded-xl border bg-white shadow-xl p-3 sm:p-4 text-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-gray-800">Uploading files…</span>
              <span className="text-xs text-gray-500">{totalProgress}%</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded">
              <div className="h-2 rounded bg-blue-500 transition-all" style={{ width: `${totalProgress}%` }} />
            </div>
            {uploadItems.length > 1 && (
              <div className="mt-2 text-xs text-gray-500">
                {uploadItems.filter(i => i.status !== 'done').length} of {uploadItems.length} remaining
              </div>
            )}
          </div>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
      {/* Document Number Input */}
      {!isBankAccount && !isManualType && !isOtherDocuments && (
        <DocumentNumberInput
          documentType={documentType?.name || ''}
          value={documentNumber}
          onChange={setDocumentNumber}
          required={true}
        />
      )}

      {/* Date of Birth for Driving License/Passport */}
      {(isDrivingLicense || isPassport) && (
        <div>
          <Label className="text-sm font-medium">
            Date of Birth <span className="text-red-500">*</span>
          </Label>
          <div className="mt-1">
            <DatePickerWithYearMonth
              date={dateOfBirth}
              onChange={setDateOfBirth}
              placeholderText="Select date of birth"
              minYear={1900}
              maxYear={new Date().getFullYear()}
            />
          </div>
        </div>
      )}

      {/* Bank Account Details */}
      {isBankAccount && (
        <>
          <DocumentNumberInput
            documentType="bank_account"
            fieldType="account_number"
            value={accountNumber}
            onChange={setAccountNumber}
            required
          />
          <DocumentNumberInput
            documentType="bank_account"
            fieldType="ifsc_code"
            value={ifscCode}
            onChange={setIfscCode}
            required
          />
        </>
      )}

      {/* Manual Type Options */}
      {renderManualTypeOptions()}

      {/* Document File Upload (allow images and PDF) */}
      {!isBankAccount && !isManualType && !isOtherDocuments && (
        <div>
          <Label className="text-sm font-medium">
            Document Image / PDF <span className="text-red-500">*</span>
          </Label>
          <div className="mt-1">
            <DocumentFileUploader
              files={genericFiles}
              setFiles={setGenericFiles}
              onFileUploaded={(base64) => {
                if (base64) {
                  setDocumentImage(base64);
                  onFileUploaded(base64);
                }
              }}
              acceptedFileTypes="image/*,.pdf"
              documentType={documentType?.name || ''}
              maxFileSize={5}
            />
          </div>
        </div>
      )}

      {/* Form Actions */}
      {shouldShowSubmitButton && (
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting || isProcessing}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || isProcessing}
            className="flex-1"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                {isBankAccount ? 'Submit Details' : 'Upload Document'}
              </>
            )}
          </Button>
        </div>
      )}

      {/* Cancel button only for cases without their own uploader (exclude police verification to avoid duplicate) */}
      {!shouldShowSubmitButton && otherType !== 'police_verification' && (
        <div className="flex justify-center pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isProcessing}
          >
            Cancel
          </Button>
        </div>
      )}
    </form>
    </>
  );
};

export default DocumentForm;
