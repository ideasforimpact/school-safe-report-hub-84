
import React, { useState } from 'react';
import { Eye, Download, ShieldCheck, Shield, AlertTriangle, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEmployeeVerification } from '@/contexts/employee-verification';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { VerificationDocument } from '@/types/employeeVerification';
import DocumentDeleteButton from '../document-card/DocumentDeleteButton';
import VerificationStatusBadge from '../VerificationStatusBadge';
import { getDocumentIcon } from '../utils/documentUtils';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { supabase } from '@/integrations/supabase/client';

interface DocumentsTableProps {
  documents: VerificationDocument[];
  onViewDocument: (documentImage: string) => void;
  onDownloadDocument: (documentImage: string) => void;
  onVerifyDocument: (documentId: string) => void;
}

const DocumentsTable: React.FC<DocumentsTableProps> = ({
  documents,
  onViewDocument,
  onDownloadDocument,
  onVerifyDocument
}) => {
  const [verifying, setVerifying] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState<string | null>(null);
  const [otp, setOtp] = useState('');
  const [requestingOtp, setRequestingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpRequested, setOtpRequested] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [txnId, setTxnId] = useState<string | null>(null);
  const [activeButtonId, setActiveButtonId] = useState<string | null>(null);
  
  const { verifyDocument } = useEmployeeVerification();
  const { toast } = useToast();

  const formatDocumentType = (type: string) => {
    return type.replace('_', ' ');
  };

  const handleVerify = async (document: VerificationDocument, status: 'verified' | 'failed', method: 'api' | 'manual') => {
    const docId = document.id;

    // For Aadhar documents that need OTP verification
    if (document.documentType === 'aadhar' && method === 'api' && status === 'verified') {
      setShowOtpInput(docId);
      setActiveButtonId(`verify-api-${docId}`);
      setError(null);
      return;
    }
    
    setVerifying(true);
    try {
      // In a real app, this would call an API to verify the document
      setTimeout(() => {
        const notes = status === 'verified' 
          ? `Document ${method === 'api' ? 'automatically' : 'manually'} verified successfully.` 
          : 'Failed to verify document. Details do not match records.';
        
        verifyDocument(
          document.id, 
          status, 
          notes
        );
        
        toast({
          title: status === 'verified' ? 'Document Verified' : 'Verification Failed',
          description: status === 'verified' 
            ? `The document has been ${method === 'api' ? 'automatically' : 'manually'} verified successfully.` 
            : 'Document verification failed.',
        });
        setVerifying(false);
        setActiveButtonId(null);
      }, 1500); // Simulate API delay
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred during verification.',
        variant: 'destructive',
      });
      setVerifying(false);
      setActiveButtonId(null);
    }
  };

  const handleRequestOtp = async (document: VerificationDocument) => {
    if (!document.documentNumber) {
      setError('Aadhar number is required for verification');
      return;
    }

    setError(null);
    setRequestingOtp(true);

    try {
      const { data, error: requestError } = await supabase.functions.invoke('employee-documents', {
        method: 'POST',
        body: {
          action: 'requestAadharOtp',
          documentNumber: document.documentNumber
        }
      });

      if (requestError) {
        throw new Error(requestError.message || 'Failed to request OTP');
      }

      if (data?.success) {
        setOtpRequested(document.id);
        setTxnId(data.txnId);
        toast({
          title: "OTP Sent",
          description: "OTP has been sent to the registered mobile number.",
        });
      } else {
        throw new Error(data?.message || 'OTP request failed');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to request OTP');
    } finally {
      setRequestingOtp(false);
    }
  };

  const handleVerifyOtp = async (document: VerificationDocument) => {
    if (!otp || otp.length < 6) {
      setError('Please enter a valid OTP');
      return;
    }

    if (!txnId) {
      setError('Transaction ID not found, please request OTP again');
      return;
    }

    setError(null);
    setVerifyingOtp(true);

    try {
      const { data, error: verifyError } = await supabase.functions.invoke('employee-documents', {
        method: 'POST',
        body: {
          action: 'verifyAadharOtp',
          otp,
          txnId,
          documentId: document.id
        }
      });

      if (verifyError) {
        throw new Error(verifyError.message || 'Failed to verify OTP');
      }

      if (data?.success) {
        toast({
          title: "Verification Successful",
          description: "Aadhar verified successfully",
        });
        
        // Reset OTP state
        resetOtpState();
        // No need to manually update document state, the context will handle it
      } else {
        throw new Error(data?.message || 'OTP verification failed');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to verify OTP');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const resetOtpState = () => {
    setOtp('');
    setOtpRequested(null);
    setTxnId(null);
    setError(null);
    setShowOtpInput(null);
    setActiveButtonId(null);
  };

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Type</TableHead>
            <TableHead>Document #</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((doc) => (
            <TableRow key={doc.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  {getDocumentIcon(doc.documentType)}
                  <span className="capitalize">{doc.documentType.replace('_', ' ')}</span>
                </div>
              </TableCell>
              <TableCell>{doc.documentNumber || '—'}</TableCell>
              <TableCell>
                <VerificationStatusBadge status={doc.verificationStatus} verificationMethod={doc.verificationMethod} />
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center space-x-2 justify-end">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => onViewDocument(doc.documentImage)}
                  >
                    <Eye className="h-4 w-4" />
                    <span className="sr-only">View</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => onDownloadDocument(doc.documentImage)}
                  >
                    <Download className="h-4 w-4" />
                    <span className="sr-only">Download</span>
                  </Button>
                  
                  {doc.verificationStatus === 'pending' && (
                    <>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className={`bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 ${activeButtonId === `verify-api-${doc.id}` ? 'ring-2 ring-blue-500' : ''}`}
                        onClick={() => handleVerify(doc, 'verified', 'api')}
                        disabled={verifying || showOtpInput === doc.id}
                        id={`verify-api-${doc.id}`}
                      >
                        <ShieldCheck className="h-4 w-4 mr-1" />
                        Govt Verify
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200"
                        onClick={() => handleVerify(doc, 'verified', 'manual')}
                        disabled={verifying || showOtpInput === doc.id}
                      >
                        <Shield className="h-4 w-4 mr-1" />
                        Manual
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                        onClick={() => handleVerify(doc, 'failed', 'manual')}
                        disabled={verifying || showOtpInput === doc.id}
                      >
                        <AlertTriangle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </>
                  )}
                  
                  <DocumentDeleteButton documentId={doc.id} />
                </div>
                
                {showOtpInput === doc.id && (
                  <div className="mt-2 p-3 border border-blue-200 rounded-md bg-blue-50">
                    {error && (
                      <div className="bg-red-50 p-3 rounded-md border border-red-200 flex items-center gap-2 text-red-700 mb-2">
                        <AlertTriangle className="h-4 w-4" />
                        <p className="text-sm">{error}</p>
                      </div>
                    )}

                    <div className="flex flex-col items-center justify-center gap-4 py-2">
                      {!otpRequested || otpRequested !== doc.id ? (
                        <div className="w-full">
                          <p className="text-sm text-blue-700 mb-2">Request an OTP to be sent to the registered mobile number linked with this Aadhar.</p>
                          <Button
                            onClick={() => handleRequestOtp(doc)}
                            disabled={requestingOtp}
                            className="w-full"
                          >
                            {requestingOtp && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Request OTP
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="flex flex-col items-center space-y-2 w-full">
                            <p className="text-sm text-gray-500">Enter the 6-digit verification code</p>
                            <InputOTP
                              maxLength={6}
                              value={otp}
                              onChange={setOtp}
                              render={({ slots }) => (
                                <InputOTPGroup>
                                  {slots.map((slot, i) => (
                                    <InputOTPSlot key={i} {...slot} index={i} />
                                  ))}
                                </InputOTPGroup>
                              )}
                            />
                          </div>

                          <div className="flex flex-col w-full gap-2">
                            <Button
                              onClick={() => handleVerifyOtp(doc)}
                              disabled={verifyingOtp || otp.length < 6}
                              className="w-full"
                            >
                              {verifyingOtp && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                              Verify OTP
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => handleRequestOtp(doc)}
                              disabled={requestingOtp}
                              className="w-full"
                            >
                              {requestingOtp && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                              Resend OTP
                            </Button>
                          </div>
                        </>
                      )}

                      <Button 
                        variant="ghost"
                        onClick={resetOtpState}
                        className="flex items-center gap-1 text-gray-600"
                        size="sm"
                      >
                        <ArrowLeft className="h-3 w-3" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default DocumentsTable;
