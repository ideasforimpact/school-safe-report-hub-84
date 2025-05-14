
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from 'date-fns';

interface AadharDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aadharDetails: any;
}

const AadharDetailsDialog: React.FC<AadharDetailsDialogProps> = ({ 
  open, 
  onOpenChange, 
  aadharDetails 
}) => {
  if (!aadharDetails) return null;
  
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch (e) {
      return dateString;
    }
  };

  const getVerificationType = () => {
    if (aadharDetails.action?.includes('aadhar')) {
      return 'Aadhar';
    } else if (aadharDetails.action?.includes('pan')) {
      return 'PAN';
    }
    return 'Document';
  };
  
  const verificationType = getVerificationType();
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{verificationType} Verification Details</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <div className="space-y-4">
            <div className="rounded-md bg-blue-50 p-3">
              <div className="flex">
                <div className="text-blue-800">
                  <strong>Verification Date:</strong> {formatDate(aadharDetails.timestamp)}
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">Verification Response</h3>
              <ScrollArea className="h-[350px] border border-gray-200 rounded-md p-4">
                <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(aadharDetails.response, null, 2)}
                </pre>
              </ScrollArea>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AadharDetailsDialog;
