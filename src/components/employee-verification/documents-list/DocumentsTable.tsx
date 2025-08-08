
import React, { useEffect, useState } from 'react';
import { Eye, Download, MessageCircle, FileSearch, MoreVertical, Trash, Loader2, Cpu, Wrench, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { formatDistanceToNow } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { VerificationDocument } from '@/types/employeeVerification';
import { Badge } from '@/components/ui/badge';
import VerificationStatusBadge from '../VerificationStatusBadge';
import { getDocumentIcon, formatDocumentTypeName, getManualVerificationDisplayName } from '../utils/documentUtils';
import { useEmployeeVerification } from '@/contexts/employee-verification';
import { useToast } from '@/hooks/use-toast';
import { formatSupabaseUrl, isPdfFile } from '@/types/fileTypes';
import AadharDetailsDialog from './AadharDetailsDialog';
import PanDetailsDialog from '../document-card/PanDetailsDialog';
import VoterIdDetailsDialog from '../document-card/VoterIdDetailsDialog';
import DrivingLicenseDetailsDialog from '../document-card/DrivingLicenseDetailsDialog';
import BankStatementDetailsDialog from '../document-card/BankStatementDetailsDialog';
import DocumentCommentsDialog from '../DocumentCommentsDialog';

interface DocumentsTableProps {
  documents: VerificationDocument[];
  onViewDocument: (documentImage: string) => void;
  onDownloadDocument: (documentImage: string) => void;
  onVerifyDocument: (documentId: string) => void;
  onDocumentAction?: () => void;
  onQuickVerify?: (documentId: string, method: 'api' | 'manual') => void;
}

const DocumentsTable: React.FC<DocumentsTableProps> = ({
  documents,
  onViewDocument,
  onDownloadDocument,
  onVerifyDocument,
  onDocumentAction,
  onQuickVerify,
}) => {
  const { documentStatuses, deleteDocument, employees } = useEmployeeVerification();
  const { toast } = useToast();
  
  // State for delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedDocumentDetails, setSelectedDocumentDetails] = React.useState<any>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [panDialogOpen, setPanDialogOpen] = React.useState(false);
  const [voterIdDialogOpen, setVoterIdDialogOpen] = React.useState(false);
  const [drivingLicenseDialogOpen, setDrivingLicenseDialogOpen] = React.useState(false);
  const [bankStatementDialogOpen, setBankStatementDialogOpen] = React.useState(false);
  const [commentsDialogOpen, setCommentsDialogOpen] = React.useState(false);
  const [selectedPanDetails, setSelectedPanDetails] = React.useState<any>(null);
  const [selectedVoterIdDetails, setSelectedVoterIdDetails] = React.useState<any>(null);
  const [selectedDrivingLicenseDetails, setSelectedDrivingLicenseDetails] = React.useState<any>(null);
  const [selectedBankStatementDetails, setSelectedBankStatementDetails] = React.useState<any>(null);
  const [selectedVerificationHistory, setSelectedVerificationHistory] = React.useState<any[]>([]);
  const [selectedDocumentId, setSelectedDocumentId] = React.useState<string | undefined>(undefined);
  
  // Log documents for debugging
  console.log('DocumentsTable - All documents:', documents);
  
  useEffect(() => {
    console.log('DocumentsTable - Documents with driving license:', 
      documents.filter(doc => doc.documentTypeName?.toLowerCase().includes('driving')));
  }, [documents]);

  const handleViewDocument = (documentImage: string) => {
    if (!documentImage) {
      toast({
        title: "No Document",
        description: "No document image available to view.",
        variant: "destructive",
      });
      return;
    }

    try {
      const formattedUrl = formatSupabaseUrl(documentImage);
      console.log('Opening document URL for viewing:', formattedUrl);
      
      // Check if it's a PDF or image for proper viewing
      const isPdf = isPdfFile(formattedUrl);
      
      if (isPdf) {
        // For PDFs, open with PDF viewer controls
        const pdfViewerUrl = `${formattedUrl}#toolbar=1&navpanes=1&scrollbar=1`;
        window.open(pdfViewerUrl, '_blank', 'noopener,noreferrer');
      } else {
        // For images, open directly
        window.open(formattedUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (error) {
      console.error('Error opening document:', error);
      toast({
        title: "Error",
        description: "Failed to open document. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadDocument = (documentImage: string) => {
    if (!documentImage) {
      toast({
        title: "No Document",
        description: "No document available to download.",
        variant: "destructive",
      });
      return;
    }

    try {
      const formattedUrl = formatSupabaseUrl(documentImage);
      console.log('Downloading document URL:', formattedUrl);
      
      // Use fetch to download the file and then create blob URL
      fetch(formattedUrl)
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.blob();
        })
        .then(blob => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `document-${Date.now()}`;
          
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          // Clean up the blob URL
          window.URL.revokeObjectURL(url);
          
          toast({
            title: "Download Started",
            description: "Document download has been initiated.",
          });
        })
        .catch(error => {
          console.error('Error downloading document:', error);
          
          // Fallback: try direct link download
          const link = document.createElement('a');
          link.href = formattedUrl;
          link.download = `document-${Date.now()}`;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          toast({
            title: "Download Started",
            description: "Document download has been initiated (fallback method).",
          });
        });
    } catch (error) {
      console.error('Error downloading document:', error);
      toast({
        title: "Download Error",
        description: "Failed to download document. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const getDocumentStatusName = (document: VerificationDocument): string | undefined => {
    if (!document.documentStatusId || document.verificationStatus !== 'verified' || documentStatuses.length === 0) {
      return undefined;
    }
    
    const status = documentStatuses.find(s => s.id === document.documentStatusId);
    return status?.name;
  };

  const handleCommentsClick = (doc: VerificationDocument) => {
    console.log('DocumentsTable - Comments button clicked for document:', doc);
    
    // Get verification history from params
    const verificationHistory = (doc.params as any)?.verification_history || [];
    setSelectedVerificationHistory(verificationHistory);
    setSelectedDocumentId(doc.id);
    setCommentsDialogOpen(true);
    
    toast({
      title: "Viewing Comments",
      description: "Showing verification history and comments for this document."
    });
  };

  const handleBadgeClick = (doc: VerificationDocument) => {
    console.log('DocumentsTable - Badge clicked for document:', doc);
    console.log('DocumentsTable - cron_log data:', doc.cronLog);
    
    const statusName = getDocumentStatusName(doc);
    const hasLogs = !!doc.employee_docs_log && doc.employee_docs_log.length > 0;
    
    // Check if this is a governance verified document with logs
    if (doc.verificationStatus !== 'verified' || statusName !== 'governance' || !hasLogs) {
      console.log('DocumentsTable - Not governance verified or no logs, showing info toast');
      if (statusName && doc.verificationStatus === 'verified') {
        toast({
          title: "Information",
          description: `This document is verified with status: ${statusName}`
        });
      }
      return;
    }
    
    const docType = doc.documentTypeName?.toLowerCase();
    console.log('DocumentsTable - Document type (lowercase):', docType);
    setSelectedDocumentId(doc.id);
    
    if (docType?.includes('aadhar')) {
      // Find the most recent successful verification log for Aadhar
      const verificationLog = doc.employee_docs_log
        .filter(log => log.action === 'verify_aadhar_otp' && log.response?.success === true)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
      
      setSelectedDocumentDetails(verificationLog || doc.employee_docs_log[0]);
      setDialogOpen(true);
      toast({
        title: "Viewing Aadhar verification details",
        description: "Showing verification information for this document."
      });
    } 
    else if (docType === 'pan') {
      // Find PAN verification log
      const panVerificationLog = doc.employee_docs_log.find(log => 
        log.action === 'verify_pan_api' && 
        log.response?.success === true && 
        log.response?.status_code === 200
      );
      
      if (panVerificationLog) {
        setSelectedPanDetails(panVerificationLog.response);
        setPanDialogOpen(true);
        toast({
          title: "Viewing PAN verification details",
          description: "Showing verification information for this document."
        });
      }
    }
    else if (docType === 'voter_id') {
      // Find Voter ID verification log
      const voterIdVerificationLog = doc.employee_docs_log.find(log => 
        log.action === 'verify_voter_id_api' && 
        log.response?.success === true && 
        log.response?.status_code === 200
      );
      
      if (voterIdVerificationLog) {
        setSelectedVoterIdDetails(voterIdVerificationLog.response);
        setVoterIdDialogOpen(true);
        toast({
          title: "Viewing Voter ID verification details",
          description: "Showing verification information for this document."
        });
      }
    }
    else if (docType?.includes('driving') || docType?.includes('license')) {
      console.log('DocumentsTable - This is a driving license document');
      console.log('DocumentsTable - Document logs:', doc.employee_docs_log);
      
      // Attempt to find any log with driving license verification data
      const drivingLicenseLog = doc.employee_docs_log?.find(log => 
        (log.action?.includes('driving') || log.action?.includes('license')) && 
        log.response
      );
      
      console.log('DocumentsTable - Found driving license log:', drivingLicenseLog);
      
      if (drivingLicenseLog) {
        // Set the driving license details and open the dialog
        setSelectedDrivingLicenseDetails(drivingLicenseLog.response);
        setDrivingLicenseDialogOpen(true);
        
        toast({
          title: "Viewing Driving License verification details",
          description: "Showing verification information for this document."
        });
      }
    }
    else if (docType === 'bank account' || docType?.includes('bank')) {
      console.log('DocumentsTable - This is a bank account document');
      console.log('DocumentsTable - Document logs:', doc.employee_docs_log);
      
      // Find the bank verification log specifically
      const bankVerificationLog = doc.employee_docs_log?.find(log => 
        log.action === 'bank_verification' && 
        log.response?.success === true && 
        log.response?.status_code === 200
      );
      
      console.log('DocumentsTable - Looking for bank verification log');
      console.log('DocumentsTable - Available logs:', doc.employee_docs_log?.map(log => log.action));
      console.log('DocumentsTable - Found bank verification log:', bankVerificationLog);
      
      if (bankVerificationLog) {
        console.log('DocumentsTable - Opening Bank Statement dialog with bank_verification log');
        setSelectedBankStatementDetails(bankVerificationLog.response);
        setBankStatementDialogOpen(true);
        
        toast({
          title: "Viewing Bank Account verification details",
          description: "Showing verification information for this document."
        });
      } else {
        console.log('DocumentsTable - No bank_verification log found');
        toast({
          title: "No verification details",
          description: "No bank verification details available for this document."
        });
      }
    }
  };

  // Helper function to check if document has comments
  const hasVerificationHistory = (doc: VerificationDocument): boolean => {
    const verificationHistory = (doc.params as any)?.verification_history;
    return Array.isArray(verificationHistory) && verificationHistory.length > 0;
  };

  // Helper to get "Verified by" employee name using verifiedByEmployeeId
  const getVerifiedByName = (doc: VerificationDocument): string | undefined => {
    // First check if we have verifiedByEmployeeId (new system)
    if (doc.verifiedByEmployeeId && employees.length > 0) {
      const employee = employees.find(emp => emp.id === doc.verifiedByEmployeeId);
      if (employee) {
        return `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || employee.name || employee.email;
      }
    }
    
    // Fallback to verification history (old system)
    const history = (doc.params as any)?.verification_history;
    if (!Array.isArray(history) || history.length === 0) return undefined;
    const withUser = history.filter((e: any) => e && e.verified_by);
    if (withUser.length === 0) return undefined;
    withUser.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return withUser[0].verified_by as string;
  };
  
  // Helper function to get proper document number display
  const getDisplayDocumentNumber = (doc: VerificationDocument): string => {
    const docType = doc.documentTypeName?.toLowerCase();
    
    if (docType === 'manual') {
      // For manual documents, show the proper verification name
      const selected = (doc.params as any)?.selected;
      return getManualVerificationDisplayName(selected) || 'Manual Verification';
    } else if (docType === 'other_documents' || docType === 'other') {
      // For other documents, show the document name provided during upload
      const documentName = (doc.params as any)?.document_name;
      return documentName || 'Other Document';
    } else {
      // For standard documents (Aadhar, PAN, etc.), show the document number
      return doc.documentNumber || '—';
    }
  };
  // Handle delete document
  const handleDeleteDocument = async (documentId: string) => {
    try {
      setIsDeleting(true);
      await deleteDocument(documentId);
      toast({
        title: 'Document Deleted',
        description: 'The document has been deleted successfully.',
      });
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
      
      // Trigger document refetch after deletion
      if (onDocumentAction) {
        onDocumentAction();
      }
    } catch (error) {
      console.error("Error in handleDeleteDocument:", error);
      toast({
        title: 'Error',
        description: 'Failed to delete document.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Open delete confirmation dialog
  const openDeleteDialog = (documentId: string) => {
    setDocumentToDelete(documentId);
    setDeleteDialogOpen(true);
  };
  
  return (
    <>
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Type</TableHead>
              <TableHead>Document #</TableHead>
              <TableHead>Uploaded</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Verified by</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((doc) => {
              const statusName = getDocumentStatusName(doc);
              const hasLogs = !!doc.employee_docs_log && doc.employee_docs_log.length > 0;
              const isGovernanceVerified = doc.verificationStatus === 'verified' && statusName === 'governance';
              const docType = doc.documentTypeName?.toLowerCase();
              const showCommentsIcon = docType === 'other' && hasVerificationHistory(doc);
              
              return (
                <TableRow key={doc.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getDocumentIcon(doc.documentTypeName || '')}
                      <span className="capitalize">{formatDocumentTypeName(doc.documentTypeName || '')}</span>
                    </div>
                  </TableCell>
                  <TableCell>{getDisplayDocumentNumber(doc)}</TableCell>
                  <TableCell>
                    {doc.createdAt ? formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true }) : '—'}
                  </TableCell>
                  <TableCell>
                    <VerificationStatusBadge 
                      status={doc.verificationStatus} 
                      documentStatusName={statusName}
                      isGovernance={isGovernanceVerified}
                      onClick={isGovernanceVerified && hasLogs ? () => handleBadgeClick(doc) : undefined}
                      documentLogs={doc.employee_docs_log}
                      documentId={doc.id}
                      documentType={docType}
                    />
                  </TableCell>
                  {/* Verified by Column */}
                  <TableCell className="text-right">
                    {(() => {
                      const name = getVerifiedByName(doc);
                      return name ? (
                        <div className="flex justify-end">
                          <Badge variant="softAmber" className="gap-1">
                            <User className="h-3.5 w-3.5" />
                            <span className="truncate max-w-[160px]">{name}</span>
                          </Badge>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      );
                    })()}
                  </TableCell>
                  
                  {/* Actions Column */}
                  <TableCell className="text-right">
                    <div className="flex items-center space-x-2 justify-end">
                      {/* Process Document Button - moved from Process column */}
{!(doc.verificationStatus === 'verified' || doc.verificationStatus === 'failed') && (
  <>
    {/* Quick-start API verification (hidden for Other types) */}
    {onQuickVerify && docType !== 'other' && docType !== 'other_documents' && docType !== 'manual' && (
      <Button
        variant="verifyApi"
        size="sm"
        onClick={() => onQuickVerify(doc.id, 'api')}
        title={`API verification${doc.documentTypeName ? ` for ${doc.documentTypeName}` : ''}`}
      >
        <Cpu className="h-4 w-4" />
        <span>Verify API</span>
      </Button>
    )}

    {/* Quick-start Manual verification */}
    {onQuickVerify && docType !== 'manual' && (
      <Button
        variant="verifyManual"
        size="sm"
        onClick={() => onQuickVerify(doc.id, 'manual')}
        title={`Manual verification${doc.documentTypeName ? ` for ${doc.documentTypeName}` : ''}`}
      >
        <Wrench className="h-4 w-4" />
        <span>Verify Manual</span>
      </Button>
    )}
  </>
)}
                       {showCommentsIcon && (
                         <Button 
                           variant="outline" 
                           size="sm"
                           onClick={() => handleCommentsClick(doc)}
                           title="View comments and verification history"
                           className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                         >
                           <MessageCircle className="h-4 w-4" />
                           <span className="sr-only">Comments</span>
                         </Button>
                       )}
                       
                       {/* Actions Menu Dropdown */}
                       <DropdownMenu>
                         <DropdownMenuTrigger asChild>
                           <Button variant="outline" size="sm" title="More actions">
                             <MoreVertical className="h-4 w-4" />
                             <span className="sr-only">More actions</span>
                           </Button>
                         </DropdownMenuTrigger>
                         <DropdownMenuContent align="end" className="w-40 bg-white border shadow-lg z-50">
                           <DropdownMenuItem 
                             onClick={() => handleViewDocument(doc.documentImage)}
                             className="cursor-pointer"
                           >
                             <Eye className="h-4 w-4 mr-2" />
                             View
                           </DropdownMenuItem>
                           <DropdownMenuItem 
                             onClick={() => handleDownloadDocument(doc.documentImage)}
                             className="cursor-pointer"
                           >
                             <Download className="h-4 w-4 mr-2" />
                             Download
                           </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => openDeleteDialog(doc.id)}
                              className="cursor-pointer text-red-600 focus:text-red-600"
                            >
                              <Trash className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                         </DropdownMenuContent>
                       </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Dialogs for document verification details */}
      <AadharDetailsDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        aadharDetails={selectedDocumentDetails}
      />
      
      <PanDetailsDialog
        open={panDialogOpen}
        onOpenChange={setPanDialogOpen}
        panDetails={selectedPanDetails}
        documentId={selectedDocumentId}
      />
      
      <VoterIdDetailsDialog
        open={voterIdDialogOpen}
        onOpenChange={setVoterIdDialogOpen}
        voterIdDetails={selectedVoterIdDetails}
        documentId={selectedDocumentId}
      />
      
      <DrivingLicenseDetailsDialog
        open={drivingLicenseDialogOpen}
        onOpenChange={setDrivingLicenseDialogOpen}
        licenseDetails={selectedDrivingLicenseDetails}
        documentId={selectedDocumentId}
      />
      
      <BankStatementDetailsDialog
        open={bankStatementDialogOpen}
        onOpenChange={setBankStatementDialogOpen}
        statementDetails={selectedBankStatementDetails}
        documentId={selectedDocumentId}
      />

      {/* Comments Dialog */}
      <DocumentCommentsDialog
        open={commentsDialogOpen}
        onOpenChange={setCommentsDialogOpen}
        verificationHistory={selectedVerificationHistory}
        documentId={selectedDocumentId}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this document? This action cannot be undone and will remove the document from storage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-600 hover:bg-red-700"
              onClick={(e) => {
                e.preventDefault();
                if (documentToDelete) {
                  handleDeleteDocument(documentToDelete);
                }
              }}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default DocumentsTable;
