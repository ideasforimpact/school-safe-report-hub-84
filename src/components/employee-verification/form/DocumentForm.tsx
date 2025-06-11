import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { documentFormSchema } from './documentFormSchema';
import DocumentFileUploader from './DocumentFileUploader';
import DragDropFileUpload from '@/components/file/DragDropFileUpload';
import { FileItem } from '@/types/fileTypes';
import { toast } from '@/hooks/use-toast';
import { useEmployeeVerification } from '@/contexts/employee-verification';
import { Scale, TestTube, Shield } from 'lucide-react';

interface DocumentFormProps {
  employeeId: string;
  selectedTypeId: string;
  files: FileItem[];
  isSubmitting: boolean;
  onSubmit: (data: any) => void;
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
  const form = useForm({
    resolver: zodResolver(documentFormSchema),
    defaultValues: {
      employeeId: employeeId || '',
      documentTypeId: selectedTypeId,
      documentNumber: '',
      documentImage: '',
      dateOfBirth: '',
      accountNumber: '',
      ifscCode: '',
    },
  });

  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [documentNumberHelp, setDocumentNumberHelp] = useState<string>('For security, only the last 2 digits will be visible after submission');
  const [showDateOfBirth, setShowDateOfBirth] = useState(false);
  const [isBankAccount, setIsBankAccount] = useState(false);
  const [isBankAnalysis, setIsBankAnalysis] = useState(false);
  const [isCourtCase, setIsCourtCase] = useState(false);
  const [isDrugTest, setIsDrugTest] = useState(false);
  const [isPoliceVerification, setIsPoliceVerification] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [localFiles, setLocalFiles] = useState<FileItem[]>([]);
  const { documentTypes } = useEmployeeVerification();
  
  // Get the document type name
  const getDocumentTypeName = (): string => {
    const docType = documentTypes.find(type => type.id === selectedTypeId);
    return docType?.name || '';
  };

  // Get document label based on document type
  const getDocumentNumberLabel = (): string => {
    const docTypeName = getDocumentTypeName();
    switch (docTypeName) {
      case 'aadhar': return 'Enter Aadhar Number';
      case 'pan': return 'Enter PAN Number';
      case 'voter_id': return 'Enter Voter ID Number';
      case 'driving_license': return 'Enter Driving License Number';
      case 'bank_account': return 'Enter Account Number';
      case 'passport': return 'Enter Passport Number';
      default: return 'Enter Document Number';
    }
  };

  // Get document placeholder based on document type
  const getDocumentNumberPlaceholder = (): string => {
    const docTypeName = getDocumentTypeName();
    switch (docTypeName) {
      case 'aadhar': return 'XXXX XXXX XXXX';
      case 'pan': return 'ABCDE1234F';
      case 'voter_id': return 'ABC1234567';
      case 'driving_license': return 'DL1234567890123';
      case 'bank_account': return '12345678901234';
      case 'passport': return 'A1234567';
      default: return 'Enter document number';
    }
  };
  
  // Detect document type and set appropriate flags
  useEffect(() => {
    const docType = documentTypes.find(type => type.id === selectedTypeId);
    const docTypeName = docType?.name || '';
    const isDrivingLicense = docTypeName === 'driving_license' || selectedTypeId === '4';
    const isBankAccountDoc = docTypeName === 'bank_account' || selectedTypeId === '3';
    const isBankAnalysisDoc = docTypeName === 'bank_analysis' || selectedTypeId === '8';
    const isCourtCaseDoc = docTypeName === 'court_case' || selectedTypeId === '9';
    const isDrugTestDoc = docTypeName === 'drug_test' || selectedTypeId === '10';
    const isPoliceVerificationDoc = docTypeName === 'police_verification' || selectedTypeId === '11';
    
    setShowDateOfBirth(isDrivingLicense);
    setIsBankAccount(isBankAccountDoc);
    setIsBankAnalysis(isBankAnalysisDoc);
    setIsCourtCase(isCourtCaseDoc);
    setIsDrugTest(isDrugTestDoc);
    setIsPoliceVerification(isPoliceVerificationDoc);
    
    // Set defaults based on document type
    if (isBankAccountDoc) {
      form.setValue('documentNumber', 'bank-statement');
      form.setValue('documentImage', 'not-required-for-bank-account');
    } else if (isBankAnalysisDoc || isCourtCaseDoc || isDrugTestDoc || isPoliceVerificationDoc) {
      form.setValue('documentNumber', 'verification-request');
      form.setValue('documentImage', 'verification-service');
    } else {
      form.setValue('documentNumber', '');
      form.setValue('documentImage', '');
    }

    // Reset file selection when document type changes
    if (!isBankAccountDoc && !isBankAnalysisDoc) {
      setSelectedFileName('');
      setLocalFiles([]);
    }
  }, [selectedTypeId, documentTypes, form]);

