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
  CheckCircle2, 
  AlertCircle,
  Eye,
  Loader2
} from 'lucide-react';
import { VerificationDocument } from '@/types/employeeVerification';
import { useToast } from '@/hooks/use-toast';
import { useEmployeeVerification } from '@/contexts/employee-verification/EmployeeVerificationContext';

interface ApiResponseIndicatorProps {
  document: VerificationDocument;
  onVerificationUpdate?: () => void;
}

const ApiResponseIndicator: React.FC<ApiResponseIndicatorProps> = ({ 
  document, 
  onVerificationUpdate 
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const { verifyDocument } = useEmployeeVerification();

  const getStatusIcon = () => {
    switch (document.apiVerificationStatus) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Eye className="h-4 w-4 text-blue-600" />;
    }
  };

  const getStatusText = () => {
    switch (document.apiVerificationStatus) {
      case 'completed':
        return 'Review Response';
      case 'failed':
        return 'Check Failed';
      default:
        return 'Response Ready';
    }
  };

  const getStatusBadgeVariant = () => {
    switch (document.apiVerificationStatus) {
      case 'completed':
        return 'default';
      case 'failed':
        return 'destructive';
      default:
        return 'secondary';
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

  // Only show if API response data exists
  if (!document.apiResponseData) {
    return null;
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setDialogOpen(true)}
        className="h-8 px-3 gap-2 text-xs font-medium"
      >
        {getStatusIcon()}
        <span>{getStatusText()}</span>
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
                {document.apiVerificationStatus === 'completed' ? 'API Check Complete' : 
                 document.apiVerificationStatus === 'failed' ? 'API Check Failed' : 'Response Available'}
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
                <pre className="text-sm whitespace-pre-wrap font-mono">
                  {formatApiResponse(document.apiResponseData)}
                </pre>
              </div>
            </div>

            {/* Action Buttons - Only show for completed API checks with pending verification */}
            {document.apiVerificationStatus === 'completed' && 
             document.verificationStatus === 'pending' && (
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  onClick={handleFinalVerify}
                  disabled={isProcessing}
                  className="flex-1"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Verify Document"
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleFinalReject}
                  disabled={isProcessing}
                  className="flex-1"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Reject Document"
                  )}
                </Button>
              </div>
            )}

            {/* Info for failed API checks */}
            {document.apiVerificationStatus === 'failed' && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-700">
                  API verification failed. You can still manually verify or reject this document.
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ApiResponseIndicator;