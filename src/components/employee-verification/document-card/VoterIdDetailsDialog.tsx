
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, X, AlertCircle, User, MapPin, FileText, Loader2 } from 'lucide-react';
import { useEmployeeVerification } from '@/contexts/employee-verification/EmployeeVerificationContext';
import { useToast } from '@/hooks/use-toast';

interface VoterIdDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  voterIdDetails: any;
  documentId?: string;
  onVerificationUpdate?: () => void;
}

const VoterIdDetailsDialog: React.FC<VoterIdDetailsDialogProps> = ({
  open,
  onOpenChange,
  voterIdDetails,
  documentId,
  onVerificationUpdate
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { verifyDocument } = useEmployeeVerification();
  const { toast } = useToast();
  if (!voterIdDetails) return null;
  
  // Extract useful information from the Voter ID verification response
  const voterInfo = voterIdDetails?.data || {};
  const isSuccess = voterIdDetails?.success === true && voterIdDetails?.status_code === 200;

  // Helper function to format field names
  const formatFieldName = (key: string) => {
    return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  // Group fields into logical categories
  const getPersonalFields = () => {
    const personalKeys = ['name_v1', 'name_v2', 'name_v3', 'epic_no', 'relation_name', 'relation_type', 'gender', 'age'];
    return Object.entries(voterInfo).filter(([key]) => personalKeys.includes(key) && voterInfo[key] !== null && voterInfo[key] !== undefined);
  };

  const getAddressFields = () => {
    const addressKeys = ['district_name', 'part_name', 'part_number', 'ac_name', 'pc_name', 'state_name', 'polling_station'];
    return Object.entries(voterInfo).filter(([key]) => addressKeys.includes(key) && voterInfo[key] !== null && voterInfo[key] !== undefined);
  };

  const getAdditionalFields = () => {
    const excludeKeys = ['name_v1', 'name_v2', 'name_v3', 'epic_no', 'relation_name', 'relation_type', 'gender', 'age', 
                        'district_name', 'part_name', 'part_number', 'ac_name', 'pc_name', 'state_name', 'polling_station', 'client_id'];
    return Object.entries(voterInfo).filter(([key]) => !excludeKeys.includes(key) && voterInfo[key] !== null && voterInfo[key] !== undefined);
  };

  const handleVerify = async () => {
    if (!documentId) return;
    
    try {
      setIsProcessing(true);
      await verifyDocument(documentId, 'verified', 'Verified after Voter ID API check');
      toast({
        title: "Document Verified",
        description: "Voter ID document has been successfully verified.",
      });
      onOpenChange(false);
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

  const handleReject = async () => {
    if (!documentId) return;
    
    try {
      setIsProcessing(true);
      await verifyDocument(documentId, 'failed', 'Rejected after Voter ID API check');
      toast({
        title: "Document Rejected",
        description: "Voter ID document has been rejected.",
      });
      onOpenChange(false);
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
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <span>Voter ID Verification Details</span>
            {isSuccess ? (
              <Badge className="bg-green-100 text-green-800 border-green-200">
                <Check className="h-3.5 w-3.5 mr-1" />
                Verified
              </Badge>
            ) : (
              <Badge className="bg-red-100 text-red-800 border-red-200">
                <X className="h-3.5 w-3.5 mr-1" />
                Failed
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Details retrieved from voter ID verification service
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-[400px] rounded-md border">
          {(isSuccess && Object.keys(voterInfo).length > 0) ? (
            <div className="p-4 space-y-6">
              {/* Error message for failed verification */}
              {!isSuccess && (
                <div className="bg-red-50 p-3 rounded-md border border-red-200">
                  <div className="flex items-center text-red-700 text-sm">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    <span>Verification failed: {voterIdDetails?.message || "Unknown error"}</span>
                  </div>
                </div>
              )}

              {/* Personal Information Card */}
              {getPersonalFields().length > 0 && (
                <Card className="border border-gray-200 shadow-sm">
                  <CardHeader className="bg-gray-50 pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="h-5 w-5 text-blue-600" />
                      Personal Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                    {getPersonalFields().map(([key, value]) => (
                      <div key={key} className="space-y-1">
                        <div className="text-sm font-medium text-gray-500">
                          {formatFieldName(key)}
                        </div>
                        <div className="font-medium">
                          {String(value)}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Address Information Card */}
              {getAddressFields().length > 0 && (
                <Card className="border border-gray-200 shadow-sm">
                  <CardHeader className="bg-gray-50 pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-green-600" />
                      Address & Constituency Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                    {getAddressFields().map(([key, value]) => (
                      <div key={key} className="space-y-1">
                        <div className="text-sm font-medium text-gray-500">
                          {formatFieldName(key)}
                        </div>
                        <div className="font-medium">
                          {String(value)}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Additional Fields Table */}
              {getAdditionalFields().length > 0 && (
                <div className="mt-6">
                  <h3 className="text-base font-semibold mb-3">Additional Details</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-1/3 font-semibold">Field</TableHead>
                        <TableHead className="font-semibold">Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getAdditionalFields().map(([key, value]) => (
                        <TableRow key={key}>
                          <TableCell className="font-medium">
                            {formatFieldName(key)}
                          </TableCell>
                          <TableCell>
                            {String(value)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Document ID Footer */}
              <div className="text-xs text-gray-500 pt-4 border-t">
                Document ID: {documentId || 'N/A'}
              </div>
            </div>
          ) : (
            <div className="p-4 text-center">
              <div className="flex flex-col items-center gap-2">
                <AlertCircle className="h-8 w-8 text-amber-500" />
                <p className="text-lg text-red-500">
                  {!isSuccess ? 'Verification failed' : 'No data available'}
                </p>
                <p className="text-gray-600 mt-2">
                  {voterIdDetails?.message || "No verification details available"}
                </p>
              </div>
              <div className="text-xs text-gray-500 pt-4 border-t mt-4">
                Document ID: {documentId || 'N/A'}
              </div>
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="flex gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
            className="flex-1"
          >
            Close
          </Button>
          <Button
            variant="outline"
            onClick={handleReject}
            disabled={isProcessing}
            className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
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
          <Button
            onClick={handleVerify}
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default VoterIdDetailsDialog;
