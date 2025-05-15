
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Check, X, AlertCircle } from 'lucide-react';

interface VoterIdDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  voterIdDetails: any;
  documentId?: string;
}

const VoterIdDetailsDialog: React.FC<VoterIdDetailsDialogProps> = ({
  open,
  onOpenChange,
  voterIdDetails,
  documentId
}) => {
  if (!voterIdDetails) return null;
  
  // Extract useful information from the Voter ID verification response
  const voterInfo = voterIdDetails?.data || {};
  const isSuccess = voterIdDetails?.success === true && voterIdDetails?.status_code === 200;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md md:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            Voter ID Verification Details
            {isSuccess ? (
              <Badge variant="outline" className="ml-2 bg-green-100 text-green-800 border-green-200">
                <Check className="h-3.5 w-3.5 mr-1" />
                Verified
              </Badge>
            ) : (
              <Badge variant="outline" className="ml-2 bg-red-100 text-red-800 border-red-200">
                <X className="h-3.5 w-3.5 mr-1" />
                Failed
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Details from Voter ID verification service
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 mt-2">
          {!isSuccess && (
            <div className="bg-red-50 p-3 rounded-md border border-red-200">
              <div className="flex items-center text-red-700 text-sm">
                <AlertCircle className="h-4 w-4 mr-2" />
                <span>Verification failed: {voterIdDetails?.message || "Unknown error"}</span>
              </div>
            </div>
          )}

          {voterInfo && Object.keys(voterInfo).length > 0 && (
            <div className="border rounded-md divide-y">
              {Object.entries(voterInfo).map(([key, value]) => {
                if (value !== null && value !== undefined && key !== 'client_id') {
                  return (
                    <div key={key} className="flex py-2 px-3">
                      <span className="font-medium w-1/3 text-gray-700">
                        {key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                      </span>
                      <span className="w-2/3 text-gray-900">{String(value)}</span>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          )}
          
          {(!voterInfo || Object.keys(voterInfo).length === 0) && (
            <div className="bg-gray-50 p-4 rounded-md text-center text-gray-500">
              No additional details available
            </div>
          )}
          
          <div className="text-xs text-gray-500 pt-2">
            Document ID: {documentId || 'N/A'}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VoterIdDetailsDialog;
