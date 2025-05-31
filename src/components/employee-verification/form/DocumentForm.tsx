
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { documentFormSchema } from './documentFormSchema';
import DocumentFileUploader from './DocumentFileUploader';
import { FileItem } from '@/types/fileTypes';
import { toast } from '@/hooks/use-toast';
import { useEmployeeVerification } from '@/contexts/employee-verification';
import BankStatementUploader from './BankStatementUploader';

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
    
    setShowDateOfBirth(isDrivingLicense);
    setIsBankAccount(isBankAccountDoc);
    
    // Set defaults based on document type
    if (isBankAccountDoc) {
      form.setValue('documentNumber', 'bank-statement');
    } else {
      form.setValue('documentNumber', '');
    }

    // Reset file selection when document type changes
    form.setValue('documentImage', '');
    setSelectedFileName('');
  }, [selectedTypeId, documentTypes, form]);

  // Check form validity on value changes
  useEffect(() => {
    const subscription = form.watch((value) => {
      const documentNumber = value.documentNumber || '';
      const documentImage = value.documentImage || '';
      const dateOfBirth = value.dateOfBirth || '';
      const accountNumber = value.accountNumber || '';
      const ifscCode = value.ifscCode || '';
      
      let valid = documentImage !== '';
      
      if (!isBankAccount) {
        valid = valid && documentNumber !== '';
      }
      
      if (showDateOfBirth) {
        valid = valid && dateOfBirth !== '';
      }
      
      if (isBankAccount) {
        valid = valid && accountNumber !== '' && ifscCode !== '';
      }
      
      setIsFormValid(valid);
    });
    
    return () => subscription.unsubscribe();
  }, [form, form.watch, isBankAccount, showDateOfBirth]);

  const handleSubmit = (data: any) => {
    if (!data.documentImage) {
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

    // Prepare the upload data - only send essential fields
    const uploadData = {
      employeeId: employeeId,
      documentTypeId: selectedTypeId,
      documentNumber: data.documentNumber,
      documentImage: data.documentImage,
      // Include date of birth for driving license
      ...(showDateOfBirth && data.dateOfBirth && { dateOfBirth: data.dateOfBirth }),
      // Include bank account details if applicable
      ...(isBankAccount && { 
        accountNumber: data.accountNumber,
        ifscCode: data.ifscCode 
      }),
    };

    //console.log('Submitting document with data:', {
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
    // Validate file type for bank account (PDF only)
    if (isBankAccount && file && !file.type.includes('pdf')) {
      toast({
        title: 'Invalid file format',
        description: 'Bank statements must be in PDF format only',
        variant: 'destructive',
      });
      return;
    }

    form.setValue('documentImage', base64);
    setSelectedFileName(file?.name || '');
    onFileUploaded(base64);
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
        
        {/* Only show document number field if not a bank account */}
        {!isBankAccount && (
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
        
        <FormField
          control={form.control}
          name="documentImage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {isBankAccount ? 'Bank Statement (PDF only)' : 'Document Image'} <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <div className="space-y-2">
                  {!selectedFileName ? (
                    isBankAccount ? (
                      <BankStatementUploader 
                        files={files}
                        setFiles={() => {}} // Handled by parent
                        onFileUploaded={(base64, file) => handleFileChange(base64, file)}
                      />
                    ) : (
                      <DocumentFileUploader 
                        files={files}
                        setFiles={() => {}} // Handled by parent
                        onFileUploaded={(base64, file) => handleFileChange(base64, file)}
                        acceptedFileTypes={isBankAccount ? 'application/pdf' : 'image/*,.pdf'}
                        documentType={isBankAccount ? 'bank_account' : undefined}
                      />
                    )
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
        
        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || !isFormValid}>
            {isSubmitting ? 'Uploading...' : 'Upload Document'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default DocumentForm;
