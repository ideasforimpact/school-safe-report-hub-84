
import React, { useState } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { CheckCircle, XCircle, Trash2, FileCheck, AlertTriangle, Shield, ShieldCheck, ShieldX } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { VerificationDocument } from '@/types/employeeVerification';
import { useEmployeeVerification } from '@/contexts/EmployeeVerificationContext';
import VerificationStatusBadge from './VerificationStatusBadge';
import { format } from 'date-fns';

interface DocumentCardProps {
  document: VerificationDocument;
  showVerifyButton?: boolean;
}

const DocumentCard: React.FC<DocumentCardProps> = ({ document, showVerifyButton = true }) => {
  const [verifying, setVerifying] = useState(false);
  const { verifyDocument, deleteDocument } = useEmployeeVerification();
  const { toast } = useToast();

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not verified yet';
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch (error) {
      return dateString;
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case 'aadhar': return 'Aadhar Card';
      case 'pan': return 'PAN Card';
      case 'driving_license': return 'Driving License';
      case 'passport': return 'Passport';
      case 'bank_account': return 'Bank Account';
      case 'voter_id': return 'Voter ID';
      case 'other': return 'Other Document';
      default: return type;
    }
  };

  const handleVerify = async (status: 'verified' | 'failed', method: 'api' | 'manual') => {
    setVerifying(true);
    try {
      // In a real app, this would call an API to verify the document
      setTimeout(() => {
        verifyDocument(
          document.id, 
          status, 
          status === 'verified' 
            ? `Document ${method === 'api' ? 'automatically' : 'manually'} verified successfully.` 
            : 'Failed to verify document. Details do not match records.',
          method
        );
        toast({
          title: status === 'verified' ? 'Document Verified' : 'Verification Failed',
          description: status === 'verified' 
            ? `The document has been ${method === 'api' ? 'automatically' : 'manually'} verified successfully.` 
            : 'Document verification failed.',
        });
        setVerifying(false);
      }, 1500); // Simulate API delay
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred during verification.',
        variant: 'destructive',
      });
      setVerifying(false);
    }
  };

  const handleDelete = () => {
    try {
      deleteDocument(document.id);
      toast({
        title: 'Document Deleted',
        description: 'The document has been deleted successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete document.',
        variant: 'destructive',
      });
    }
  };

  // Different card styles based on verification status
  const getCardStyle = () => {
    if (document.verificationStatus === 'verified') {
      return 'border-green-200 ring-1 ring-green-100 bg-gradient-to-br from-white to-green-50';
    } else if (document.verificationStatus === 'failed') {
      return 'border-red-200 ring-1 ring-red-100 bg-gradient-to-br from-white to-red-50';
    } else {
      return 'border-yellow-100 hover:border-yellow-200 transition-all bg-gradient-to-br from-white to-yellow-50';
    }
  };

  // Render verification method icon/badge
  const renderVerificationMethod = () => {
    if (document.verificationStatus !== 'verified' || !document.verificationMethod) {
      return null;
    }

    return (
      <div className="flex items-center mt-1 text-xs font-medium">
        {document.verificationMethod === 'api' ? (
          <div className="flex items-center text-blue-600">
            <ShieldCheck className="h-3.5 w-3.5 mr-1" />
            <span>Auto-verified</span>
          </div>
        ) : (
          <div className="flex items-center text-purple-600">
            <ShieldX className="h-3.5 w-3.5 mr-1" />
            <span>Manually verified</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className={`h-full shadow-sm ${getCardStyle()}`}>
      <CardContent className="pt-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex flex-col">
            <h3 className="text-lg font-medium">{getDocumentTypeLabel(document.documentType)}</h3>
            <p className="text-sm text-gray-500">
              {document.documentType === 'other' ? 
                (document.documentNumber || 'No reference number') : 
                `Document #${document.documentNumber}`}
            </p>
            {renderVerificationMethod()}
          </div>
          <VerificationStatusBadge status={document.verificationStatus} />
        </div>
        
        <div className="aspect-video bg-gray-100 rounded-md mb-4 flex items-center justify-center">
          {/* This would be an actual document image in a real app */}
          <FileCheck className="h-12 w-12 text-gray-400" />
        </div>
        
        <div className="space-y-2 text-sm">
          <div className="p-2 rounded-md bg-gray-50 border border-gray-100">
            <span className="font-medium">Uploaded on:</span>{' '}
            <span className="text-gray-600">{formatDate(document.createdAt)}</span>
          </div>
          
          <div className="p-2 rounded-md bg-gray-50 border border-gray-100">
            <span className="font-medium">Status:</span>{' '}
            {document.verificationStatus === 'pending' ? (
              <span className="text-yellow-600">Pending verification</span>
            ) : (
              <>
                <span className={document.verificationStatus === 'verified' ? 'text-green-600' : 'text-red-600'}>
                  {document.verificationStatus === 'verified' ? 'Verified' : 'Failed'}
                </span> on {formatDate(document.verificationDate)}
              </>
            )}
          </div>
          
          {document.verificationNotes && (
            <div className="p-2 rounded-md bg-gray-50 border border-gray-100">
              <span className="font-medium">Notes:</span>{' '}
              <span className="text-gray-600">{document.verificationNotes}</span>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="border-t pt-4 flex justify-between">
        {document.verificationStatus === 'pending' && showVerifyButton ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 w-full">
            <div className="space-y-2">
              <p className="text-xs text-gray-500 font-medium">Auto Verification</p>
              <Button 
                variant="outline" 
                className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                onClick={() => handleVerify('verified', 'api')}
                disabled={verifying}
              >
                <ShieldCheck className="h-4 w-4 mr-2" />
                Verify API
              </Button>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-gray-500 font-medium">Manual Verification</p>
              <Button 
                variant="outline" 
                className="w-full bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200"
                onClick={() => handleVerify('verified', 'manual')}
                disabled={verifying}
              >
                <Shield className="h-4 w-4 mr-2" />
                Verify Manual
              </Button>
            </div>
            <div className="lg:col-span-2">
              <Button 
                variant="outline" 
                className="w-full bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                onClick={() => handleVerify('failed', 'manual')}
                disabled={verifying}
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Reject
              </Button>
            </div>
          </div>
        ) : (
          <Button 
            variant="outline"
            className={document.verificationStatus === 'verified' 
              ? "text-green-700 border-green-200 bg-green-50 hover:bg-green-100" 
              : "text-red-700 border-red-200 bg-red-50 hover:bg-red-100"}
          >
            {document.verificationStatus === 'verified' ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Verified
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 mr-2" />
                Failed
              </>
            )}
          </Button>
        )}
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="text-gray-500">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Document</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this document? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                className="bg-red-600 hover:bg-red-700"
                onClick={handleDelete}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
};

export default DocumentCard;
