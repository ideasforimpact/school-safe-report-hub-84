import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { documentFormSchema } from './documentFormSchema';
import DocumentFileUploader from './DocumentFileUploader';
import { FileItem } from '@/types/fileTypes';
import { toast } from '@/hooks/use-toast';
import { useEmployeeVerification } from '@/contexts/employee-verification';
import { Upload } from 'lucide-react';

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
  const [isOtherType, setIsOtherType] = useState(false);
  const [selectedOtherType, setSelectedOtherType] = useState<string>('');
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
    const isOther = docTypeName === 'other' || selectedTypeId === '7';
    
    setShowDateOfBirth(isDrivingLicense);
    setIsBankAccount(isBankAccountDoc);
    setIsOtherType(isOther);
    
    // Reset other type selection when document type changes
    if (!isOther) {
      setSelectedOtherType('');
    }
    
    // Set defaults based on document type
    if (isBankAccountDoc) {
      form.setValue('documentNumber', 'bank-statement');
      form.setValue('documentImage', 'not-required-for-bank-account');
    } else {
      form.setValue('documentNumber', '');
      form.setValue('documentImage', '');
    }

    // Reset file selection when document type changes
    if (!isBankAccountDoc) {
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
        valid = accountNumber !== '' && ifscCode !== '';
      } else if (isOtherType) {
        valid = selectedOtherType !== '';
        if (selectedOtherType === 'bank_statement_analysis') {
          valid = valid && documentImage !== '';
        }
      } else {
        valid = documentImage !== '' && documentNumber !== '';
        if (showDateOfBirth) {
          valid = valid && dateOfBirth !== '';
        }
      }
      
      setIsFormValid(valid);
    });
    
    return () => subscription.unsubscribe();
  }, [form, form.watch, isBankAccount, showDateOfBirth, isOtherType, selectedOtherType]);

  const handleSubmit = (data: any) => {
    if (isOtherType && !selectedOtherType) {
      toast({
        title: 'Error',
        description: 'Please select a verification type',
        variant: 'destructive',
      });
      return;
    }

    if (!isBankAccount && !isOtherType && !data.documentImage) {
      toast({
        title: 'Error',
        description: 'Please upload a document image',
        variant: 'destructive',
      });
      return;
    }

    if (isBankAccount && (!data.accountNumber || !data.ifscCode)) {
      toast({
        title: 'Error',
        description: 'Please enter account number and IFSC code',
        variant: 'destructive',
      });
      return;
    }

    if (isOtherType && selectedOtherType === 'bank_statement_analysis' && !data.documentImage) {
      toast({
        title: 'Error',
        description: 'Please upload a PDF bank statement',
        variant: 'destructive',
      });
      return;
    }

    // Prepare the upload data with special handling for bank statement analysis
    const uploadData = {
      employeeId: employeeId,
      documentTypeId: selectedTypeId,
      documentNumber: isOtherType ? selectedOtherType : data.documentNumber,
      documentImage: isBankAccount ? 'not-required-for-bank-account' : data.documentImage,
      ...(showDateOfBirth && data.dateOfBirth && { dateOfBirth: data.dateOfBirth }),
      ...(isBankAccount && { 
        accountNumber: data.accountNumber,
        ifscCode: data.ifscCode 
      }),
      ...(isOtherType && { 
        otherType: selectedOtherType,
        // Special flag for bank statement analysis to use dedicated storage
        useBankStatementStorage: selectedOtherType === 'bank_statement_analysis'
      }),
    };

    console.log('Submitting document with data:', {
      employeeId: uploadData.employeeId,
      documentTypeId: uploadData.documentTypeId,
      documentNumber: uploadData.documentNumber ? 'Provided' : 'Not provided',
      dateOfBirth: uploadData.dateOfBirth ? 'Provided' : 'Not provided',
      accountNumber: uploadData.accountNumber ? 'Provided' : 'Not provided',
      ifscCode: uploadData.ifscCode ? 'Provided' : 'Not provided',
      otherType: uploadData.otherType || 'Not provided',
      useBankStatementStorage: uploadData.useBankStatementStorage || false,
      imageSize: isBankAccount ? 'Not required for bank account' : (uploadData.documentImage ? uploadData.documentImage.length : 0),
    });

    onSubmit(uploadData);
  };

  const handleFileChange = (base64: string, file?: File) => {
    form.setValue('documentImage', base64);
    setSelectedFileName(file?.name || '');
    onFileUploaded(base64);
  };

  const handleCourtCaseCheck = () => {
    toast({
      title: 'Court Case Check',
      description: 'Initiating court case verification through E Court...',
    });
    // Handle court case check logic
  };

  const handleDrugTest = () => {
    toast({
      title: 'Drug Test',
      description: 'Submitting drug test request...',
    });
    // Handle drug test logic
  };

  const handlePoliceVerification = () => {
    toast({
      title: 'Police Verification',
      description: 'Submitting police verification request...',
    });
    // Handle police verification logic
  };

  const renderOtherTypeContent = () => {
    switch (selectedOtherType) {
      case 'bank_statement_analysis':
        return (
          <FormField
            control={form.control}
            name="documentImage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Bank Statement PDF <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <div className="space-y-2">
                    {!selectedFileName ? (
                      <DocumentFileUploader 
                        files={files}
                        setFiles={() => {}}
                        onFileUploaded={(base64, file) => handleFileChange(base64, file)}
                        acceptedFileTypes='.pdf'
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
                    <p className="text-xs text-gray-500">Please upload your PDF bank statement for analysis</p>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case 'court_case_check':
        return (
          <div className="space-y-4">
            <div className="text-center p-6 border-2 border-dashed border-gray-300 rounded-lg">
              <h4 className="text-lg font-medium mb-2">Court Case Verification</h4>
              <p className="text-gray-600 mb-4">Click the button below to check for court cases through E Court</p>
              <Button 
                type="button" 
                onClick={handleCourtCaseCheck}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Check for Court Cases through E Court
              </Button>
            </div>
          </div>
        );

      case 'drug_test':
        return (
          <div className="space-y-4">
            <div className="text-center p-6 border-2 border-dashed border-gray-300 rounded-lg">
              <h4 className="text-lg font-medium mb-2">Drug Test Verification</h4>
              <p className="text-gray-600 mb-4">Submit a request for drug test verification</p>
              <Button 
                type="button" 
                onClick={handleDrugTest}
                className="bg-green-600 hover:bg-green-700"
              >
                Submit for Drug Test
              </Button>
            </div>
          </div>
        );

      case 'police_verification':
        return (
          <div className="space-y-4">
            <div className="text-center p-6 border-2 border-dashed border-gray-300 rounded-lg">
              <h4 className="text-lg font-medium mb-2">Police Verification</h4>
              <p className="text-gray-600 mb-4">Submit a request for police verification</p>
              <Button 
                type="button" 
                onClick={handlePoliceVerification}
                className="bg-red-600 hover:bg-red-700"
              >
                Submit for Police Verification
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <input type="hidden" {...form.register('employeeId')} value={employeeId} />
        
        {/* Other document type dropdown */}
        {isOtherType && (
          <div className="space-y-4">
            <FormLabel>
              Select Verification Type <span className="text-red-500">*</span>
            </FormLabel>
            <Select value={selectedOtherType} onValueChange={setSelectedOtherType}>
              <SelectTrigger>
                <SelectValue placeholder="Choose verification type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bank_statement_analysis">Bank Statement Analysis</SelectItem>
                <SelectItem value="court_case_check">Court Case Check</SelectItem>
                <SelectItem value="drug_test">Drug Test</SelectItem>
                <SelectItem value="police_verification">Police Verification</SelectItem>
              </SelectContent>
            </Select>
            {!selectedOtherType && <p className="text-xs text-red-500">Please select a verification type</p>}
          </div>
        )}

        {/* Render content based on selected other type */}
        {isOtherType && selectedOtherType && renderOtherTypeContent()}
        
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
        
        {/* Only show document number field if not a bank account and not other type */}
        {!isBankAccount && !isOtherType && (
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
        
        {/* Only show document image upload for non-bank accounts and non-other types */}
        {!isBankAccount && !isOtherType && (
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
             isOtherType ? `Submit ${selectedOtherType.replace('_', ' ')}` :
             isBankAccount ? 'Submit Details' : 'Upload Document'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default DocumentForm;
