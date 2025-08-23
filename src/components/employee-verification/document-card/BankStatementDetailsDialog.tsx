
import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Building, Banknote, CreditCard, Loader2, X, FileText, User, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEmployeeVerification } from '@/contexts/employee-verification/EmployeeVerificationContext';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface BankStatementDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  statementDetails: any;
  documentId?: string;
  onVerificationUpdate?: () => void;
}

const BankStatementDetailsDialog: React.FC<BankStatementDetailsDialogProps> = ({
  open,
  onOpenChange,
  statementDetails,
  documentId,
  onVerificationUpdate
}) => {
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const { verifyDocument } = useEmployeeVerification();
  const { toast } = useToast();
  const { user, employeeData } = useAuth();
  // Extract relevant information from the bank statement response
  const data = statementDetails?.data || {};
  const isSuccessful = statementDetails?.success && statementDetails?.status_code === 200;
  
  // Comprehensive debugging logs
  // console.log('BankStatementDetailsDialog - Dialog open state:', open);
  // console.log('BankStatementDetailsDialog - Document ID:', documentId);
  // console.log('BankStatementDetailsDialog - Full statement details:', statementDetails);
  // console.log('BankStatementDetailsDialog - Extracted data:', data);
  // console.log('BankStatementDetailsDialog - Is successful:', isSuccessful);
  
  useEffect(() => {
    // console.log('BankStatementDetailsDialog - Dialog mounted/updated with open:', open);
    
    if (open) {
      // console.log('BankStatementDetailsDialog - Dialog is now open');
    }
    
    return () => {
      // console.log('BankStatementDetailsDialog - Dialog unmounting');
    };
  }, [open]);

  // Helper function to format field names
  const formatFieldName = (key: string) => {
    return key
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Helper function to format field values
  const formatFieldValue = (value: any) => {
    if (value === null || value === undefined) {
      return '—';
    }
    
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    
    if (typeof value === 'object') {
      // For nested objects, format them nicely
      if (typeof value === 'object' && value !== null) {
        try {
          // Try to extract meaningful information from nested objects
          const jsonString = JSON.stringify(value, null, 2);
          // If it's a small object, format it inline
          if (jsonString.length < 100) {
            return Object.entries(value)
              .map(([k, v]) => `${formatFieldName(k)}: ${v}`)
              .join(', ');
          }
          // For larger objects, format as multiline
          return (
            <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto whitespace-pre-wrap">
              {jsonString}
            </pre>
          );
        } catch {
          return String(value);
        }
      }
    }
    
    return String(value);
  };

  // Extract IFSC details from the data if available
  const extractIfscDetails = () => {
    const ifscDetails = data?.ifsc_details || {};
    return ifscDetails;
  };

  // Skip displayed fields and get the rest of the data
  const getRemainingFields = () => {
    const entries = Object.entries(data);
    const excludedFields = [
      'ifsc_details', 'account_number', 'account_holder_name', 'bank_name',
      'centre', 'address', 'Center', 'Address' // Exclude address fields
    ];
    
    // Filter out the fields that are already displayed in cards
    return entries.filter(([key]) => !excludedFields.includes(key));
  };

  const handleVerify = async () => {
    if (!documentId) return;
    
    try {
      setIsApproving(true);
      
      // Call the bank-statement edge function directly
      const { data, error } = await supabase.functions.invoke('bank-statement', {
        body: {
          action: 'manualVerify',
          documentId: documentId,
          verification_notes: 'Verified after Bank Statement API check',
          verified_by_employee_id: employeeData?.id || user?.id
        }
      });

      if (error) {
        console.error('BankStatementDetailsDialog - Edge function error:', error);
        throw error;
      }

      if (data?.success) {
        // No toaster for approve action in detail dialog
        onOpenChange(false);
        onVerificationUpdate?.();
      } else {
        throw new Error(data?.error || 'Failed to approve document');
      }
    } catch (error) {
      toast({
        title: "Approval Failed",
        description: "Failed to approve document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!documentId) return;
    
    // If reject form is not shown, show it first
    if (!showRejectForm) {
      setShowRejectForm(true);
      return;
    }
    
    // If reject form is shown but no reason provided, don't proceed
    if (!rejectReason.trim()) {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for rejecting this document.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsRejecting(true);
      
      // Call the bank-statement edge function directly with reject_reason
      const { data, error } = await supabase.functions.invoke('bank-statement', {
        body: {
          action: 'reject',
          documentId: documentId,
          verification_notes: rejectReason,
          verified_by_employee_id: employeeData?.id || user?.id,
          reject_reason: rejectReason
        }
      });

      if (error) {
        console.error('BankStatementDetailsDialog - Edge function error:', error);
        throw error;
      }

      if (data?.success) {
        // No toaster for reject action in detail dialog
        onOpenChange(false);
        onVerificationUpdate?.();
      } else {
        throw new Error(data?.error || 'Failed to reject document');
      }
    } catch (error) {
      toast({
        title: "Rejection Failed",
        description: "Failed to reject document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRejecting(false);
      setShowRejectForm(false);
      setRejectReason('');
    }
  };

  const handleCancelReject = () => {
    setShowRejectForm(false);
    setRejectReason('');
  };
  
  return (
    <Dialog open={open} onOpenChange={(newOpenState) => {
      // console.log('BankStatementDetailsDialog - Dialog open state changing to:', newOpenState);
      onOpenChange(newOpenState);
    }}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <span>Bank Statement Details</span>
            {isSuccessful && (
              <Badge className="bg-green-100 text-green-800 border-green-200">
                Verified
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Bank statement verification {isSuccessful ? 'completed successfully' : 'failed'}
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1 rounded-md border">
          {(isSuccessful && Object.keys(data).length > 0) ? (
            <div className="p-4 space-y-6">
              {/* IFSC Details Card */}
              {data.ifsc_details && (
                <Card className="border border-gray-200 shadow-sm">
                  <CardHeader className="bg-gray-50 pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Building className="h-5 w-5 text-blue-600" />
                      IFSC Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                    {Object.entries(data.ifsc_details).map(([key, value]) => (
                      <div key={key} className="space-y-1">
                        <div className="text-sm font-medium text-gray-500">
                          {formatFieldName(key)}
                        </div>
                        <div className="font-medium">
                          {value ? String(value) : '—'}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Bank Account Info Card */}
              {(data.account_number || data.account_holder_name) && (
                <Card className="border border-gray-200 shadow-sm">
                  <CardHeader className="bg-gray-50 pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Banknote className="h-5 w-5 text-green-600" />
                      Account Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                    {data.account_number && (
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-gray-500">Account Number</div>
                        <div className="font-medium">{data.account_number}</div>
                      </div>
                    )}
                    {data.account_holder_name && (
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-gray-500">Account Holder Name</div>
                        <div className="font-medium">{data.account_holder_name}</div>
                      </div>
                    )}
                    {data.bank_name && (
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-gray-500">Bank Name</div>
                        <div className="font-medium">{data.bank_name}</div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Address Details Card */}
              {(data.centre || data.address || data.Center || data.Address) && (
                <Card className="border border-gray-200 shadow-sm">
                  <CardHeader className="bg-gray-50 pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5 text-purple-600" />
                      Address Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 gap-4 pt-4">
                    {(data.centre || data.Center) && (
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-gray-500">Centre</div>
                        <div className="font-medium">{data.centre || data.Center}</div>
                      </div>
                    )}
                    {(data.address || data.Address) && (
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-gray-500">Address</div>
                        <div className="font-medium p-3 bg-gray-50 rounded-lg border">
                          {data.address || data.Address}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Remaining Fields Table */}
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
                    {getRemainingFields()
                      .filter(([key]) => !['ifsc_details', 'account_number', 'account_holder_name', 'bank_name'].includes(key))
                      .map(([key, value]) => (
                        <TableRow key={key}>
                          <TableCell className="font-medium align-top">
                            {formatFieldName(key)}
                          </TableCell>
                          <TableCell className="align-top">
                            <div className="max-w-md">
                              {formatFieldValue(value)}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <div className="p-4 text-center">
              {statementDetails?.status_code ? (
                <div className="flex flex-col items-center gap-2">
                  <AlertTriangle className="h-8 w-8 text-amber-500" />
                  <p className="text-lg text-red-500">Verification failed with status code: {statementDetails.status_code}</p>
                  <p className="text-gray-600 mt-2">
                    {statementDetails?.message || "No verification details available"}
                  </p>
                </div>
              ) : (
                <p className="text-gray-600">No verification details available</p>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Reject Reason Form */}
        {showRejectForm && (
          <div className="space-y-4 pt-4 border-t">
            <div>
              <Label htmlFor="rejectReason" className="text-sm font-medium">
                Reason for reject <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="rejectReason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Please provide a reason for rejecting this document..."
                className="mt-1 min-h-[80px]"
                 maxLength={200}
                required
              />
              {rejectReason.length > 0 && (
                <div className="text-xs text-muted-foreground text-right mt-1">
                  {rejectReason.length}/200 characters
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter className="flex justify-end gap-3 pt-4 border-t mt-auto">
          {showRejectForm ? (
            <>
              <Button
                variant="outline"
                onClick={handleCancelReject}
                disabled={isRejecting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={isRejecting || !rejectReason.trim()}
              >
                {isRejecting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <X className="h-4 w-4 mr-2" />
                )}
                Confirm Reject
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={handleReject}
                disabled={isRejecting || isApproving}
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                {isRejecting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <X className="h-4 w-4 mr-2" />
                )}
                Reject
              </Button>
              <Button
                onClick={handleVerify}
                disabled={isApproving || isRejecting}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isApproving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Approve
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BankStatementDetailsDialog;