  // Check form validity on value changes
  useEffect(() => {
    const subscription = form.watch((value) => {
      const documentNumber = value.documentNumber || '';
      const documentImage = value.documentImage || '';
      const dateOfBirth = value.dateOfBirth || '';
      const accountNumber = value.accountNumber || '';
      const ifscCode = value.ifscCode || '';
      
      let valid = true;
      
      if (isBankAccount) {
        valid = accountNumber !== '' && ifscCode !== '';
      } else if (isBankAnalysis) {
        valid = localFiles.length > 0;
      } else if (isCourtCase || isDrugTest || isPoliceVerification) {
        valid = true; // Just button click required
      } else {
        valid = documentImage !== '' && documentNumber !== '';
        if (showDateOfBirth) {
          valid = valid && dateOfBirth !== '';
        }
      }
      
      setIsFormValid(valid);
    });
    
    return () => subscription.unsubscribe();
  }, [form, form.watch, isBankAccount, isBankAnalysis, isCourtCase, isDrugTest, isPoliceVerification, showDateOfBirth, localFiles]);

  const handleSubmit = (data: any) => {
    // For bank accounts, skip document image validation
    if (!isBankAccount && !isBankAnalysis && !isCourtCase && !isDrugTest && !isPoliceVerification && !data.documentImage) {
      toast({
        title: 'Error',
        description: 'Please upload a document image',
        variant: 'destructive',
      });
      return;
    }

    // For bank account, ensure account number and IFSC code are provided
    if (isBankAccount && (!data.accountNumber || !data.ifscCode)) {
      toast({
        title: 'Error',
        description: 'Please enter account number and IFSC code',
        variant: 'destructive',
      });
      return;
    }

    // For bank analysis, ensure PDF is uploaded
    if (isBankAnalysis && localFiles.length === 0) {
      toast({
        title: 'Error',
        description: 'Please upload a bank statement PDF file',
        variant: 'destructive',
      });
      return;
    }

    // Prepare the upload data
    const uploadData = {
      employeeId: employeeId,
      documentTypeId: selectedTypeId,
      documentNumber: data.documentNumber,
      documentImage: isBankAccount ? 'not-required-for-bank-account' : 
                     (isBankAnalysis ? localFiles[0]?.base64 || 'bank-analysis-pdf' : 
                      (isCourtCase || isDrugTest || isPoliceVerification ? 'verification-service' : data.documentImage)),
      ...(showDateOfBirth && data.dateOfBirth && { dateOfBirth: data.dateOfBirth }),
      ...(isBankAccount && { 
        accountNumber: data.accountNumber,
        ifscCode: data.ifscCode 
      }),
    };

    console.log('Submitting document with data:', {
      employeeId: uploadData.employeeId,
      documentTypeId: uploadData.documentTypeId,
      documentNumber: uploadData.documentNumber ? 'Provided' : 'Not provided',
      dateOfBirth: uploadData.dateOfBirth ? 'Provided' : 'Not provided',
      accountNumber: uploadData.accountNumber ? 'Provided' : 'Not provided',
      ifscCode: uploadData.ifscCode ? 'Provided' : 'Not provided',
      imageSize: uploadData.documentImage ? uploadData.documentImage.length : 0,
    });

    onSubmit(uploadData);
  };

  const handleFileChange = (base64: string, file?: File) => {
    form.setValue('documentImage', base64);
    setSelectedFileName(file?.name || '');
    onFileUploaded(base64);
  };

  const handleBankAnalysisFiles = (files: FileItem[]) => {
    setLocalFiles(files);
    if (files.length > 0) {
      form.setValue('documentImage', files[0].base64);
    }
  };

  const handleCourtCaseCheck = () => {
    toast({
      title: 'Court Case Check',
      description: 'Initiating court case verification through E-Court system...',
    });
    // This would trigger the actual court case check API
  };

  const handleDrugTestSubmit = () => {
    toast({
      title: 'Drug Test',
      description: 'Drug test request has been submitted for processing...',
    });
    // This would trigger the actual drug test process
  };

