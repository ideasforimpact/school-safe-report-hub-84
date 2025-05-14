
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { VerificationDocument } from '@/types/employeeVerification';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { FileText } from 'lucide-react';

interface VerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: VerificationDocument;
  documentId?: string; // For backward compatibility
}

const VerificationDialog: React.FC<VerificationDialogProps> = ({
  open,
  onOpenChange,
  document,
  documentId
}) => {
  // Use either the document object or fall back to documentId if needed
  const documentToShow = document || { id: documentId } as VerificationDocument;
  
  // In a real implementation, you might want to fetch the document details
  // if only documentId is provided and document is not.
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Document Verification</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <div className="overflow-hidden rounded-md border border-gray-200 mb-4">
            <AspectRatio ratio={16 / 9}>
              {document.documentImage ? (
                <img 
                  src={document.documentImage} 
                  alt="Document" 
                  className="object-cover h-full w-full"
                  onError={(e) => {
                    e.currentTarget.src = "https://placehold.co/400x225?text=Image+Not+Available";
                  }}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gray-100">
                  <FileText className="h-16 w-16 text-gray-400" />
                </div>
              )}
            </AspectRatio>
          </div>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold">Document Type</h3>
              <p>{document.documentTypeName || 'Unknown'}</p>
            </div>
            
            {document.documentNumber && (
              <div>
                <h3 className="text-sm font-semibold">Document Number</h3>
                <p>{document.documentNumber}</p>
              </div>
            )}
            
            <div>
              <h3 className="text-sm font-semibold">Verification Status</h3>
              <p className={`
                ${document.verificationStatus === 'verified' ? 'text-green-600' : 
                 document.verificationStatus === 'failed' ? 'text-red-600' : 
                 'text-yellow-600'}
              `}>
                {document.verificationStatus?.charAt(0).toUpperCase() + document.verificationStatus?.slice(1)}
              </p>
            </div>
            
            {document.verificationDate && (
              <div>
                <h3 className="text-sm font-semibold">Verification Date</h3>
                <p>{new Date(document.verificationDate).toLocaleString()}</p>
              </div>
            )}
            
            {document.verificationNotes && (
              <div>
                <h3 className="text-sm font-semibold">Verification Notes</h3>
                <p className="text-gray-700">{document.verificationNotes}</p>
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default VerificationDialog;
