import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Info,
  Eye
} from 'lucide-react';
import { VerificationDocument } from '@/types/employeeVerification';
import { useToast } from '@/hooks/use-toast';
import { useEmployeeVerification } from '@/contexts/employee-verification/EmployeeVerificationContext';

interface ApiResponseButtonProps {
  document: VerificationDocument;
  onVerificationUpdate?: () => void;
}

const ApiResponseButton: React.FC<ApiResponseButtonProps> = ({ 
  document, 
  onVerificationUpdate 
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const { verifyDocument } = useEmployeeVerification();

  const getStatusIcon = () => {
    switch (document.apiVerificationStatus) {
      case 'pending':
        return <Clock className="h-4 w-4 text-orange-500" />;
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    switch (document.apiVerificationStatus) {
      case 'pending':
        return 'API Check Pending';
      case 'completed':
        return 'API Check Complete';
      case 'failed':
        return 'API Check Failed';
      default:
        return 'No API Check';
    }
  };

  const getStatusBadgeVariant = () => {
    switch (document.apiVerificationStatus) {
      case 'pending':
        return 'secondary';
      case 'completed':
        return 'default';
      case 'failed':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const handleFinalVerify = async () => {
    try {
      setIsProcessing(true);
      await verifyDocument(document.id, 'verified', 'Manually verified after API check');
      toast({
        title: "Document Verified",
        description: "Document has been successfully verified.",
      });
      setDialogOpen(false);
      onVerificationUpdate?.();
    } catch (error) {
      toast({
        title: "Verification Failed",
        description: "Failed to verify document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFinalReject = async () => {
    try {
      setIsProcessing(true);
      await verifyDocument(document.id, 'failed', 'Manually rejected after API check');
      toast({
        title: "Document Rejected",
        description: "Document has been rejected.",
      });
      setDialogOpen(false);
      onVerificationUpdate?.();
    } catch (error) {
      toast({
        title: "Rejection Failed",
        description: "Failed to reject document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatApiResponse = (data: any) => {
    if (!data) return 'No API response data available';
    if (typeof data === 'string') return data;
    return JSON.stringify(data, null, 2);
  };

  // Only show if API verification status exists
  if (!document.apiVerificationStatus) {
    return null;
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setDialogOpen(true)}
        className="h-8 px-2 gap-1"
      >
        {getStatusIcon()}
        <span className="text-xs">{getStatusText()}</span>
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {getStatusIcon()}
              API Verification Response
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Status Badge */}
            <div className="flex items-center gap-2">
              <Badge variant={getStatusBadgeVariant()}>
                {getStatusText()}
              </Badge>
              {document.apiVerificationDate && (
                <span className="text-sm text-muted-foreground">
                  Checked on {new Date(document.apiVerificationDate).toLocaleString()}
                </span>
              )}
            </div>

            {/* API Method */}
            {document.apiVerificationMethod && (
              <div>
                <strong>Verification Method:</strong> {document.apiVerificationMethod}
              </div>
            )}

            {/* API Response Data */}
            <div>
              <strong>API Response:</strong>
              <div className="mt-2 p-3 bg-muted rounded-md">
                <pre className="text-sm whitespace-pre-wrap">
                  {formatApiResponse(document.apiResponseData)}
                </pre>
              </div>
            </div>

            {/* Action Buttons - Only show for completed API checks */}
            {document.apiVerificationStatus === 'completed' && 
             document.verificationStatus === 'pending' && (
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  onClick={handleFinalVerify}
                  disabled={isProcessing}
                  className="flex-1"
                >
                  {isProcessing ? "Processing..." : "Verify Document"}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleFinalReject}
                  disabled={isProcessing}
                  className="flex-1"
                >
                  {isProcessing ? "Processing..." : "Reject Document"}
                </Button>
              </div>
            )}

            {/* Info for failed API checks */}
            {document.apiVerificationStatus === 'failed' && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-700">
                  API verification failed. The document status has been automatically updated.
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ApiResponseButton;