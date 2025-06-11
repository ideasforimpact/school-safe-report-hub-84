
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { documentFormSchema } from './documentFormSchema';
import DocumentFileUploader from './DocumentFileUploader';
import BankStatementUploader from './BankStatementUploader';
import { FileItem } from '@/types/fileTypes';
import { toast } from '@/hooks/use-toast';
import { useEmployeeVerification } from '@/contexts/employee-verification';
import { Scale, TestTube, Shield, FileBarChart } from 'lucide-react';

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
  const [isBankStatementAnalysis, setIsBankStatementAnalysis] = useState(false);
  const [isCourtCaseCheck, setIsCourtCaseCheck] = useState(false);
  const [isDrugTest, setIsDrugTest] = useState(false);
  const [isPoliceVerification, setIsPoliceVerification] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
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
    const isBankStatementAnalysisDoc = docTypeName === 'bank_statement_analysis' || selectedTypeId === '8';
    const isCourtCaseCheckDoc = docTypeName === 'court_case_check' || selectedTypeId === '9';
    const isDrugTestDoc = docTypeName === 'drug_test' || selectedTypeId === '10';
    const isPoliceVerificationDoc = docTypeName === 'police_verification' || selectedTypeId === '11';
    
    setShowDateOfBirth(isDrivingLicense);
    setIsBankAccount(isBankAccountDoc);
    setIsBankStatementAnalysis(isBankStatementAnalysisDoc);
    setIsCourtCaseCheck(isCourtCaseCheckDoc);
    setIsDrugTest(isDrugTestDoc);
    setIsPoliceVerification(isPoliceVerificationDoc);
    
    // Set defaults based on document type
    if (isBankAccountDoc) {
      form.setValue('documentNumber', 'bank-statement');
      form.setValue('documentImage', 'not-required-for-bank-account');
    } else if (isBankStatementAnalysisDoc || isCourtCaseCheckDoc || isDrugTestDoc || isPoliceVerificationDoc) {
      form.setValue('documentNumber', 'verification-request');
      form.setValue('documentImage', 'not-required-for-verification');
    } else {
      form.setValue('documentNumber', '');
      form.setValue('documentImage', '');
    }

    // Reset file selection when document type changes
    if (!isBankAccountDoc && !isBankStatementAnalysisDoc) {
      setSelectedFileName('');
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
        // For bank accounts, only require account number and IFSC code
        valid = accountNumber !== '' && ifscCode !== '';
      } else if (isBankStatementAnalysis) {
        // For bank statement analysis, require PDF file
        valid = documentImage !== '' && documentImage !== 'not-required-for-verification';
      } else if (isCourtCaseCheck || isDrugTest || isPoliceVerification) {
        // For verification types, always valid since they just need button clicks
        valid = true;
      } else {
        // For other documents, require document image and document number
        valid = documentImage !== '' && documentNumber !== '';
        
        if (showDateOfBirth) {
          valid = valid && dateOfBirth !== '';
        }
      }
      
      setIsFormValid(valid);
    });
    
    return () => subscription.unsubscribe();
  }, [form, form.watch, isBankAccount, isBankStatementAnalysis, isCourtCaseCheck, isDrugTest, isPoliceVerification, showDateOfBirth]);

  const handleSubmit = (data: any) => {
    // Handle verification button clicks
    if (isCourtCaseCheck) {
      console.log('Court Case Check submitted');
      toast({
        title: 'Court Case Check Initiated',
        description: 'Checking for court cases through E-Court system...',
      });
      return;
    }

    if (isDrugTest) {
      console.log('Drug Test submitted');
      toast({
        title: 'Drug Test Submitted',
        description: 'Drug test verification request has been submitted.',
      });
      return;
    }

    if (isPoliceVerification) {
      console.log('Police Verification submitted');
      toast({
        title: 'Police Verification Submitted',
        description: 'Police verification request has been submitted.',
      });
      return;
    }

    // For bank accounts, skip document image validation
    if (!isBankAccount && !isBankStatementAnalysis && !data.documentImage) {
      toast({
        title: 'Error',
        description: 'Please upload a document image',
        variant: 'destructive',
      });
      return;
    }

    // For bank statement analysis, validate PDF file
    if (isBankStatementAnalysis && !data.documentImage) {
      toast({
        title: 'Error',
        description: 'Please upload a PDF bank statement',
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

    // Prepare the upload data - only send essential fields
    const uploadData = {
      employeeId: employeeId,
      documentTypeId: selectedTypeId,
      documentNumber: data.documentNumber,
      documentImage: (isBankAccount || isBankStatementAnalysis) ? 'not-required-for-bank-account' : data.documentImage,
      // Include date of birth for driving license
      ...(showDateOfBirth && data.dateOfBirth && { dateOfBirth: data.dateOfBirth }),
      // Include bank account details if applicable
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
      imageSize: (isBankAccount || isBankStatementAnalysis) ? 'Not required for this type' : (uploadData.documentImage ? uploadData.documentImage.length : 0),
    });

    onSubmit(uploadData);
  };

  const handleFileChange = (base64: string, file?: File) => {
    form.setValue('documentImage', base64);
    setSelectedFileName(file?.name || '');
    onFileUploaded(base64);
  };

  const handleVerificationButtonClick = (verificationType: string) => {
    console.log(`${verificationType} button clicked`);
    
    const messages = {
      'court_case': 'Court Case Check initiated through E-Court system',
      'drug_test': 'Drug test verification request submitted',
      'police_verification': 'Police verification request submitted'
    };

    toast({
      title: `${verificationType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Submitted`,
      description: messages[verificationType as keyof typeof messages],
    });

    // Call onSubmit to trigger the parent's submission logic
    onSubmit({
      employeeId,
      documentTypeId: selectedTypeId,
      documentNumber: 'verification-request',
      documentImage: 'not-required-for-verification',
      verificationType
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <input type="hidden" {...form.register('employeeId')} value={employeeId} />
        
        {/* Bank Statement Analysis */}
        {isBankStatementAnalysis && (
          <div className="space-y-4">
            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
              <FileBarChart className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">Bank Statement Analysis</h3>
              <p className="text-gray-600 mb-4 text-center">
                Drag and drop your PDF bank statement file here
              </p>
              <div className="text-sm text-red-500 mb-4">* Required field</div>
              <BankStatementUploader 
                files={files}
                setFiles={() => {}} // Handled by parent
                onFileUploaded={(base64, file) => handleFileChange(base64, file)}
                maxFileSize={10}
              />
            </div>
          </div>
        )}

        {/* Court Case Check */}
        {isCourtCaseCheck && (
          <div className="flex flex-col items-center justify-center p-8">
            <Scale className="h-12 w-12 text-blue-600 mb-4" />
            <h3 className="text-lg font-medium mb-2">Court Case Check</h3>
            <p className="text-gray-600 mb-6 text-center">
              Check for any court cases through E-Court system
            </p>
            <div className="text-sm text-red-500 mb-4">* Required field</div>
            <Button 
              type="button"
              onClick={() => handleVerificationButtonClick('court_case')}
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Scale className="h-4 w-4 mr-2" />
              Check for Court Cases through E Court
            </Button>
          </div>
        )}

        {/* Drug Test */}
        {isDrugTest && (
          <div className="flex flex-col items-center justify-center p-8">
            <TestTube className="h-12 w-12 text-green-600 mb-4" />
            <h3 className="text-lg font-medium mb-2">Drug Test</h3>
            <p className="text-gray-600 mb-6 text-center">
              Submit drug test verification request
            </p>
            <div className="text-sm text-red-500 mb-4">* Required field</div>
            <Button 
              type="button"
              onClick={() => handleVerificationButtonClick('drug_test')}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              <TestTube className="h-4 w-4 mr-2" />
              Submit for Drug Test
            </Button>
          </div>
        )}

        {/* Police Verification */}
        {isPoliceVerification && (
          <div className="flex flex-col items-center justify-center p-8">
            <Shield className="h-12 w-12 text-red-600 mb-4" />
            <h3 className="text-lg font-medium mb-2">Police Verification</h3>
            <p className="text-gray-600 mb-6 text-center">
              Submit for police verification check
            </p>
            <div className="text-sm text-red-500 mb-4">* Required field</div>
            <Button 
              type="button"
              onClick={() => handleVerificationButtonClick('police_verification')}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700"
            >
              <Shield className="h-4 w-4 mr-2" />
              Submit for Police Verification
            </Button>
          </div>
        )}
        
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
        
        {/* Only show document number field for regular documents */}
        {!isBankAccount && !isBankStatementAnalysis && !isCourtCaseCheck && !isDrugTest && !isPoliceVerification && (
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
        {!isBankAccount && !isBankStatementAnalysis && !isCourtCaseCheck && !isDrugTest && !isPoliceVerification && (
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
                        setFiles={() => {}} // Handled by parent
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
        
        {/* Only show form actions for non-verification button types */}
        {!isCourtCaseCheck && !isDrugTest && !isPoliceVerification && (
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !isFormValid}>
              {isSubmitting ? 'Uploading...' : (isBankAccount ? 'Submit Details' : (isBankStatementAnalysis ? 'Upload Bank Statement' : 'Upload Document'))}
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
};

export default DocumentForm;
