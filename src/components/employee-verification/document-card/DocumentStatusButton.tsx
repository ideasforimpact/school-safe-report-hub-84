
import React, { useState } from 'react';
import { ChevronDown, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import VerificationStatusBadge from '../VerificationStatusBadge';
import { useEmployeeVerification } from '@/contexts/employee-verification';
import { useToast } from '@/hooks/use-toast';
import { VerificationDocument } from '@/types/employeeVerification';

interface DocumentStatusButtonProps {
  documentId?: string;
  document?: VerificationDocument;
  status?: 'pending' | 'verified' | 'failed';
  documentStatusName?: string;
  onStatusChange?: () => void;
}

const DocumentStatusButton: React.FC<DocumentStatusButtonProps> = ({
  documentId,
  document,
  status,
  documentStatusName,
  onStatusChange,
}) => {
  const { verifyDocument, documentStatuses } = useEmployeeVerification();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);

  // Use document props if available, otherwise use direct props
  const docId = document?.id || documentId;
  const docStatus = document?.verificationStatus || status;
  const docStatusName = document?.documentStatusName || documentStatusName;

  if (!docId) {
    console.error("DocumentStatusButton requires either document or documentId prop");
    return null;
  }

  const handleVerify = async () => {
    setIsUpdating(true);
    try {
      const verifiedStatus = documentStatuses.find(status => status.name === 'verified');
      
      await verifyDocument(
        docId, 
        'verified',
        'Document manually verified by administrator.',
        verifiedStatus?.id
      );
      
      toast({
        title: "Document Verified",
        description: "The document has been verified successfully.",
      });
      
      if (onStatusChange) {
        onStatusChange();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to verify document.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReject = async () => {
    setIsUpdating(true);
    try {
      const rejectedStatus = documentStatuses.find(status => status.name === 'rejected');
      
      await verifyDocument(
        docId, 
        'failed', 
        'Document rejected by administrator.',
        rejectedStatus?.id
      );
      
      toast({
        title: "Document Rejected",
        description: "The document has been rejected.",
        variant: "destructive",
      });
      
      if (onStatusChange) {
        onStatusChange();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject document.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // If the document is already verified or failed, just show the badge
  if (docStatus === 'verified' || docStatus === 'failed') {
    return <VerificationStatusBadge status={docStatus} documentStatusName={docStatusName || ''} />;
  }

  // For pending documents, show the dropdown
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={isUpdating}>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 gap-1 border border-gray-200 hover:bg-gray-50"
        >
          <VerificationStatusBadge status="pending" documentStatusName={docStatusName || ''} />
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleVerify} className="gap-2">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span>Verify</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleReject} className="gap-2 text-red-500">
          <XCircle className="h-4 w-4" />
          <span>Reject</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default DocumentStatusButton;
