
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
import { useToast } from '@/hooks/use-toast';
import { useEmployeeVerification } from '@/contexts/employee-verification';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployeeStore } from '@/store/EmployeeContext';
import { getEmployeeData } from '@/store/employeeSelectors';
import ImageUpload from '@/components/ImageUpload';
import BankStatementUploader from './BankStatementUploader';
import { FileItem } from '@/types/fileTypes';

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
  
  const { toast } = useToast();
  const { user } = useAuth();
  const { state } = useEmployeeStore();
  const employeeData = getEmployeeData(state);
  const { documentTypes, fetchEmployeeDocuments } = useEmployeeVerification();

  // Get document type details
  const documentType = documentTypes.find(type => type.id === selectedTypeId);
  const isDrivingLicense = documentType?.name === 'driving_license';
  const isBankAccount = documentType?.name === 'bank_account';
  const isOtherType = documentType?.name === 'other';

  // Handle direct edge function calls for Court Case Check and Police Verification
  const handleDirectSubmission = async (verificationType: 'court_case_check' | 'police_verification') => {
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
      
      const action = verificationType === 'court_case_check' ? 'processCourtCaseCheck' : 'processPoliceVerification';
      
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
        toast({
          title: verificationType === 'court_case_check' ? 'Court Case Check Initiated' : 'Police Verification Initiated',
          description: data.message || `${verificationType === 'court_case_check' ? 'Court case check' : 'Police verification'} has been started successfully.`,
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
      toast({
        title: 'Error',
        description: `Failed to initiate ${verificationType === 'court_case_check' ? 'court case check' : 'police verification'}. Please try again.`,
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

  const renderOtherTypeOptions = () => {
    if (!isOtherType) return null;

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
          <Card className="border-2 border-dashed border-gray-300">
            <CardContent className="p-6 text-center">
              <h3 className="text-lg font-medium mb-2">Police Verification</h3>
              <p className="text-gray-600 mb-4">Submit a request for police verification</p>
              <Button
                type="button"
                onClick={() => handleDirectSubmission('police_verification')}
                disabled={isProcessing}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Submit for Police Verification'
                )}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  // Don't show the submit button for court case check and police verification
  const shouldShowSubmitButton = !isOtherType || (otherType !== 'court_case_check' && otherType !== 'police_verification');

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Document Number Input */}
      {!isBankAccount && !isOtherType && (
        <div>
          <Label htmlFor="documentNumber" className="text-sm font-medium">
            Document Number <span className="text-red-500">*</span>
          </Label>
          <Input
            id="documentNumber"
            type="text"
            value={documentNumber}
            onChange={(e) => setDocumentNumber(e.target.value)}
            placeholder="Enter document number"
            required
            className="mt-1"
          />
        </div>
      )}

      {/* Date of Birth for Driving License */}
      {isDrivingLicense && (
        <div>
          <Label className="text-sm font-medium">
            Date of Birth <span className="text-red-500">*</span>
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full mt-1 justify-start text-left font-normal",
                  !dateOfBirth && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateOfBirth ? format(dateOfBirth, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={dateOfBirth}
                onSelect={setDateOfBirth}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      )}

      {/* Bank Account Details */}
      {isBankAccount && (
        <>
          <div>
            <Label htmlFor="accountNumber" className="text-sm font-medium">
              Account Number <span className="text-red-500">*</span>
            </Label>
            <Input
              id="accountNumber"
              type="text"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="Enter account number"
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="ifscCode" className="text-sm font-medium">
              IFSC Code <span className="text-red-500">*</span>
            </Label>
            <Input
              id="ifscCode"
              type="text"
              value={ifscCode}
              onChange={(e) => setIfscCode(e.target.value)}
              placeholder="Enter IFSC code"
              required
              className="mt-1"
            />
          </div>
        </>
      )}

      {/* Other Type Options */}
      {renderOtherTypeOptions()}

      {/* Document Image Upload */}
      {!isBankAccount && !isOtherType && (
        <div>
          <Label className="text-sm font-medium">
            Document Image <span className="text-red-500">*</span>
          </Label>
          <div className="mt-1">
            <ImageUpload
              onImageChange={(base64) => {
                if (base64) {
                  setDocumentImage(base64);
                  onFileUploaded(base64);
                }
              }}
              className="w-full"
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

      {/* Cancel button only for court case check and police verification */}
      {!shouldShowSubmitButton && (
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
  );
};

export default DocumentForm;
