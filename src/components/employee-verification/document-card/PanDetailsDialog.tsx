
import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { FileText, User, Calendar, CreditCard, Fingerprint, CheckCircle } from 'lucide-react';

interface PanDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  panDetails: any;
  documentId?: string;
}

const PanDetailsDialog: React.FC<PanDetailsDialogProps> = ({
  open,
  onOpenChange,
  panDetails,
  documentId
}) => {
  if (!panDetails || !panDetails.data) {
    return null;
  }

  const {
    data: {
      pan_number,
      full_name,
      masked_aadhaar,
      gender,
      dob,
      aadhaar_linked,
      status
    }
  } = panDetails;

  // Format date if available
  const formattedDob = dob ? format(new Date(dob), 'dd MMM yyyy') : 'Not available';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FileText className="h-5 w-5 text-blue-600" />
            PAN Card Verification Details
          </DialogTitle>
          <DialogDescription>
            Governance verified data from the API
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-2">
          <Card className="border border-green-100 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Verification Status:</span>
                <div className="flex items-center gap-1 text-green-700 font-medium">
                  <CheckCircle className="h-4 w-4" />
                  {status === 'valid' ? 'Valid PAN' : status}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-3">
            <div className="flex items-center gap-2 p-2 border rounded-md">
              <CreditCard className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">PAN Number:</span>
              <span className="text-sm ml-auto font-mono">{pan_number}</span>
            </div>
            
            <div className="flex items-center gap-2 p-2 border rounded-md">
              <User className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">Full Name:</span>
              <span className="text-sm ml-auto">{full_name}</span>
            </div>
            
            {gender && (
              <div className="flex items-center gap-2 p-2 border rounded-md">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">Gender:</span>
                <span className="text-sm ml-auto">{gender === 'M' ? 'Male' : gender === 'F' ? 'Female' : gender}</span>
              </div>
            )}
            
            <div className="flex items-center gap-2 p-2 border rounded-md">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">Date of Birth:</span>
              <span className="text-sm ml-auto">{formattedDob}</span>
            </div>
            
            {masked_aadhaar && (
              <div className="flex items-center gap-2 p-2 border rounded-md">
                <Fingerprint className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">Aadhaar Status:</span>
                <div className="flex items-center ml-auto">
                  {aadhaar_linked && <CheckCircle className="h-4 w-4 text-green-600 mr-1" />}
                  <span className="text-sm">{masked_aadhaar}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="sm:justify-between">
          <DialogClose asChild>
            <Button type="button" variant="outline">Close</Button>
          </DialogClose>
          <div className="text-xs text-gray-500">
            Document ID: {documentId || 'Unknown'}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PanDetailsDialog;
