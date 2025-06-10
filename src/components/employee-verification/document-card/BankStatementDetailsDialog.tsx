
import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';

interface BankStatementDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  statementDetails: any;
  documentId?: string;
}

const BankStatementDetailsDialog: React.FC<BankStatementDetailsDialogProps> = ({
  open,
  onOpenChange,
  statementDetails,
  documentId
}) => {
  // Extract relevant information from the bank statement response
  const data = statementDetails?.data || {};
  const isSuccessful = statementDetails?.success && statementDetails?.status_code === 200;
  
  // Comprehensive debugging logs
  console.log('BankStatementDetailsDialog - Dialog open state:', open);
  console.log('BankStatementDetailsDialog - Document ID:', documentId);
  console.log('BankStatementDetailsDialog - Full statement details:', statementDetails);
  console.log('BankStatementDetailsDialog - Extracted data:', data);
  console.log('BankStatementDetailsDialog - Is successful:', isSuccessful);
  
  useEffect(() => {
    console.log('BankStatementDetailsDialog - Dialog mounted/updated with open:', open);
    
    if (open) {
      console.log('BankStatementDetailsDialog - Dialog is now open');
    }
    
    return () => {
      console.log('BankStatementDetailsDialog - Dialog unmounting');
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
  
  return (
    <Dialog open={open} onOpenChange={(newOpenState) => {
      console.log('BankStatementDetailsDialog - Dialog open state changing to:', newOpenState);
      onOpenChange(newOpenState);
    }}>
      <DialogContent className="sm:max-w-3xl max-h-[80vh]">
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
        
        <ScrollArea className="h-[500px] rounded-md border">
          {(isSuccessful && Object.keys(data).length > 0) ? (
            <div className="p-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-1/3 font-semibold">Field</TableHead>
                    <TableHead className="font-semibold">Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(data).map(([key, value]) => (
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
      </DialogContent>
    </Dialog>
  );
};

export default BankStatementDetailsDialog;