  const handlePoliceVerificationSubmit = () => {
    toast({
      title: 'Police Verification',
      description: 'Police verification request has been submitted...',
    });
    // This would trigger the actual police verification process
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <input type="hidden" {...form.register('employeeId')} value={employeeId} />
        
        {/* Bank account specific fields */}
        {isBankAccount && (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="accountNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Account Number <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter your bank account number"
                      {...field} 
                    />
                  </FormControl>
                  <p className="text-xs text-gray-500 mt-1">Enter your complete bank account number</p>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="ifscCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    IFSC Code <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., SBIN0000123"
                      {...field} 
                    />
                  </FormControl>
                  <p className="text-xs text-gray-500 mt-1">11-character code that identifies your bank branch</p>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {/* Bank Statement Analysis specific fields */}
        {isBankAnalysis && (
          <div className="space-y-4">
            <FormItem>
              <FormLabel>
                Bank Statement PDF <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <DragDropFileUpload
                  onFilesChange={handleBankAnalysisFiles}
                  initialFiles={localFiles}
                  maxFiles={1}
                  required={true}
                />
              </FormControl>
              <p className="text-xs text-gray-500 mt-1">Please upload your bank statement in PDF format for analysis</p>
              <FormMessage />
            </FormItem>
          </div>
        )}

        {/* Court Case Check specific fields */}
        {isCourtCase && (
          <div className="space-y-4">
            <div className="text-center p-6 border-2 border-dashed border-gray-300 rounded-lg">
              <Scale className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium text-gray-700 mb-2">Court Case Verification</p>
              <p className="text-sm text-gray-500 mb-4">Check for any pending court cases through E-Court system</p>
              <Button 
                type="button" 
                onClick={handleCourtCaseCheck}
                className="bg-amber-600 hover:bg-amber-700"
              >
                Check for Court Cases through E-Court
              </Button>
            </div>
          </div>
        )}

        {/* Drug Test specific fields */}
        {isDrugTest && (
          <div className="space-y-4">
            <div className="text-center p-6 border-2 border-dashed border-gray-300 rounded-lg">
              <TestTube className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium text-gray-700 mb-2">Drug Test Verification</p>
              <p className="text-sm text-gray-500 mb-4">Submit request for drug test verification</p>
              <Button 
                type="button" 
                onClick={handleDrugTestSubmit}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Submit for Drug Test
              </Button>
            </div>
          </div>
        )}

        {/* Police Verification specific fields */}
        {isPoliceVerification && (
          <div className="space-y-4">
            <div className="text-center p-6 border-2 border-dashed border-gray-300 rounded-lg">
              <Shield className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium text-gray-700 mb-2">Police Verification</p>
              <p className="text-sm text-gray-500 mb-4">Submit request for police verification background check</p>
              <Button 
                type="button" 
                onClick={handlePoliceVerificationSubmit}
                className="bg-rose-600 hover:bg-rose-700"
              >
                Submit for Police Verification
              </Button>
            </div>
          </div>
        )}
        
        {/* Only show document number field if not a bank account or new verification types */}
        {!isBankAccount && !isBankAnalysis && !isCourtCase && !isDrugTest && !isPoliceVerification && (
          <FormField
            control={form.control}
            name="documentNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {getDocumentNumberLabel()} <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input 
                    placeholder={getDocumentNumberPlaceholder()}
                    {...field} 
                  />
                </FormControl>
                {documentNumberHelp && (
                  <p className="text-xs text-gray-500 mt-1">{documentNumberHelp}</p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        
        {/* Date of Birth field for driving license */}
        {showDateOfBirth && (
          <FormField
            control={form.control}
            name="dateOfBirth"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Date of Birth <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input 
                    type="date"
                    placeholder="Enter date of birth"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        
        {/* Only show document image upload for regular documents */}
        {!isBankAccount && !isBankAnalysis && !isCourtCase && !isDrugTest && !isPoliceVerification && (
          <FormField
            control={form.control}
            name="documentImage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Document Image <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <div className="space-y-2">
                    {!selectedFileName ? (
                      <DocumentFileUploader 
                        files={files}
                        setFiles={() => {}}
                        onFileUploaded={(base64, file) => handleFileChange(base64, file)}
                        acceptedFileTypes='image/*,.pdf'
                      />
                    ) : (
                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                        <span className="text-sm truncate">{selectedFileName}</span>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => {
                            form.setValue('documentImage', '');
                            setSelectedFileName('');
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        
        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || !isFormValid}>
            {isSubmitting ? 'Processing...' : 
             (isBankAccount ? 'Submit Details' : 
              (isBankAnalysis ? 'Submit for Analysis' :
               (isCourtCase ? 'Submit Court Check' :
                (isDrugTest ? 'Submit Drug Test' :
                 (isPoliceVerification ? 'Submit Police Verification' : 'Upload Document')))))}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default DocumentForm;

}
